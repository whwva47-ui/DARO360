/**
 * app/api/auth/extension-login/route.ts
 *
 * Issues a 5-minute one-time token for the popup → webapp handoff.
 * When an operator clicks "Open App" in the extension popup,
 * this route issues a token. The webapp calls verify-token to exchange
 * it for a session. Not called during normal extension login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@getSupabase()/getSupabase()-js';
import crypto from 'crypto';


export const dynamic = 'force-dynamic';
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
    return NextResponse.json({ error: 'Email required.' }, { status: 400, headers: h });
  }

  const { data: profile, error } = await getSupabase()
    .from('profiles')
    .select('id, email, plan, plan_status')
    .eq('email', email)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      { error: 'Email not registered. Sign up at chattersinnercircle.vercel.app first.' },
      { status: 404, headers: h }
    );
  }

  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await getSupabase().from('extension_tokens').insert({
    user_id:    profile.id,
    email:      profile.email,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    used:       false,
  });

  return NextResponse.json({ token: rawToken }, { status: 200, headers: h });
}
