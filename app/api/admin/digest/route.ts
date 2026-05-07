import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function GET(req: Request) { return handler(req) }
export async function POST(req: Request) { return handler(req) }

async function handler(req: Request) {
  // Accept key from header OR URL parameter
  const url = new URL(req.url)
  const adminKey = req.headers.get('X-Admin-Key') || url.searchParams.get('key')

  if (adminKey !== 'cic_admin_2026' && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized. Add ?key=cic_admin_2026 to the URL.' }, { status: 401, headers: cors })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: allUsers },
    { data: newUsers },
    { data: proUsers },
    { data: expiredUsers },
    { data: proRequests },
    { data: replyUsage },
    { data: feedback },
    { data: usageLogs }
  ] = await Promise.all([
    supabase.from('profiles').select('id, plan'),
    supabase.from('profiles').select('id, email, plan').gte('created_at', weekAgo),
    supabase.from('profiles').select('id').eq('plan', 'pro'),
    supabase.from('profiles').select('id').eq('plan', 'expired'),
    supabase.from('pro_requests').select('*').gte('created_at', weekAgo),
    supabase.from('reply_usage').select('tone, action, platform').gte('used_at', weekAgo),
    supabase.from('feedback').select('stars, message').gte('created_at', weekAgo),
    supabase.from('usage_logs').select('generations').gte('created_at', weekAgo)
  ])

  const totalUsers = allUsers?.length || 0
  const newSignups = newUsers?.length || 0
  const totalPro = proUsers?.length || 0
  const totalExpired = expiredUsers?.length || 0
  const pendingRequests = proRequests?.filter((r: any) => r.status === 'pending').length || 0
  const totalGenerations = usageLogs?.reduce((s: number, u: any) => s + (u.generations || 0), 0) || 0
  const totalRepliesUsed = replyUsage?.length || 0
  const copies = replyUsage?.filter((r: any) => r.action === 'copy').length || 0
  const types = replyUsage?.filter((r: any) => r.action === 'type').length || 0
  const avgStars = feedback?.length
    ? (feedback.reduce((s: number, f: any) => s + f.stars, 0) / feedback.length).toFixed(1)
    : 'N/A'

  const toneCounts: Record<string, number> = {}
  replyUsage?.forEach((r: any) => { toneCounts[r.tone] = (toneCounts[r.tone] || 0) + 1 })
  const topTones = Object.entries(toneCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chattersinnercircle.vercel.app'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#06060f;color:#e2e8f0;padding:32px;max-width:600px;margin:0 auto;">
<div style="background:#0d0d18;border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:28px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#7c3aed,#d4a300);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:10px;">💬</div>
    <div style="font-weight:700;font-size:18px;color:#a855f7;">Chatter's Inner Circle</div>
    <div style="font-size:12px;color:#71767b;">Weekly Productivity Report · ${dateStr}</div>
  </div>

  <h3 style="color:#fbbf24;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">👥 Users</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
    ${[['Total Users',totalUsers],['New This Week',newSignups],['Pro',totalPro],['Expired',totalExpired],['Pending Upgrades',pendingRequests]].map(([k,v])=>`
    <tr style="border-bottom:1px solid #1e1e32;">
      <td style="padding:8px 0;color:#71767b;font-size:13px;">${k}</td>
      <td style="padding:8px 0;color:#e2e8f0;font-weight:600;font-size:13px;text-align:right;">${v}</td>
    </tr>`).join('')}
  </table>

  <h3 style="color:#fbbf24;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">⚡ Usage This Week</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
    ${[['Total Generations',totalGenerations],['Replies Used',totalRepliesUsed],['Copied',copies],['Typed',types],['Avg Rating',avgStars+' / 5 ★']].map(([k,v])=>`
    <tr style="border-bottom:1px solid #1e1e32;">
      <td style="padding:8px 0;color:#71767b;font-size:13px;">${k}</td>
      <td style="padding:8px 0;color:#e2e8f0;font-weight:600;font-size:13px;text-align:right;">${v}</td>
    </tr>`).join('')}
  </table>

  ${topTones.length > 0 ? `
  <h3 style="color:#fbbf24;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">🎯 Top Tones</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
    ${topTones.map(([t,c])=>`<tr style="border-bottom:1px solid #1e1e32;"><td style="padding:7px 0;color:#a855f7;font-size:13px;">${t}</td><td style="padding:7px 0;color:#e2e8f0;font-size:13px;text-align:right;">${c} uses</td></tr>`).join('')}
  </table>` : ''}

  ${pendingRequests > 0 ? `
  <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px;padding:14px;margin-bottom:22px;">
    <div style="color:#fbbf24;font-weight:600;margin-bottom:6px;">⚠ ${pendingRequests} upgrade request${pendingRequests>1?'s':''} waiting for approval</div>
    <a href="${siteUrl}/admin" style="color:#a855f7;font-size:13px;">Open Admin Panel →</a>
  </div>` : ''}

  ${feedback && feedback.length > 0 ? `
  <h3 style="color:#fbbf24;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">💬 Recent Feedback</h3>
  ${feedback.slice(0,3).map((f:any)=>`
  <div style="background:#0a0a14;border:1px solid #1e1e32;border-radius:6px;padding:10px;margin-bottom:8px;">
    <div style="color:#fbbf24;font-size:12px;margin-bottom:4px;">${'★'.repeat(f.stars)}${'☆'.repeat(5-f.stars)}</div>
    <div style="color:#a0a0b0;font-size:12px;">${f.message||'No comment'}</div>
  </div>`).join('')}` : ''}

  <div style="border-top:1px solid #1e1e32;padding-top:14px;text-align:center;font-size:11px;color:#444460;">
    <a href="${siteUrl}/admin" style="color:#a855f7;">Open Admin Panel</a>
  </div>
</div>
</body></html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'CIC Reports <noreply@resend.dev>',
      to: 'whwva47@gmail.com',
      subject: `CIC Weekly Report — ${newSignups} new signups, ${totalGenerations} generations`,
      html
    })
  } catch (e: any) {
    console.warn('[CIC Digest] Email failed:', e.message)
  }

  return NextResponse.json({
    success: true,
    stats: { totalUsers, newSignups, totalPro, totalExpired, pendingRequests, totalGenerations, totalRepliesUsed, avgStars, topTones }
  }, { headers: cors })
}
