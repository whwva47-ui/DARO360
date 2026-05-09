/**
 * app/api/auth/session-login/route.ts
 *
 * Called by the extension popup on sign-in.
 * 1. Validates operator exists in profiles
 * 2. Checks plan is active using trial_ends_at and plan_expires_at
 * 3. Issues a session token → writes to active_sessions (device lock)
 * 4. Returns session token + full profile to popup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ALLOWED_ORIGINS = [
  'chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp',
  'https://chattersinnercircle.vercel.app',
  'https://cic-app.pages.dev',
  'http://localhost:3000',
];

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const h      = cors(origin);

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

  // ── Fetch full profile ─────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_status, trial_ends_at, plan_expires_at, daily_generations, max_daily_generations, total_generations')
    .eq('email', email)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: 'No account found. Sign up at chattersinnercircle.vercel.app first.' },
      { status: 404, headers: h }
    );
  }

  // ── Check access using actual date fields (not trial_used which is never set) ──
  const now = new Date();

  if (profile.plan_status !== 'approved') {
    return NextResponse.json(
      { reason: 'not_approved', error: 'Your account is not approved yet. Contact admin.' },
      { status: 403, headers: h }
    );
  }

  if (profile.plan === 'free') {
    // Free = trial — check trial_ends_at
    if (!profile.trial_ends_at || new Date(profile.trial_ends_at) < now) {
      return NextResponse.json(
        { reason: 'expired', error: 'Your 7-day trial has ended. Upgrade to Basic ($8/mo) or Pro ($15/mo) to continue.', upgrade: true },
        { status: 403, headers: h }
      );
    }
  } else if (profile.plan === 'basic' || profile.plan === 'pro') {
    // Paid plans — check plan_expires_at (null = no expiry)
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) < now) {
      return NextResponse.json(
        { reason: 'expired', error: 'Your plan has expired. Please renew to continue.', upgrade: true },
        { status: 403, headers: h }
      );
    }
  }

  // ── Check allow_multiple_devices from operators table ────────────────────
  const { data: operatorRow } = await supabase
    .from('operators')
    .select('allow_multiple_devices')
    .eq('email', email)
    .maybeSingle();

  const allowMultiple = operatorRow?.allow_multiple_devices ?? false;

  // ── Generate session token and write to active_sessions (device lock) ─────
  const sessionToken = crypto.randomBytes(32).toString('hex');

  await supabase
    .from('active_sessions')
    .upsert(
      {
        email,
        user_id:        profile.id,
        session_token:  sessionToken,
        allow_multiple: allowMultiple,
        logged_in_at:   now.toISOString(),
      },
      { onConflict: 'email' }
    );

  return NextResponse.json(
    {
      session_token: sessionToken,
      user: {
        email:                 profile.email,
        plan:                  profile.plan,
        plan_status:           profile.plan_status,
        trial_ends_at:         profile.trial_ends_at,
        plan_expires_at:       profile.plan_expires_at,
        daily_generations:     profile.daily_generations,
        max_daily_generations: profile.max_daily_generations,
        total_generations:     profile.total_generations,
      },
    },
    { status: 200, headers: h }
  );
}
