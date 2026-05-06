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
    const { email, referralCode } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400, headers: cors })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        data: { referralCode: referralCode || null }
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400, headers: cors })
    }

    return NextResponse.json({ success: true, message: 'Magic link sent. Check your email.' }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
