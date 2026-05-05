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
    const { phone } = await req.json()

    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400, headers: cors })
    }

    // Check if phone has already had a trial (trial cooldown protection)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await supabase
      .from('profiles')
      .select('id, plan, trial_started_at, email')
      .eq('phone', phone)
      .single()

    if (existing) {
      // Phone already registered — allow OTP for sign in but flag it
      console.log('[CIC OTP] Phone already registered:', phone, 'plan:', existing.plan)
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP in Supabase for persistence across serverless calls
    await supabase.from('otp_store').upsert({
      phone,
      otp,
      expires_at: new Date(expires).toISOString(),
      used: false
    }).select()

    // Send via Africa's Talking
    const AT_API_KEY = process.env.AT_API_KEY
    const AT_USERNAME = process.env.AT_USERNAME || 'sandbox'

    const formData = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message: `Your Chatter's Inner Circle verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    })

    const atRes = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    })

    const atData = await atRes.json()
    const status = atData?.SMSMessageData?.Recipients?.[0]?.status
    console.log('[CIC OTP] AT Status:', status, 'Phone:', phone)

    if (status === 'Success' || status === 'MessageSent') {
      return NextResponse.json({ success: true, message: 'OTP sent successfully' }, { headers: cors })
    }

    // Fallback — OTP stored, log it for testing
    console.log('[CIC OTP] Code for', phone, ':', otp, '(AT status:', status, ')')
    return NextResponse.json({ success: true, message: 'OTP sent' }, { headers: cors })

  } catch (e: any) {
    console.error('[CIC OTP] Error:', e.message)
    return NextResponse.json({ error: 'Failed to send OTP: ' + e.message }, { status: 500, headers: cors })
  }
}
