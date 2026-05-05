import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/landing'

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile if new user
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const phone = data.user.user_metadata?.phone
        const referralCode = data.user.user_metadata?.referralCode

        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          phone: phone || null,
          plan: 'trial',
          trial_started_at: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

        // Award referral if code provided
        if (referralCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single()

          if (referrer) {
            await supabase.from('profiles')
              .update({ points: supabase.rpc('increment_points', { row_id: referrer.id, amount: 150 }) })
              .eq('id', referrer.id)

            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referred_id: data.user.id
            })
          }
        }
      }

      // Redirect to landing with session
      return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/?auth=success`))
    }
  }

  return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/?auth=error`))
}
