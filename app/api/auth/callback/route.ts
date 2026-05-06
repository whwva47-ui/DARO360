import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const siteUrl = 'https://chattersinnercircle.vercel.app'

  console.log('[CIC] Callback received - code:', !!code, 'token_hash:', !!token_hash, 'type:', type)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    let userId = null
    let userEmail = null

    // Handle both PKCE (code) and magic link (token_hash) flows
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error && data.user) {
        userId = data.user.id
        userEmail = data.user.email
      } else {
        console.log('[CIC] Code exchange error:', error?.message)
      }
    } else if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any
      })
      if (!error && data.user) {
        userId = data.user.id
        userEmail = data.user.email
      } else {
        console.log('[CIC] OTP verify error:', error?.message)
      }
    }

    if (userId && userEmail) {
      console.log('[CIC] User authenticated:', userEmail)

      // Create profile if new user
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (!existing) {
        await supabase.from('profiles').insert({
          id: userId,
          email: userEmail,
          plan: 'trial',
          trial_used: true,
          trial_started_at: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        console.log('[CIC] New profile created for:', userEmail)
      }

      return NextResponse.redirect(new URL(`${siteUrl}/?auth=success`))
    }
  } catch (e: any) {
    console.error('[CIC] Callback error:', e.message)
  }

  return NextResponse.redirect(new URL(`${siteUrl}/?auth=error`))
}
