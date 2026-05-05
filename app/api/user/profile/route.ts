// Get user profile, plan status, usage, points
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: cors })

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })
        .select()
        .single()
      profile = newProfile
    }

    // Get today's usage
    const { data: todayUsage } = await supabase
      .from('usage_logs')
      .select('generations')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    // Calculate daily limit based on trial day
    const trialStart = new Date(profile.trial_started_at)
    const daysSinceTrial = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
    
    let dailyLimit = 999999
    let planDisplay = profile.plan

    if (profile.plan === 'pro' && profile.plan_status === 'active') {
      dailyLimit = 999999
    } else if (profile.plan === 'expired') {
      dailyLimit = 0
    } else if (profile.plan === 'basic') {
      dailyLimit = 50
    } else {
      // Trial degradation
      if (daysSinceTrial < 3) dailyLimit = 999999
      else if (daysSinceTrial === 3) dailyLimit = 40
      else if (daysSinceTrial === 4) dailyLimit = 30
      else if (daysSinceTrial === 5) dailyLimit = 20
      else if (daysSinceTrial === 6) dailyLimit = 10
      else {
        dailyLimit = 0
        planDisplay = 'expired'
        // Mark as expired
        await supabase.from('profiles').update({ plan: 'expired', plan_status: 'expired' }).eq('id', user.id)
      }
    }

    const usedToday = todayUsage?.generations || 0
    const remaining = Math.max(0, dailyLimit === 999999 ? 999999 : dailyLimit - usedToday)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: profile.phone,
      plan: planDisplay,
      planStatus: profile.plan_status,
      dailyLimit,
      usedToday,
      remaining,
      totalGenerations: profile.total_generations,
      points: profile.points,
      referralCode: profile.referral_code,
      trialDay: daysSinceTrial + 1,
      trialExpires: profile.trial_expires_at,
      proExpires: profile.pro_expires_at,
    }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
