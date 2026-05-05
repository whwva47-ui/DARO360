import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(req: Request) {
  try {
    const { email, phone, referralCode } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400, headers: cors })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check existing email
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id, plan, phone, trial_used')
      .eq('email', email.toLowerCase())
      .single()

    // Check existing phone (trial cooldown)
    if (phone) {
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id, email, plan, trial_used')
        .eq('phone', phone)
        .single()

      if (existingPhone && !existingEmail) {
        // Phone used by different account
        return NextResponse.json({
          error: 'This phone number is already registered with another account. Each phone number can only be used once.'
        }, { status: 400, headers: cors })
      }

      if (existingPhone && existingPhone.trial_used && !existingEmail) {
        // Phone already had a trial on a different email
        return NextResponse.json({
          error: 'A free trial has already been used with this phone number. Please sign in to your existing account or upgrade to continue.'
        }, { status: 400, headers: cors })
      }
    }

    // Send magic link via Supabase Auth
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        data: { phone: phone || null, referralCode: referralCode || null }
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400, headers: cors })
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent. Check your email.',
      isNewUser: !existingEmail,
      isReturning: !!existingEmail
    }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
