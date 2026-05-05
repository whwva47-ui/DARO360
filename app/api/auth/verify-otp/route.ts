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
    const { phone, otp, email } = await req.json()
    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400, headers: cors })
    }

    // Check OTP
    const store = global._cicOtpStore
    const stored = store?.get(phone)
    if (!stored) return NextResponse.json({ error: 'OTP expired or not sent' }, { status: 400, headers: cors })
    if (Date.now() > stored.expires) {
      store.delete(phone)
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400, headers: cors })
    }
    if (stored.otp !== otp.toString()) {
      return NextResponse.json({ error: 'Invalid OTP. Try again.' }, { status: 400, headers: cors })
    }
    store.delete(phone) // One time use

    // Check if phone is already registered to a different email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: phoneProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone', phone)
      .single()

    if (phoneProfile && email && phoneProfile.email !== email.toLowerCase()) {
      return NextResponse.json({
        error: 'This phone number is already registered with a different account.'
      }, { status: 400, headers: cors })
    }

    return NextResponse.json({
      success: true,
      verified: true,
      existingAccount: !!phoneProfile
    }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
