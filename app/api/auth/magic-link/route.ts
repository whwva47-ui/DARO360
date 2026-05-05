// Magic link signup/signin
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(req: Request) {
  try {
    const { email, phone, referralCode } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400, headers: cors })
    }
    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400, headers: cors })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if email already registered
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, plan')
      .eq('email', email.toLowerCase())
      .single()

    // Check if phone already used
    const { data: phoneExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single()

    if (phoneExists && !existing) {
      return NextResponse.json({
        error: 'This phone number is already registered with another account.'
      }, { status: 400, headers: cors })
    }

    // Send magic link via Supabase Auth
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: { phone, referralCode: referralCode || null }
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400, headers: cors })
    }

    // Send branded email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Chatter\'s Inner Circle <noreply@cic.app>',
      to: email,
      subject: 'Your magic link to Chatter\'s Inner Circle',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d18;color:#e2e8f0;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;background:linear-gradient(135deg,#7c3aed,#d4a300);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:24px;">💬</span>
            </div>
            <h1 style="color:#a855f7;margin:0;font-size:22px;">Chatter's Inner Circle</h1>
            <p style="color:#71767b;margin:4px 0 0;">AI Reply Assistant</p>
          </div>
          <p style="color:#e2e8f0;">Click the button below to sign in. This link expires in 1 hour.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{MAGIC_LINK}" style="background:linear-gradient(135deg,#7c3aed,#d4a300);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Sign In to CIC</a>
          </div>
          <p style="color:#71767b;font-size:13px;">If you didn't request this, ignore this email.</p>
          <hr style="border:1px solid #1e1e32;margin:24px 0;">
          <p style="color:#444460;font-size:12px;text-align:center;">Chatter's Inner Circle &copy; 2026</p>
        </div>
      `
    }).catch(() => {}) // Don't fail if Resend has issues — Supabase already sent

    return NextResponse.json({
      success: true,
      message: 'Magic link sent. Check your email.',
      isNewUser: !existing
    }, { headers: cors })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors })
  }
}
