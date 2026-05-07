/**
 * app/api/auth/session-login/route.ts
 *
 * Called by the extension popup when an operator signs in.
 * 
 * Checks the PROFILES table (the real live CIC user table) to validate
 * the operator exists and has active access, then writes a device session
 * to active_sessions — displacing any other logged-in device.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_ORIGINS = [
  `chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp`,
  'https://cic-app.pages.dev',
  'http://localhost:3000',
];

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const h = cors(origin);

  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: h });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400, headers: h });
  }

  // ── Check profiles table (the live CIC user table) ────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_status, trial_used')
    .eq('email', email)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: 'No account found. Sign up at chattersinnercircle.vercel.app first.' },
      { status: 404, headers: h }
    );
  }

  // ── Check plan is active ──────────────────────────────────────────────────
  // profiles.plan values: 'free' | 'pro' | 'basic'
  // profiles.plan_status: 'approved' | 'pending' | 'cancelled'
  const hasAccess = profile.plan_status === 'approved' &&
    (profile.plan === 'pro' || profile.plan === 'basic' ||
     (profile.plan === 'free' && !profile.trial_used));

  if (!hasAccess) {
    return NextResponse.json(
      { reason: 'expired', error: 'Your access has ended. Upgrade to Pro to continue.' },
      { status: 403, headers: h }
    );
  }

  // ── Check operators table for allow_multiple_devices ──────────────────────
  const { data: operatorRow } = await supabase
    .from('operators')
    .select('allow_multiple_devices')
    .eq('email', email)
    .maybeSingle();

  const allowMultiple = operatorRow?.allow_multiple_devices ?? false;

  // ── Generate session token ────────────────────────────────────────────────
  const sessionToken = crypto.randomBytes(32).toString('hex');

  // UPSERT — one row per email. Overwrites any existing session (device lock).
  await supabase
    .from('active_sessions')
    .upsert(
      {
        email,
        user_id:        profile.id,
        session_token:  sessionToken,
        allow_multiple: allowMultiple,
        logged_in_at:   new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  return NextResponse.json(
    {
      session_token: sessionToken,
      user: {
        email:       profile.email,
        plan:        profile.plan,
        plan_status: profile.plan_status,
      },
    },
    { status: 200, headers: h }
  );
}
