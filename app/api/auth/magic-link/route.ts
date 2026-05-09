/**
 * app/api/auth/magic-link/route.ts
 *
 * Sends a Supabase magic link to the operator's email.
 * Uses signInWithOtp() — the ONLY method that actually sends the email.
 * generateLink() returns a URL but does NOT send anything.
 *
 * SUPABASE SETUP (one-time):
 * Dashboard → Authentication → URL Configuration → Redirect URLs → Add:
 *   https://chattersinnercircle.vercel.app/landing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let email: string;
  let referralCode: string | undefined;

  try {
    const body   = await req.json();
    email        = (body.email || '').trim().toLowerCase();
    referralCode = body.referralCode || undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: CORS });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { error: 'A valid email address is required.' },
      { status: 400, headers: CORS }
    );
  }

  // Use ANON key — signInWithOtp is designed for client-side / server-side OTP sending
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:  `${SITE_URL}/landing`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('[magic-link] Error:', error.message);
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429, headers: CORS }
      );
    }
    return NextResponse.json(
      { error: 'Could not send magic link. Please try again.' },
      { status: 500, headers: CORS }
    );
  }

  // Log referral code if provided — non-fatal, uses correct schema columns
  if (referralCode) {
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      // referrals table: id, referrer_id, referred_id, points_awarded, converted_to_pro, created_at
      // We store the referral code in admin_notes on pro_requests instead — referrals table
      // uses UUID IDs not email strings
      await admin.from('pro_requests').insert({
        email,
        request_type:   'referral_signup',
        payment_method: referralCode,
        status:         'pending',
      });
    } catch (e) {
      console.warn('[magic-link] Referral log failed:', e);
    }
  }

  return NextResponse.json({ success: true }, { headers: CORS });
}
