import { createClient } from "@supabase/supabase-js"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return Response.json({ error: "Server not configured" }, { status: 500, headers: cors })
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    const { email } = await req.json()
    if (!email) return Response.json({ error: "Email required" }, { status: 400, headers: cors })
    await admin.auth.resetPasswordForEmail(email)
    return Response.json({ success: true }, { headers: cors })
  } catch (e: any) {
    return Response.json({ error: "Failed" }, { status: 500, headers: cors })
  }
}
