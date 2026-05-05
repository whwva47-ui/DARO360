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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify OTP from Supabase store
    const { data: otpRecord } = await supabase
      .from('otp_store')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .single()

    if (!otpRecord) {
      return NextResponse.json({ error: 'OTP not found. Please request a new one.' }, { status: 400, headers: cors })
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400, headers: cors })
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400, headers: cors })
    }

    // Mark OTP as used — one time only
    await supabase.from('otp_store').update({ used: true }).eq('phone', phone)

    // Check if phone already registered to a different email
    const { data: phoneProfile } = await supabase
      .from('profiles')
      .select('id, email, plan, trial_started_at')
      .eq('phone', phone)
      .single()

    if (phoneProfile && email && phoneProfile.email !== email.toLowerCase()) {
      return NextResponse.json({
        error: 'This phone number is already registered to a different account.',
        existingEmail: phoneProfile.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      }, { status: 400, headers: cors })
    }

    // Check trial cooldown — phone already used for trial
    const hadTrial = phoneProfile && phoneProfile.trial_started_at
    const isExpired = phoneProfile && phoneProfile.plan === 'expired'

    return NextResponse.json({
      success: true,
      verified: true,
      existingAccount: !!phoneProfile,
      hadTrial: !!hadTrial,
      isExpired: !!isExpired,
      plan: phoneProfile?.plan || null
    }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
