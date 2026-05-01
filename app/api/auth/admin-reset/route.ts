import { createClient } from "@supabase/supabase-js"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return Response.json({ error: "Missing env vars" }, { headers: cors })
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await admin.auth.admin.updateUserById(
      '84b35e24-83e4-40d3-a2a5-84c4cbbc09b6',
      { password: 'Login123!', email_confirm: true }
    )
    if (error) return Response.json({ error: error.message }, { headers: cors })
    return Response.json({ success: true, email: data.user?.email, message: 'Password set to Login123!' }, { headers: cors })
  } catch (e: any) {
    return Response.json({ error: e.message }, { headers: cors })
  }
}
