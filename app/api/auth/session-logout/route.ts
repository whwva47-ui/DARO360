/**
 * app/api/auth/session-logout/route.ts
 *
 * Clears the operator's active_sessions row on sign out.
 * Fire-and-forget from the extension — always succeeds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  try {
    const body         = await req.json();
    const email        = (body.email          ?? '').trim().toLowerCase();
    const sessionToken = (body.session_token  ?? '').trim();

    if (email && sessionToken) {
      await supabase
        .from('active_sessions')
        .delete()
        .eq('email', email)
        .eq('session_token', sessionToken);
    }
  } catch { /* always return success — client clears storage regardless */ }

  return NextResponse.json({ success: true }, { status: 200, headers: h });
}
