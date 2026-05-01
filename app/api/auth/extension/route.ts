import { createClient } from "@supabase/supabase-js"

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing env vars")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

function makeKey() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let k = 'cic_'
  for (let i = 0; i < 32; i++) k += c[Math.floor(Math.random() * c.length)]
  return k
}

async function hashKey(key: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: Request) {
  try {
    const admin = getAdmin()
    const { email, password } = await req.json()
    if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400, headers: cors })
    const { data, error } = await admin.auth.signInWithPassword({ email, password })
    if (error || !data.user) return Response.json({ error: "Invalid email or password." }, { status: 401, headers: cors })
    const uid = data.user.id
    let { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single()
    if (!profile) {
      await admin.from('profiles').insert({ id: uid, email, plan: 'free', plan_status: 'approved', max_daily_generations: 10, daily_generations: 0, total_generations: 0 })
      const res = await admin.from('profiles').select('*').eq('id', uid).single()
      profile = res.data
    }
    if (!profile || profile.plan_status !== 'approved') return Response.json({ error: "Account not approved." }, { status: 403, headers: cors })
    await admin.from('api_keys').update({ is_active: false }).eq('user_id', uid).eq('is_active', true)
    const apiKey = makeKey()
    const keyHash = await hashKey(apiKey)
    await admin.from('api_keys').insert({ user_id: uid, key_hash: keyHash, name: 'Extension Key', is_active: true })
    await admin.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', uid)
    const remaining = profile.plan === 'pro' ? 999999 : Math.max(0, (profile.max_daily_generations || 10) - (profile.daily_generations || 0))
    return Response.json({ success: true, apiKey, user: { email, plan: profile.plan || 'free', planStatus: profile.plan_status, remaining, maxDailyGenerations: profile.max_daily_generations || 10 } }, { headers: cors })
  } catch (e: any) {
    return Response.json({ error: e.message || "Auth failed" }, { status: 500, headers: cors })
  }
}

export async function GET(req: Request) {
  try {
    const admin = getAdmin()
    const apiKey = req.headers.get('X-API-Key')
    if (!apiKey) return Response.json({ error: "API key required" }, { status: 401, headers: cors })
    const keyHash = await hashKey(apiKey)
    const { data: kd } = await admin.from('api_keys').select('user_id, is_active').eq('key_hash', keyHash).single()
    if (!kd?.is_active) return Response.json({ error: "Invalid API key" }, { status: 401, headers: cors })
    const { data: profile } = await admin.from('profiles').select('*').eq('id', kd.user_id).single()
    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404, headers: cors })
    const today = new Date().toISOString().split('T')[0]
    const daily = profile.last_generation_date === today ? (profile.daily_generations || 0) : 0
    const remaining = profile.plan === 'pro' ? 999999 : Math.max(0, (profile.max_daily_generations || 10) - daily)
    return Response.json({ valid: true, user: { email: profile.email, plan: profile.plan || 'free', planStatus: profile.plan_status, remaining, maxDailyGenerations: profile.max_daily_generations || 10 } }, { headers: cors })
  } catch (e: any) {
    return Response.json({ error: "Verification failed" }, { status: 500, headers: cors })
  }
}
