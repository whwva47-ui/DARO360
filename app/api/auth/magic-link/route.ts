/**
 * app/api/auth/magic-link/route.ts
 *
 * Sends a Supabase magic link to the operator's email.
 * Uses signInWithOtp() which actually SENDS the email.
 * (generateLink only returns a URL — it does NOT send anything.)
 *
 * SUPABASE SETUP REQUIRED:
 * Go to Supabase Dashboard → Authentication → URL Configuration
 * Add to "Redirect URLs":
 *   https://chattersinnercircle.vercel.app/landing
 *   https://chattersinnercircle.vercel.app
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  let email: string, referralCode: string | undefined

  try {
    const body   = await req.json()
    email        = (body.email || '').trim().toLowerCase()
    referralCode = body.referralCode || undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: CORS })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { error: 'A valid email address is required.' },
      { status: 400, headers: CORS }
    )
  }

  // Use ANON key — signInWithOtp is a client-side operation
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // signInWithOtp SENDS the magic link email via Supabase's built-in email service
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/landing`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('[magic-link] Supabase error:', error.message)

    if (error.message?.includes('rate limit') || error.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429, headers: CORS }
      )
    }

    return NextResponse.json(
      { error: 'Could not send magic link. Please try again.' },
      { status: 500, headers: CORS }
    )
  }

  // Log referral if provided — non-fatal
  if (referralCode) {
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await admin.from('referrals').insert({
        referred_email: email,
        referral_code:  referralCode,
        status:         'pending',
      })
    } catch (e) {
      console.warn('[magic-link] Referral log failed:', e)
    }
  }

  return NextResponse.json({ success: true }, { headers: CORS })
}
