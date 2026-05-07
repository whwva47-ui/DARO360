import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(req: Request) {
  try {
    const { email, tone, action, platform, messageLength } = await req.json()
    if (!tone || !action) return NextResponse.json({ ok: true }, { headers: cors })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user id from email
    let userId = null
    if (email) {
      const { data } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).single()
      userId = data?.id || null
    }

    // Store usage record
    await supabase.from('reply_usage').insert({
      user_id: userId,
      email: email || null,
      tone: tone,
      action: action, // 'copy' or 'type'
      platform: platform || 'unknown',
      message_length: messageLength || 0,
      used_at: new Date().toISOString()
    })

    return NextResponse.json({ ok: true }, { headers: cors })
  } catch (e: any) {
    return NextResponse.json({ ok: true }, { headers: cors }) // Never fail silently
  }
}
