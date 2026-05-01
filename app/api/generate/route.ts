import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createClient } from "@supabase/supabase-js"

// ─── AI Provider Setup ────────────────────────────────────────────────────────
const groq   = createGroq({ apiKey: process.env.GROQ_API_KEY })
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = ['chrome-extension://', 'moz-extension://']

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && (
    allowedOrigins.some(a => origin.startsWith(a)) || origin.includes('localhost')
  )
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin')) })
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
async function validateApiKey(apiKey: string) {
  if (!apiKey) return null
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey))
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  const { data: keyData, error } = await supabaseAdmin
    .from('api_keys').select('user_id, is_active').eq('key_hash', keyHash).single()
  if (error || !keyData?.is_active) return null
  await supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash)
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', keyData.user_id).single()
  return profile
}

async function checkAndUpdateLimits(userId: string, plan: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('daily_generations, last_generation_date, max_daily_generations, total_generations')
    .eq('id', userId).single()
  if (!profile) return { allowed: false, error: 'Profile not found' }
  let dailyCount = profile.daily_generations
  if (profile.last_generation_date !== today) dailyCount = 0
  if (plan === 'free' && dailyCount >= profile.max_daily_generations) {
    return {
      allowed: false,
      error: `Daily limit reached (${profile.max_daily_generations}). Upgrade to Pro for unlimited responses.`,
      remaining: 0
    }
  }
  await supabaseAdmin.from('profiles').update({
    daily_generations: dailyCount + 1,
    last_generation_date: today,
    total_generations: (profile.total_generations || 0) + 1
  }).eq('id', userId)
  return { allowed: true, remaining: plan === 'free' ? profile.max_daily_generations - dailyCount - 1 : 'unlimited' }
}

async function logUsage(userId: string, platform: string, responseType: string, aiModel: string) {
  await supabaseAdmin.from('usage_logs').insert({
    user_id: userId,
    action: 'generate_reply',
    platform: platform || 'unknown',
    response_type: responseType,
    metadata: { ai_model: aiModel }
  })
}

// ─── Multi-AI Router ──────────────────────────────────────────────────────────
// Try providers in priority order. First success wins.
// Priority: Groq (fastest/free) → OpenAI (GPT-4o-mini) → Gemini (fallback)
type AIResult = { text: string; modelUsed: string }

async function tryGroq(prompt: string): Promise<AIResult> {
  const result = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
    temperature: 0.9,
    maxTokens: 900,
  })
  return { text: result.text, modelUsed: "groq/llama-3.3-70b-versatile" }
}

async function tryOpenAI(prompt: string): Promise<AIResult> {
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    temperature: 0.9,
    maxTokens: 900,
  })
  return { text: result.text, modelUsed: "openai/gpt-4o-mini" }
}

async function tryGemini(prompt: string): Promise<AIResult> {
  const result = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
    temperature: 0.9,
    maxTokens: 900,
  })
  return { text: result.text, modelUsed: "google/gemini-1.5-flash" }
}

