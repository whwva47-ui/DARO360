import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const email = (body.email || '').toString().trim()

    console.log('[CIC] Magic link for:', email)

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400, headers: cors })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app'

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${siteUrl}/api/auth/callback`,
      }
    })

    if (error) {
      console.log('[CIC] Supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400, headers: cors })
    }

    return NextResponse.json({ success: true, message: 'Check your email for a sign-in link.' }, { headers: cors })

  } catch (e: any) {
    console.error('[CIC] Magic link error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
