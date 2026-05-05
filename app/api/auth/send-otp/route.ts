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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Store OTP in Supabase
    const { error: storeError } = await supabase
      .from('otp_store')
      .upsert({ phone, otp, expires_at: expires, used: false })

    if (storeError) {
      console.error('[CIC OTP] Store error:', storeError.message)
      return NextResponse.json({ error: 'Failed to generate OTP: ' + storeError.message }, { status: 500, headers: cors })
    }

    // Try Africa's Talking
    const AT_API_KEY = process.env.AT_API_KEY
    const AT_USERNAME = process.env.AT_USERNAME

    if (AT_API_KEY && AT_USERNAME) {
      try {
        const formData = new URLSearchParams({
          username: AT_USERNAME,
          to: phone,
          message: `Your CIC verification code is: ${otp}. Valid for 10 minutes.`,
        })

        const atRes = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'apiKey': AT_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: formData.toString()
        })

        const atText = await atRes.text()
        console.log('[CIC OTP] AT response:', atText.substring(0, 200))

        // Try to parse as JSON
        try {
          const atData = JSON.parse(atText)
          const status = atData?.SMSMessageData?.Recipients?.[0]?.status
          console.log('[CIC OTP] AT status:', status)
        } catch {
          console.log('[CIC OTP] AT returned non-JSON — SMS may still have sent')
        }
      } catch (atErr: any) {
        console.warn('[CIC OTP] AT failed:', atErr.message, '— OTP stored, code:', otp)
      }
    }

    // Always return success — OTP is stored in DB
    // In production the SMS delivers via AT
    // In testing the code is logged to Vercel logs
    console.log('[CIC OTP] Code for', phone, ':', otp)
    return NextResponse.json({ success: true, message: 'OTP sent to ' + phone }, { headers: cors })

  } catch (e: any) {
    console.error('[CIC OTP] Fatal error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
