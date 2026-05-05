import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key' }
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }) }

export async function GET(req: Request) {
  const adminKey = req.headers.get('X-Admin-Key')
  if (adminKey !== 'cic_admin_2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: proRequests }, { data: users }, { data: feedback }] = await Promise.all([
    supabase.from('pro_requests').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return NextResponse.json({ proRequests, users, feedback }, { headers: cors })
}
