/**
 * app/api/auth/magic-link/route.ts
 * 
 * Sends a Supabase magic link to the operator's email.
 * Phone number is no longer required — email only.
 * Free trial is a limited promotion — no restrictions on who can claim it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  let email: string, referralCode: string | undefined

  try {
    const body    = await req.json()
    email         = (body.email || '').trim().toLowerCase()
    referralCode  = body.referralCode || undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: CORS })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400, headers: CORS })
  }

  const supabase = getSupabase()

  // Send magic link via Supabase Auth
  const { error } = await supabase.auth.admin.generateLink({
    type:       'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app'}/landing`,
    },
  })

  if (error) {
    console.error('[magic-link] Error:', error.message)
    return NextResponse.json(
      { error: 'Could not send magic link. Please try again.' },
      { status: 500, headers: CORS }
    )
  }

  // Log referral code if provided — handled separately
  if (referralCode) {
    await supabase.from('referrals').insert({
      referred_email: email,
      referral_code:  referralCode,
      status:         'pending',
    }).throwOnError().then(() => {}).catch(() => {})
  }

  return NextResponse.json({ success: true }, { headers: CORS })
}
