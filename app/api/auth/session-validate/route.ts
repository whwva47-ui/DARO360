/**
 * app/api/auth/session-validate/route.ts
 *
 * Called by the extension on every API request (generate, reengage, track).
 * Validates that the session token stored on this device is still
 * the current active session for this email.
 *
 * If another machine has since logged in, the token here is stale
 * and this returns 401 { reason: 'displaced' } — the popup shows
 * "You have been signed in on another device" and clears local storage.
 *
 * This route is also called on popup open (DOMContentLoaded) to catch
 * the case where the operator was displaced while the popup was closed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  let email: string, sessionToken: string;
  try {
    const body = await req.json();
    email        = (body.email         ?? '').trim().toLowerCase();
    sessionToken = (body.session_token ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: h });
  }

  if (!email || !sessionToken) {
    return NextResponse.json({ error: 'email and session_token required.' }, { status: 400, headers: h });
  }

  // ── Look up active session ────────────────────────────────────────────────
  const { data: session, error } = await supabase
    .from('active_sessions')
    .select('session_token, allow_multiple, logged_in_at')
    .eq('email', email)
    .maybeSingle();

  if (error || !session) {
    // No active session row — account may have been deactivated
    return NextResponse.json({ valid: false, reason: 'no_session' }, { status: 401, headers: h });
  }

  // Multi-device allowed for this user — skip token check
  if (session.allow_multiple) {
    return NextResponse.json({ valid: true }, { status: 200, headers: h });
  }

  // Token mismatch — this device was displaced by another login
  if (session.session_token !== sessionToken) {
    return NextResponse.json(
      { valid: false, reason: 'displaced',
        message: 'Your account was signed in on another device. You have been logged out here.' },
      { status: 401, headers: h }
    );
  }

  return NextResponse.json({ valid: true }, { status: 200, headers: h });
}
