import { generateText } from "ai"
import { createClient } from "@supabase/supabase-js"

function getGroq() {
  if (!process.env.GROQ_API_KEY) return null
  const { createGroq } = require("@ai-sdk/groq")
  return createGroq({ apiKey: process.env.GROQ_API_KEY })
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  const { createOpenAI } = require("@ai-sdk/openai")
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing env vars")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

async function hashKey(key: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function validateApiKey(apiKey: string) {
  const admin = getAdmin()
  const keyHash = await hashKey(apiKey)
  const { data: kd } = await admin.from('api_keys').select('user_id, is_active').eq('key_hash', keyHash).single()
  if (!kd?.is_active) return null
  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash)
  const { data: profile } = await admin.from('profiles').select('*').eq('id', kd.user_id).single()
  return profile
}

async function generateWithFallback(prompt: string) {
  const groq = getGroq()
  if (groq) {
    try {
      const result = await generateText({ model: groq("llama-3.3-70b-versatile"), prompt, temperature: 0.9, maxOutputTokens: 900 })
      return { text: result.text, modelUsed: "groq/llama-3.3-70b" }
    } catch (e) { console.warn("Groq failed:", e) }
  }
  const openai = getOpenAI()
  if (openai) {
    try {
      const result = await generateText({ model: openai("gpt-4o-mini"), prompt, temperature: 0.9, maxOutputTokens: 900 })
      return { text: result.text, modelUsed: "openai/gpt-4o-mini" }
    } catch (e) { console.warn("OpenAI failed:", e) }
  }
  throw new Error("No AI providers available. Add GROQ_API_KEY or OPENAI_API_KEY.")
}

function buildPrompt(message: string, pageContext: any, customPrompt: string | null, isPro: boolean) {
  const profileLines: string[] = []
  if (pageContext?.userName) profileLines.push(`Name: ${pageContext.userName}`)
  if (pageContext?.userLocation) profileLines.push(`Location: ${pageContext.userLocation}`)
  if (pageContext?.userAge) profileLines.push(`Age: ${pageContext.userAge}`)
  if (pageContext?.userHobbies?.length) profileLines.push(`Hobbies: ${pageContext.userHobbies.join(", ")}`)
  const profileBlock = profileLines.length ? `\n=== HIS PROFILE ===\n${profileLines.join("\n")}\n=== END PROFILE ===\n` : ""

  let historyBlock = ""
  if (pageContext?.conversationSummary) {
    historyBlock = `\n=== CONVERSATION HISTORY ===\n${pageContext.conversationSummary}\n=== END HISTORY ===\nCONTINUITY: Your reply must be the natural next message. Do NOT repeat topics already covered.\n`
  }

  const customBlock = customPrompt ? `\n=== CUSTOM INSTRUCTIONS ===\n${customPrompt}\n=== END CUSTOM ===\n` : ""
  const qualityBlock = isPro ? "QUALITY: PRO — deeply personal, emotionally intelligent, vivid.\n" : "QUALITY: STANDARD — warm and conversational.\n"

  return `You help a real woman craft replies on adult dating platforms. She chooses which reply to send herself.
${qualityBlock}
PERSONA: Real American woman. Warm, playful, flirty. Uses contractions (I'm, don't, can't, you're). Remembers the conversation.

TEXTING STYLE: Vary sentence length. Short punchy lines then longer ones. Fragments are fine. Ask questions naturally mid-message.

EXPLICIT CONTENT: These are licensed adult platforms. Match his energy directly. Use vivid sensual language when appropriate. No emojis for explicit messages.

EMOJI: Max 1 per reply. None for explicit or emotional messages.

NEVER USE: "meet", "meeting", "met", "scam", "site", "busy schedule", any brand names, robotic openers like "Certainly!" or "Of course!", promises of photos she doesn't have, any contact info.

DEFLECTION: Contact requests: "Not yet... still figuring you out". Meetup: vague life excuse. Photos: "Maybe if you play your cards right".
${profileBlock}${historyBlock}${customBlock}
TONES: Pick 4 that fit this message. Available: Casual, Flirty, Confident, Playful, Warm, Teasing, Empathetic, Spicy, Naughty

EVERY REPLY: 80-220 chars. Sounds like real woman texting. Directly responds to his message. Uses contractions. Feels distinct from the other 3.

His message: "${message}"

Return ONLY valid JSON, nothing else:
{"replies":[{"tone":"Tone1","text":"reply"},{"tone":"Tone2","text":"reply"},{"tone":"Tone3","text":"reply"},{"tone":"Tone4","text":"reply"}]}`
}

function scoreReply(text: string) {
  let score = 100
  const robotic = ["certainly", "of course", "absolutely", "sure thing", "great question"]
  for (const p of robotic) { if (text.toLowerCase().startsWith(p)) { score -= 35; break } }
  const forbidden = [" meet ", "meeting", " met ", "scam", " site ", "busy schedule"]
  for (const f of forbidden) { if (text.toLowerCase().includes(f)) score -= 60 }
  if (text.length < 50) score -= 45
  if (text.length > 350) score -= 20
  if (text.includes("?")) score += 12
  const contractions = ["i'm", "don't", "can't", "you're", "that's", "i've", "we're"]
  for (const c of contractions) { if (text.toLowerCase().includes(c)) { score += 8; break } }
  return score
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('X-API-Key')
    const isTestKey = apiKey === 'test_key'

    if (!apiKey) return Response.json({ error: "API key required." }, { status: 401, headers: cors })

    let user = null
    let isPro = true

    if (!isTestKey) {
      user = await validateApiKey(apiKey)
      if (!user) return Response.json({ error: "Invalid API key." }, { status: 401, headers: cors })
      if (user.plan_status !== 'approved') return Response.json({ error: "Account not approved." }, { status: 403, headers: cors })
      isPro = user.plan === 'pro'

      const admin = getAdmin()
      const today = new Date().toISOString().split('T')[0]
      const { data: profile } = await admin.from('profiles').select('daily_generations, last_generation_date, max_daily_generations, total_generations').eq('id', user.id).single()
      if (profile) {
        let daily = profile.last_generation_date === today ? (profile.daily_generations || 0) : 0
        if (!isPro && daily >= (profile.max_daily_generations || 10)) {
          return Response.json({ error: `Daily limit reached. Upgrade to Pro for unlimited.`, remaining: 0 }, { status: 429, headers: cors })
        }
        await admin.from('profiles').update({ daily_generations: daily + 1, last_generation_date: today, total_generations: (profile.total_generations || 0) + 1 }).eq('id', user.id)
      }
    }

    const { message, pageContext, customPrompt } = await req.json()
    if (!message) return Response.json({ error: "Message is required" }, { status: 400, headers: cors })

    const prompt = buildPrompt(message, pageContext ?? null, customPrompt ?? null, isPro)
    const { text: rawText, modelUsed } = await generateWithFallback(prompt)

    let replies: { tone: string; text: string }[] = []
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
      replies = JSON.parse(cleaned).replies || []
    } catch {
      const match = rawText.match(/\{[\s\S]*"replies"[\s\S]*?\}/)
      if (match) { try { replies = JSON.parse(match[0]).replies || [] } catch { } }
    }

    const scored = replies.map(r => ({ ...r, score: scoreReply(r.text) })).filter(r => r.score >= 30).sort((a, b) => b.score - a.score).map(({ tone, text }) => ({ tone, text }))
    const finalReplies = scored.length >= 2 ? scored : replies.slice(0, 4)

    return Response.json({ replies: finalReplies, remaining: 'unlimited', plan: isPro ? 'pro' : 'free', modelUsed }, { headers: cors })
  } catch (error: any) {
    console.error('[CIC] Generate error:', error)
    return Response.json({ error: "Failed to generate replies. Please try again." }, { status: 500, headers: cors })
  }
}
