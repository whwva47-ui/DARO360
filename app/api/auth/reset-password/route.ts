import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return Response.json({ error: "Server not configured" }, { status: 500, headers: corsHeaders })
    }
    const supabaseAdmin = createClient(url, key)
    const { email } = await req.json()
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400, headers: corsHeaders })
    }
    await supabaseAdmin.auth.resetPasswordForEmail(email)
    // Always return success to avoid revealing if email exists
    return Response.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: "Failed to send reset email" }, { status: 500, headers: corsHeaders })
  }
}
