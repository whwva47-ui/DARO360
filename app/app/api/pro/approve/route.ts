import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key' }
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }) }

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get('X-Admin-Key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
    }

    const { requestId, action, notes } = await req.json()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data: proReq } = await supabase.from('pro_requests').select('*').eq('id', requestId).single()
    if (!proReq) return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: cors })

    if (action === 'approve') {
      const proExpires = new Date()
      proExpires.setMonth(proExpires.getMonth() + 1)

      await supabase.from('profiles').update({
        plan: 'pro', plan_status: 'active',
        pro_approved_at: new Date().toISOString(),
        pro_expires_at: proExpires.toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', proReq.user_id)

      await supabase.from('pro_requests').update({
        status: 'approved', admin_notes: notes || null, reviewed_at: new Date().toISOString()
      }).eq('id', requestId)

      // Check referral — award points if this user was referred
      const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', proReq.user_id).single()
      if (profile?.referred_by) {
        await supabase.from('profiles').update({ points: supabase.rpc('points', { inc: 150 }) }).eq('referral_code', profile.referred_by)
      }

      await resend.emails.send({
        from: "Chatter's Inner Circle <noreply@cic.app>",
        to: proReq.email,
        subject: '✅ Your Pro Access is Live!',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d18;color:#e2e8f0;border-radius:12px;">
            <h2 style="color:#a855f7;">Welcome to Pro! 🎉</h2>
            <p>Your Pro subscription is now active. You have unlimited message generations.</p>
            <p>Your subscription renews on: <b>${proExpires.toLocaleDateString()}</b></p>
            <p>Open your extension and enjoy unlimited AI replies!</p>
          </div>
        `
      })
    } else {
      await supabase.from('pro_requests').update({ status: 'rejected', admin_notes: notes, reviewed_at: new Date().toISOString() }).eq('id', requestId)
      await resend.emails.send({
        from: "Chatter's Inner Circle <noreply@cic.app>",
        to: proReq.email,
        subject: 'Pro Request Update',
        html: `<p>Your Pro request could not be approved at this time. ${notes || 'Please contact support.'}</p>`
      })
    }

    return NextResponse.json({ success: true, action }, { headers: cors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