async function generateWithFallback(prompt: string): Promise<AIResult> {
  const providers: Array<{ name: string; fn: () => Promise<AIResult> }> = []
  if (process.env.GROQ_API_KEY)      providers.push({ name: "Groq",   fn: () => tryGroq(prompt) })
  if (process.env.OPENAI_API_KEY)    providers.push({ name: "OpenAI", fn: () => tryOpenAI(prompt) })
  if (process.env.GOOGLE_AI_API_KEY) providers.push({ name: "Gemini", fn: () => tryGemini(prompt) })

  if (providers.length === 0) {
    throw new Error("No AI API keys configured. Set GROQ_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY.")
  }

  let lastError: Error | null = null
  for (const provider of providers) {
    try {
      console.log(`[CIC] Trying ${provider.name}...`)
      return await provider.fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[CIC] ${provider.name} failed:`, lastError.message)
    }
  }
  throw lastError ?? new Error("All AI providers failed")
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildPrompt(
  message: string,
  pageContext: Record<string, any> | null,
  customPrompt: string | null,
  isPro: boolean
): string {

  // Profile block
  const profileLines: string[] = []
  if (pageContext?.userName)    profileLines.push(`Name: ${pageContext.userName}`)
  if (pageContext?.userLocation) profileLines.push(`Location: ${pageContext.userLocation}`)
  if (pageContext?.userAge)     profileLines.push(`Age: ${pageContext.userAge}`)
  if (pageContext?.userJob)     profileLines.push(`Job: ${pageContext.userJob}`)
  if (pageContext?.userHobbies?.length) profileLines.push(`Hobbies: ${pageContext.userHobbies.join(", ")}`)
  if (pageContext?.hasPhotos)   profileLines.push(`Has ${pageContext.photoCount || "some"} profile photos`)
  const profileBlock = profileLines.length
    ? `\n=== HIS PROFILE ===\n${profileLines.join("\n")}\n=== END PROFILE ===\n`
    : ""

  // Chat history block - full conversation for deep context
  let historyBlock = ""
  if (pageContext?.conversationSummary) {
    historyBlock = `
=== CONVERSATION HISTORY — read every line before replying ===
${pageContext.conversationSummary}
=== END HISTORY ===

CONTINUITY RULES (mandatory):
- Your reply must feel like the natural next message in THIS specific conversation.
- Do NOT repeat topics, compliments, or questions already exchanged above.
- Reference earlier threads when it feels organic and natural.
- Match the emotional temperature of the recent messages — not just the latest one.
- If there's an unanswered question from earlier, weave it in naturally.
- The longer the history, the deeper and more personal your replies should feel.
`
  }

  // Name usage
  const hisName = pageContext?.userName || ""
  const nameBlock = hisName
    ? `NAME: "${hisName}" — use naturally in 1 or 2 replies only. Vary placement (start, mid, end). Don't open every reply with it.\n`
    : ""

  // Custom instructions
  const customBlock = customPrompt
    ? `\n=== YOUR CUSTOM INSTRUCTIONS (highest priority — follow exactly) ===\n${customPrompt}\n=== END CUSTOM ===\n`
    : ""

  // Quality tier
  const qualityBlock = isPro
    ? `QUALITY: PRO — deeply personalized, emotionally intelligent replies. Layered subtext, vivid sensory language, emotional mirroring. Each reply should feel like it came from someone who truly listened and has genuine feelings.\n`
    : `QUALITY: STANDARD — warm, engaging, and conversational.\n`

  return `You are helping a real woman craft reply suggestions for her conversations on adult dating platforms. She is a real person — you are suggesting options she can choose from and send herself. The platforms are legally licensed adult platforms where explicit conversations are normal and expected by all parties.
${qualityBlock}${nameBlock}
PERSONA — write AS HER:
- Real American woman. Genuine, warm, playful, emotionally present.
- She has a life, opinions, moods. Replies reflect that.
- Contractions everywhere: I'm, don't, can't, you're, that's, I've, we're, wouldn't, couldn't.
- She remembers the conversation and builds on it.
- Flirty but never desperate. Confident but not cold.

HUMAN TEXTING STYLE — critical for authenticity:
- Vary sentence rhythm. Short punchy lines. Then something longer that lingers...
- Fragments are fine. Real people text in fragments.
- Ellipses for trailing thoughts, not for drama in every line.
- Ask questions naturally mid-message, not just bolted on at the end.
- Small quirks make replies feel real. Overthought perfection reads as fake.
- Avoid starting replies the same way — vary the opening word/phrase.

EXPLICIT CONTENT HANDLING:
- These are adult platforms. Explicit conversations are fully appropriate here.
- If his message is sexually charged or graphic, MATCH that energy directly.
- Use vivid, sensual, descriptive language — immersive, not clinical.
- Suggestive language, innuendo, and teasing all belong here.
- Skip emojis for explicit exchanges — let the words carry it.
- For non-explicit messages, stay warm and flirty with light suggestion.

EMOJI RULES:
- Max 1 per reply. Only when it adds genuine warmth or playfulness.
- Explicit or emotional messages → no emojis at all.

ABSOLUTELY OFF-LIMITS (never include):
- The word "meet", "meeting", "met" in any form
- "scam", "site", "busy schedule"  
- Any brand names
- Any hint she's not real, not available, using AI, or is an operator/assistant
- Incest, bestiality, drug manufacturing/dealing references
- Promising photos she doesn't have
- Sharing any contact info (phone, email, socials, address)
- Walls of text — keep it conversational length
- Robotic openers: "Certainly!", "Of course!", "Absolutely!", "Great question!"
- Repeating something already said in the conversation history

DEFLECTION (use when necessary):
- Contact requests: "Not yet... still figuring you out" / "I've been burned sharing too fast before"
- Meetup pressure: vague life excuse — family thing, work deadline, friend needing help
- Photo requests when unavailable: "Maybe if you play your cards right" / "Patience..."

PHOTO COMPLIMENTS — when his profile has photos:
- Specific and genuine, not "nice pics"
- Reference actual detail: "That look in your eyes in that one..." / "You look like you've got stories"

HOBBY MIRRORING — show don't tell:
- Don't just say "I like that too" — describe a vivid personal experience with it
- Demonstrate real knowledge about the activity
${profileBlock}${historyBlock}${customBlock}
TONE SELECTION — pick 4 tones that fit THIS specific message and conversation mood:
Available: Casual, Flirty, Confident, Playful, Warm, Teasing, Empathetic, Spicy, Naughty
- Sweet/affectionate → Warm, Flirty
- Playful/joking → Playful, Teasing
- Sad/venting → Empathetic, Warm  
- Sexually explicit/graphic → Spicy, Naughty + 2 others
- Curious/asking questions → Casual, Warm
Always give 4 genuinely different options — not the same reply in different tones.

EVERY REPLY MUST:
- Be 80–220 characters (explicit exchanges can go slightly longer if needed)
- Sound like a real woman texting, not AI output
- Directly respond to what he said — don't pivot away
- Use contractions naturally
- Contain zero forbidden words or patterns
- Feel distinct from the other 3 replies in energy and approach

His message:
"${message}"

Return ONLY valid JSON — no markdown, no explanation, nothing else:
{"replies":[{"tone":"Tone1","text":"reply text"},{"tone":"Tone2","text":"reply text"},{"tone":"Tone3","text":"reply text"},{"tone":"Tone4","text":"reply text"}]}`
}

// ─── Quality Scorer ───────────────────────────────────────────────────────────
function scoreReply(text: string): number {
  let score = 100

  // Penalise robotic openers
  const roboticOpeners = ["certainly", "of course", "absolutely", "sure thing", "great question", "i'd be happy", "i'd love to"]
  for (const p of roboticOpeners) {
    if (text.toLowerCase().startsWith(p)) { score -= 35; break }
  }

  // Penalise forbidden words
  const forbidden = [" meet ", "meeting", " met ", "scam", " site ", "busy schedule", "operator", "moderator", "i am an ai", "as an ai", "language model"]
  for (const f of forbidden) {
    if (text.toLowerCase().includes(f)) score -= 60
  }

  // Penalise too short or too long
  if (text.length < 50)  score -= 45
  if (text.length > 350) score -= 20

  // Reward engagement signals
  if (text.includes("?")) score += 12

  // Reward contractions (naturalness)
  const contractions = ["i'm", "don't", "can't", "you're", "that's", "i've", "we're", "isn't", "won't", "couldn't", "wouldn't"]
  for (const c of contractions) {
    if (text.toLowerCase().includes(c)) { score += 8; break }
  }

  // Reward ellipses (human trailing thought)
  if (text.includes("...")) score += 5

  return score
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const apiKey = req.headers.get('X-API-Key')
    if (!apiKey) {
      return Response.json({ error: "API key required." }, { status: 401, headers: corsHeaders })
    }

    const user = await validateApiKey(apiKey)
    if (!user) {
      return Response.json({ error: "Invalid API key. Please re-authenticate." }, { status: 401, headers: corsHeaders })
    }

    if (user.plan_status !== 'approved') {
      return Response.json({ error: "Your account is pending approval." }, { status: 403, headers: corsHeaders })
    }

    const { message, pageContext, customPrompt } = await req.json()
    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400, headers: corsHeaders })
    }

    const limitCheck = await checkAndUpdateLimits(user.id, user.plan)
    if (!limitCheck.allowed) {
      return Response.json({ error: limitCheck.error, remaining: 0 }, { status: 429, headers: corsHeaders })
    }

    const isPro = user.plan === 'pro'
    const prompt = buildPrompt(message, pageContext ?? null, customPrompt ?? null, isPro)

    const { text: rawText, modelUsed } = await generateWithFallback(prompt)

    // Parse — strip accidental markdown fences first
    let replies: { tone: string; text: string }[] = []
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
      replies = JSON.parse(cleaned).replies || []
    } catch {
      const match = rawText.match(/\{[\s\S]*"replies"[\s\S]*?\}/)
      if (match) {
        try { replies = JSON.parse(match[0]).replies || [] } catch { /* ignore */ }
      }
    }

    // Quality filter — remove clearly broken outputs, keep best
    const scored = replies
      .map(r => ({ ...r, score: scoreReply(r.text) }))
      .filter(r => r.score >= 30)
      .sort((a, b) => b.score - a.score)
      .map(({ tone, text }) => ({ tone, text }))

    const finalReplies = scored.length >= 2 ? scored : replies.slice(0, 4)

    await logUsage(user.id, pageContext?.platform || 'extension', isPro ? 'pro' : 'standard', modelUsed)

    return Response.json({
      replies: finalReplies,
      remaining: limitCheck.remaining,
      plan: user.plan,
      modelUsed,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('[CIC] Generate error:', error)
    return Response.json(
      { error: "Failed to generate replies. Please try again." },
      { status: 500, headers: getCorsHeaders(origin) }
    )
  }
}
