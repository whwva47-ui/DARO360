/**
 * app/api/auth/extension-login/route.ts
 * 
 * Issues a 5-minute one-time token after validating the operator
 * exists in the PROFILES table (the real live CIC user table).
 * Token is used by the popup to open cic-app.pages.dev/?token=TOKEN
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
    return NextResponse.json({ error: 'Email required.' }, { status: 400, headers: h });
  }

  // ── Look up in profiles (the real live user table) ────────────────────────
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_status, trial_used')
    .eq('email', email)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      { error: 'Email not registered. Sign up at chattersinnercircle.vercel.app first.' },
      { status: 404, headers: h }
    );
  }

  // ── Generate short-lived token ────────────────────────────────────────────
  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await supabase.from('extension_tokens').insert({
    user_id:    profile.id,
    email:      profile.email,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    used:       false,
  });

  return NextResponse.json({ token: rawToken }, { status: 200, headers: h });
}
