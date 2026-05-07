import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app'

  if (!email) {
    return NextResponse.redirect(new URL('/guide?upgrade=true', siteUrl))
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_status')
    .eq('email', email.toLowerCase())
    .single()

  if (!profile || profile.plan !== 'pro' || profile.plan_status !== 'active') {
    return NextResponse.redirect(new URL('/guide?upgrade=true', siteUrl))
  }

  // Pro user — redirect to print-ready guide
  return NextResponse.redirect(new URL('/guide?print=true', siteUrl))
}
