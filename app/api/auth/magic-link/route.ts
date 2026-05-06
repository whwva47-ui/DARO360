import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = (body.email || '').toString().toLowerCase().trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400, headers: cors })
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app').replace(/\/$/, '')

    console.log('[CIC] Sending magic link to:', email)
    console.log('[CIC] Supabase URL:', supabaseUrl)
    console.log('[CIC] Redirect to:', siteUrl + '/api/auth/callback')

    // Call Supabase Auth REST API directly — more reliable than SDK
    const response = await fetch(`${supabaseUrl}/auth/v1/magiclink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        redirect_to: `${siteUrl}/api/auth/callback`,
      })
    })

    const responseText = await response.text()
    console.log('[CIC] Supabase response status:', response.status)
    console.log('[CIC] Supabase response:', responseText.substring(0, 200))

    if (!response.ok) {
      let errMsg = 'Failed to send magic link'
      try { errMsg = JSON.parse(responseText).msg || errMsg } catch {}
      return NextResponse.json({ error: errMsg }, { status: 400, headers: cors })
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent. Check your email.'
    }, { headers: cors })

  } catch (e: any) {
    console.error('[CIC] Magic link error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
