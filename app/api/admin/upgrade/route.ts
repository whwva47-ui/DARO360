import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get('X-Admin-Key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'cic_admin_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
    }

    const { userId, plan } = await req.json()
    if (!userId || !plan) {
      return NextResponse.json({ error: 'userId and plan required' }, { status: 400, headers: cors })
    }

    const validPlans = ['trial', 'basic', 'pro', 'expired']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Use: trial, basic, pro, expired' }, { status: 400, headers: cors })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors })
    }

    // Build update object based on plan
    const proExpires = new Date()
    proExpires.setMonth(proExpires.getMonth() + 1)

    const updates: any = {
      plan,
      plan_status: plan === 'expired' ? 'expired' : 'active',
      updated_at: new Date().toISOString(),
    }

    if (plan === 'pro') {
      updates.pro_approved_at = new Date().toISOString()
      updates.pro_expires_at = proExpires.toISOString()
    }

    if (plan === 'trial') {
      updates.trial_started_at = new Date().toISOString()
      updates.trial_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500, headers: cors })
    }

    // Send email notification to user
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const planMessages: Record<string, string> = {
        pro: `Your account has been upgraded to Pro. You now have unlimited message generations. Your subscription runs until ${proExpires.toLocaleDateString()}.`,
        basic: 'Your account has been set to Basic plan. You have 50 message generations per 4 days.',
        trial: 'Your free trial has been restarted. You have 7 days of full access.',
        expired: 'Your account plan has expired. Please upgrade to continue using CIC.',
      }

      await resend.emails.send({
        from: "Chatter's Inner Circle <noreply@resend.dev>",
        to: profile.email,
        subject: `Your CIC plan has been updated to ${plan.toUpperCase()}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d18;color:#e2e8f0;border-radius:12px;">
            <h2 style="color:#a855f7;">Plan Updated</h2>
            <p>${planMessages[plan]}</p>
            <p style="color:#71767b;font-size:13px;">If you have any questions contact us at whwva47@gmail.com</p>
          </div>
        `
      })
    } catch (emailErr: any) {
      console.warn('[CIC Admin] Email send failed:', emailErr.message)
    }

    console.log(`[CIC Admin] ${profile.email} upgraded to ${plan} by admin`)

    return NextResponse.json({
      success: true,
      message: `${profile.email} successfully changed to ${plan}`,
      plan
    }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
