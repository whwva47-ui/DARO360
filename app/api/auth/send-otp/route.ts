import { NextResponse } from 'next/server'

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000

    // Store in global (use Redis in production)
    if (!global._cicOtpStore) global._cicOtpStore = new Map()
    global._cicOtpStore.set(phone, { otp, expires })

    const AT_API_KEY = process.env.AT_API_KEY
    const AT_USERNAME = process.env.AT_USERNAME || 'sandbox'

    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: phone,
      message: `Your Chatter's Inner Circle code is: ${otp}. Valid 10 minutes. Do not share.`,
      from: 'CIC'
    })

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    })

    const result = await res.json()
    console.log('[CIC OTP] Sent to', phone, '— Status:', result?.SMSMessageData?.Recipients?.[0]?.status)

    return NextResponse.json({ success: true }, { headers: cors })

  } catch (e: any) {
    console.error('[CIC OTP] Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
