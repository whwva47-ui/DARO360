import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }) }

export async function POST(req: Request) {
  try {
    const { stars, message, platform, token } = await req.json()
    if (!stars || stars < 1 || stars > 5) return NextResponse.json({ error: 'Rating 1-5 required' }, { status: 400, headers: cors })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await supabase.auth.getUser(token)

    await supabase.from('feedback').insert({ user_id: user?.id || null, stars, message: message || null, platform: platform || 'unknown' })
    return NextResponse.json({ success: true }, { headers: cors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
