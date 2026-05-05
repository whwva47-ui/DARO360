import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }) }

export async function POST(req: Request) {
  try {
    const { token, paymentMethod, paymentReference } = await req.json()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    // Create pro request
    await supabase.from('pro_requests').insert({
      user_id: user.id, email: user.email, phone: profile?.phone,
      payment_method: paymentMethod, payment_reference: paymentReference
    })

    // Update profile status
    await supabase.from('profiles').update({ pro_requested_at: new Date().toISOString() }).eq('id', user.id)

    // Notify admin
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'CIC System <noreply@cic.app>',
      to: 'whwva47@gmail.com',
      subject: '🔔 New Pro Upgrade Request',
      html: `
        <h2>New Pro Request</h2>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Phone:</b> ${profile?.phone || 'Not provided'}</p>
        <p><b>Payment:</b> ${paymentMethod} — Ref: ${paymentReference}</p>
        <p><b>Approve:</b> <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin">Go to Admin Panel</a></p>
      `
    })

    // Send payment instructions to user
    await resend.emails.send({
      from: "Chatter's Inner Circle <noreply@cic.app>",
      to: user.email,
      subject: 'Pro Upgrade Request Received',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d18;color:#e2e8f0;border-radius:12px;">
          <h2 style="color:#a855f7;">Pro Upgrade Request Received</h2>
          <p>We received your Pro upgrade request. Here are the payment details:</p>
          <div style="background:#1a1a2e;padding:16px;border-radius:8px;margin:16px 0;">
            <p><b>M-Pesa Paybill:</b> 522522<br>Account Number: 1280446110<br>Amount: KES 1,950 (~$15)</p>
            <p><b>PayPal:</b> kagwe.felix@gmail.com<br>Amount: $15</p>
          </div>
          <p>Send your payment reference to confirm. Your account will be approved within 24 hours.</p>
          <p style="color:#71767b;font-size:13px;">This payment information is confidential — do not share it.</p>
        </div>
      `
    })

    return NextResponse.json({ success: true, message: 'Request submitted. Check your email for payment instructions.' }, { headers: cors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
