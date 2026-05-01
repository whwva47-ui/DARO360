import { createClient } from "@supabase/supabase-js"

// ─── Supabase — lazy init to prevent startup crash ────────────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.")
  }
  return createClient(url, key)
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

// Generate a secure API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'cic_'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

// Hash API key for storage
async function hashApiKey(key: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function parseBrowserInfo(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  return 'Browser'
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return Response.json(
        { error: "Invalid email or password. Please check your details and try again." },
        { status: 401, headers: corsHeaders }
      )
    }

    const userId = authData.user.id

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      // Auto-create profile if missing
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email: email,
        plan: 'free',
        plan_status: 'approved',
        max_daily_generations: 10,
        daily_generations: 0,
        total_generations: 0
      })

      // Fetch newly created profile
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!newProfile) {
        return Response.json(
          { error: "Could not create user profile. Please try again." },
          { status: 500, headers: corsHeaders }
        )
      }

      // Continue with new profile
      return await issueApiKey(req, supabaseAdmin, userId, newProfile)
    }

    // Check if user is approved
    if (profile.plan_status !== 'approved') {
      return Response.json(
        {
          error: "Your account is pending approval. Please wait for admin approval.",
          status: profile.plan_status
        },
        { status: 403, headers: corsHeaders }
      )
    }

    return await issueApiKey(req, supabaseAdmin, userId, profile)

  } catch (error) {
    console.error('Auth error:', error)
    return Response.json(
      { error: "Authentication failed. Please try again." },
      { status: 500, headers: corsHeaders }
    )
  }
}

async function issueApiKey(req: Request, supabaseAdmin: any, userId: string, profile: any) {
  // Deactivate all existing API keys (single session enforcement)
  await supabaseAdmin
    .from('api_keys')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  // Generate new API key
  const apiKey = generateApiKey()
  const keyHash = await hashApiKey(apiKey)
  const userAgent = req.headers.get('User-Agent') || 'Unknown'
  const browserInfo = parseBrowserInfo(userAgent)

  await supabaseAdmin.from('api_keys').insert({
    user_id: userId,
    key_hash: keyHash,
    name: `Extension Key (${browserInfo})`,
    is_active: true
  })

  // Update last login
  await supabaseAdmin
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId)

  const remaining = profile.plan === 'pro'
    ? 999999
    : (profile.max_daily_generations || 10) - (profile.daily_generations || 0)

  return Response.json({
    success: true,
    apiKey,
    user: {
      email: profile.email,
      plan: profile.plan || 'free',
      planStatus: profile.plan_status || 'approved',
      remaining: Math.max(0, remaining),
      maxDailyGenerations: profile.max_daily_generations || 10,
      totalGenerations: profile.total_generations || 0
    }
  }, { headers: corsHeaders })
}

// GET endpoint to verify API key
export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const apiKey = req.headers.get('X-API-Key')

    if (!apiKey) {
      return Response.json({ error: "API key required" }, { status: 401, headers: corsHeaders })
    }

    const keyHash = await hashApiKey(apiKey)

    const { data: keyData, error } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (error || !keyData || !keyData.is_active) {
      return Response.json({ error: "Invalid or expired API key" }, { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', keyData.user_id)
      .single()

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404, headers: corsHeaders })
    }

    const today = new Date().toISOString().split('T')[0]
    let dailyGenerations = profile.daily_generations || 0
    if (profile.last_generation_date !== today) dailyGenerations = 0

    const remaining = profile.plan === 'pro'
      ? 999999
      : Math.max(0, (profile.max_daily_generations || 10) - dailyGenerations)

    return Response.json({
      valid: true,
      user: {
        email: profile.email,
        plan: profile.plan || 'free',
        planStatus: profile.plan_status || 'approved',
        remaining,
        maxDailyGenerations: profile.max_daily_generations || 10,
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Verify error:', error)
    return Response.json({ error: "Verification failed" }, { status: 500, headers: corsHeaders })
  }
}
