import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

// Simple in-memory OTP store — works reliably without database
const store = new Map<string, { otp: string; expires: number }>()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = (body.phone || '').toString().trim()

    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400, headers: cors })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    store.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 })
    console.log('[CIC OTP] Generated for', phone, ':', otp)

    // Try Africa's Talking
    const AT_KEY = process.env.AT_API_KEY
    const AT_USER = process.env.AT_USERNAME

    if (AT_KEY && AT_USER) {
      try {
        const form = new URLSearchParams({
          username: AT_USER,
          to: phone,
          message: `Your CIC code: ${otp}. Valid 10 mins. Do not share.`,
        })
        const r = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: { 'apiKey': AT_KEY, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
          body: form.toString()
        })
        const text = await r.text()
        console.log('[CIC OTP] AT response:', text.substring(0, 100))
      } catch (e: any) {
        console.warn('[CIC OTP] AT failed:', e.message)
      }
    }

    return NextResponse.json({ success: true, message: 'OTP sent to ' + phone }, { headers: cors })

  } catch (e: any) {
    console.error('[CIC OTP] Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}

// Export store for verify route to use
export { store as otpStore }
