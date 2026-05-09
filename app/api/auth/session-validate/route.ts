/**
 * app/api/auth/session-validate/route.ts
 *
 * Validates a session token against active_sessions.
 * Called by the extension before every generate request.
 * Returns displaced: true if another device has since logged in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@getSupabase()/getSupabase()-js';


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

  let email: string, sessionToken: string;
  try {
    const body   = await req.json();
    email        = (body.email          ?? '').trim().toLowerCase();
    sessionToken = (body.session_token  ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: h });
  }

  if (!email || !sessionToken) {
    return NextResponse.json({ error: 'email and session_token required.' }, { status: 400, headers: h });
  }

  const { data: session, error } = await getSupabase()
    .from('active_sessions')
    .select('session_token, allow_multiple')
    .eq('email', email)
    .maybeSingle();

  if (error || !session) {
    return NextResponse.json({ valid: false, reason: 'no_session' }, { status: 401, headers: h });
  }

  if (session.allow_multiple) {
    return NextResponse.json({ valid: true }, { status: 200, headers: h });
  }

  if (session.session_token !== sessionToken) {
    return NextResponse.json(
      { valid: false, reason: 'displaced', message: 'Your account was signed in on another device.' },
      { status: 401, headers: h }
    );
  }

  return NextResponse.json({ valid: true }, { status: 200, headers: h });
}
