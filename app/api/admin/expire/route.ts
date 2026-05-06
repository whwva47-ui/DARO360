import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-Cron-Secret',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function GET(req: Request) {
  return POST(req)
}

export async function POST(req: Request) {
  // Accept both admin key and cron secret
  const adminKey = req.headers.get('X-Admin-Key')
  const cronSecret = req.headers.get('X-Cron-Secret')
  
  if (adminKey !== 'cic_admin_2026' && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()
  const results: any = {}

  // 1. Expire Pro accounts past their expiry date
  const { data: expiredPro, error: proErr } = await supabase
    .from('profiles')
    .update({ plan: 'basic', plan_status: 'active', updated_at: now })
    .eq('plan', 'pro')
    .lt('pro_expires_at', now)
    .select('email, pro_expires_at')

  results.expiredPro = expiredPro?.length || 0
  if (proErr) results.proError = proErr.message

  // 2. Expire trial accounts past day 7
  const day7ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: expiredTrials, error: trialErr } = await supabase
    .from('profiles')
    .update({ plan: 'expired', plan_status: 'expired', updated_at: now })
    .eq('plan', 'trial')
    .lt('trial_started_at', day7ago)
    .select('email')

  results.expiredTrials = expiredTrials?.length || 0
  if (trialErr) results.trialError = trialErr.message

  // 3. Convert 1500+ points to Pro renewal
  const { data: richUsers } = await supabase
    .from('profiles')
    .select('id, email, points, plan')
    .gte('points', 1500)
    .neq('plan', 'pro')

  let renewals = 0
  if (richUsers) {
    for (const u of richUsers) {
      const monthsEarned = Math.floor(u.points / 1500)
      const proExpires = new Date()
      proExpires.setMonth(proExpires.getMonth() + monthsEarned)
      await supabase.from('profiles').update({
        plan: 'pro',
        plan_status: 'active',
        pro_expires_at: proExpires.toISOString(),
        points: u.points - (monthsEarned * 1500),
        updated_at: now
      }).eq('id', u.id)
      renewals++
    }
  }
  results.pointRenewals = renewals

  console.log('[CIC Expiry] Results:', JSON.stringify(results))

  return NextResponse.json({
    success: true,
    timestamp: now,
    ...results
  }, { headers: cors })
}
