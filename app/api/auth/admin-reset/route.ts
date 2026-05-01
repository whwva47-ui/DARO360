import { createClient } from "@supabase/supabase-js"

export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return Response.json({ error: "Server not configured" })
    }

    const supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Reset password for whwva47@gmail.com using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      '84b35e24-83e4-40d3-a2a5-84c4cbbc09b6',
      { 
        password: 'Login123!',
        email_confirm: true
      }
    )

    if (error) {
      return Response.json({ error: error.message })
    }

    return Response.json({ 
      success: true, 
      message: 'Password set to Login123! for ' + data.user?.email 
    })

  } catch (error: any) {
    return Response.json({ error: error.message })
  }
}
