/**
 * app/api/auth/verify-token/route.ts
 *
 * Called by cic-app.pages.dev when it receives ?token= in the URL.
 * Validates the one-time token and returns the profile so the webapp
 * can set its session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_ORIGINS = [
  'https://cic-app.pages.dev',
  `chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp`,
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

  let token: string;
  try {
    const body = await req.json();
    token = (body.token ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: h });
  }

  if (!token) {
    return NextResponse.json({ error: 'Token required.' }, { status: 400, headers: h });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data: record, error: lookupErr } = await supabase
    .from('extension_tokens')
    .select('id, user_id, email, expires_at, used')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (lookupErr || !record) {
    return NextResponse.json({ error: 'Invalid login link. Sign in again from the extension.' }, { status: 401, headers: h });
  }

  if (new Date(record.expires_at) < new Date()) {
    await supabase.from('extension_tokens').delete().eq('id', record.id);
    return NextResponse.json({ error: 'Login link expired. Sign in again from the extension.' }, { status: 401, headers: h });
  }

  if (record.used) {
    return NextResponse.json({ error: 'Login link already used. Sign in again.' }, { status: 401, headers: h });
  }

  // Mark used immediately — single use
  await supabase.from('extension_tokens').update({ used: true }).eq('id', record.id);

  // Fetch profile (the real live user table)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, plan, plan_status, daily_generations, max_daily_generations')
    .eq('id', record.user_id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404, headers: h });
  }

  return NextResponse.json(
    {
      user: {
        id:                    profile.id,
        email:                 profile.email,
        plan:                  profile.plan,
        plan_status:           profile.plan_status,
        daily_generations:     profile.daily_generations,
        max_daily_generations: profile.max_daily_generations,
      }
    },
    { status: 200, headers: h }
  );
}
