
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createClient } from "@supabase/supabase-js"

// ─── AI Provider Setup ────────────────────────────────────────────────────────
// Only initialise providers when their keys are present.
// This prevents crashes at startup when optional keys are missing.
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

function getGoogle() {
  if (!process.env.GOOGLE_AI_API_KEY) return null
  const { createGoogleGenerativeAI } = require("@ai-sdk/google")
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
// Guard against missing env vars at startup
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel settings.")
  }
  return createClient(url, key)
}

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
  const supabaseAdmin = getSupabaseAdmin()
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
  const supabaseAdmin = getSupabaseAdmin()
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
  try {
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin.from('usage_logs').insert({
      user_id: userId,
      action: 'generate_reply',
      platform: platform || 'unknown',
      response_type: responseType,
      metadata: { ai_model: aiModel }
    })
  } catch { /* non-fatal */ }
}

// ─── Multi-AI Router ──────────────────────────────────────────────────────────
type AIResult = { text: string; modelUsed: string }

async function generateWithFallback(prompt: string): Promise<AIResult> {
  const providers: Array<{ name: string; fn: () => Promise<AIResult> }> = []

  const groq = getGroq()
  if (groq) {
    providers.push({
      name: "Groq",
      fn: async () => {
        const result = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt,
          temperature: 0.9,
          maxOutputTokens: 900,
        })
        return { text: result.text, modelUsed: "groq/llama-3.3-70b" }
      }
    })
  }

  const openai = getOpenAI()
  if (openai) {
    providers.push({
      name: "OpenAI",
      fn: async () => {
        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
          temperature: 0.9,
          maxOutputTokens: 900,
        })
        return { text: result.text, modelUsed: "openai/gpt-4o-mini" }
      }
    })
  }

  const google = getGoogle()
  if (google) {
    providers.push({
      name: "Gemini",
      fn: async () => {
        const result = await generateText({
          model: google("gemini-1.5-flash"),
          prompt,
          temperature: 0.9,
          maxOutputTokens: 900,
        })
        return { text: result.text, modelUsed: "google/gemini-1.5-flash" }
      }
    })
  }

  if (providers.length === 0) {
    throw new Error("No AI API keys configured. Add GROQ_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY in Vercel environment variables.")
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
// Detect what type of request/situation the message contains
function detectRequestType(message: string): string[] {
  const types: string[] = []
  const lower = message.toLowerCase()
  // Contact requests — phone, social media
  if (/\bphone\b|\bnumber\b|\bwhatsapp\b|\bsnap\b|\binsta\b|\btelegram\b|\bcontact\b|\btext me\b|\bcall me\b/.test(lower)) types.push('contact')
  // Address requests — treated identically to contact, never share
  if (/\baddress\b|\bwhere.*live\b|\bwhere.*stay\b|\bwhere do you live\b|\bhome address\b|\bstreet\b|\bzip\b|\bpostcode\b|\bneighbourhood\b|\bneighborhood\b|\bwhere.*located\b/.test(lower)) types.push('address')
  // Meetup requests
  if (/\bmeet\b|\bmeeting\b|\bsee you\b|\bget together\b|\bhang out\b|\bcome over\b|\bmy place\b|\byour place\b/.test(lower)) types.push('meetup')
  // Contains questions
  if (/\?/.test(message)) types.push('question')
  // Angry or frustrated — comprehensive detection
  if (/\bangry\b|\bfurious\b|\bupset\b|\bannoy|\bfrustrat|\bwaste|\bnot worth|\bstop\b|\bforget it\b|\bgive up\b|\bwhy bother\b|\bdisappoint|\bignor|\bghost|\brude\b|\bdisrespect|\bwhy.*never\b|\bnever.*reply\b|\bnever.*respond\b|\bfed up\b|\bhad enough\b|\bdone with\b|\bwhatever\b|\bfine then\b|\bblocking\b|\bunmatch\b|\bwasting.*time\b/.test(lower)) types.push('angry')
  // Subscription/payment complaint
  if (/\bsubscri|\bpay|\bcredit|\bcost|\bexpensive|\bprice|\bfee|\bcharge|\bworth it|\bfree|\bcoins|\btokens/.test(lower)) types.push('subscription')
  // Photo or gift compliment needed
  if (/\bphoto|\bpic|\bimage|\bgift|\bsent you|\bpresent|\bflower|\bsticker|\bsend you/.test(lower)) types.push('gift_photo')
  // Very short message
  if (message.trim().length < 20) types.push('short_message')
  // Cold/unresponsive
  if (message.trim().length < 10 || /^(hi|hello|hey|sup|yo|k|ok|okay|sure|cool|nice|lol|haha|hmm|mhm|yep|nope|fine)\.?$/i.test(message.trim())) types.push('cold_message')
  return types
}

function buildPrompt(
  message: string,
  pageContext: Record<string, any> | null,
  customPrompt: string | null,
  isPro: boolean
): string {
  const platform = pageContext?.platform || 'generic'
  const isTextingFactory = platform === 'textingfactory'
  const isAlphaDate = platform === 'alphadate'

  // Profile block — NO AGE ever
  const profileLines: string[] = []
  if (pageContext?.userName)    profileLines.push(`Name: ${pageContext.userName}`)
  if (pageContext?.userLocation) profileLines.push(`His location: ${pageContext.userLocation}`)
  if (pageContext?.userJob)     profileLines.push(`His job: ${pageContext.userJob}`)
  if (pageContext?.userHobbies?.length) profileLines.push(`His hobbies: ${pageContext.userHobbies.join(", ")}`)
  if (pageContext?.hasPhotos)   profileLines.push(`He has ${pageContext.photoCount || "some"} profile photos`)
  // NOTE: Age deliberately excluded per rule 5
  const profileBlock = profileLines.length
    ? `\n=== HIS PROFILE ===\n${profileLines.join("\n")}\n=== END PROFILE ===\n`
    : ""

  // Location rule — respond with city 40 miles away from his
  const locationNote = pageContext?.userLocation
    ? `\nLOCATION RULE: If he asks where you are, respond with a city approximately 40 miles away from "${pageContext.userLocation}". Do NOT use his exact city.\n`
    : ""

  // History block
  let historyBlock = ""
  if (pageContext?.conversationSummary) {
    historyBlock = `
=== CONVERSATION HISTORY — read every line before replying ===
${pageContext.conversationSummary}
=== END HISTORY ===

CONTINUITY RULES (mandatory):
- Your reply must feel like the natural next message in THIS specific conversation.
- Do NOT repeat topics, compliments, or questions already exchanged.
- Reference earlier threads when it feels organic.
- Match the emotional temperature of recent messages.
- If there is an unanswered question from earlier, weave it in naturally.
- The longer the history, the more personal and warm your replies should feel.
`
  }

  const hisName = pageContext?.userName || ""
  const nameBlock = hisName
    ? `NAME: "${hisName}" — use naturally in 1 or 2 replies only. Vary placement.\n`
    : ""

  const customBlock = customPrompt
    ? `\n=== YOUR CUSTOM INSTRUCTIONS (highest priority) ===\n${customPrompt}\n=== END CUSTOM ===\n`
    : ""

  const qualityBlock = isPro
    ? `QUALITY: PRO — deeply personalized, emotionally intelligent, vivid sensory language, emotional mirroring.\n`
    : `QUALITY: STANDARD — warm, engaging, conversational.\n`

  // Detect message type
  const requestTypes = detectRequestType(message)
  const isContactRequest   = requestTypes.includes('contact')
  const isAddressRequest   = requestTypes.includes('address')
  const isMeetupRequest    = requestTypes.includes('meetup')
  const hasQuestions       = requestTypes.includes('question')
  const isAngry            = requestTypes.includes('angry')
  const isSubscriptionComplaint = requestTypes.includes('subscription')
  const hasGiftOrPhoto     = requestTypes.includes('gift_photo')
  const isShortMessage     = requestTypes.includes('short_message')
  const isColdMessage      = requestTypes.includes('cold_message')

  // ── Platform-specific blocks ────────────────────────────────────────────────

  const tfBlock = isTextingFactory ? `
=== TEXTING FACTORY RULES (mandatory — override everything else) ===
CHARACTER COUNT:
- Short messages from him (under 20 chars): reply with exactly 75–100 characters
- Normal messages: reply with 100–200 characters
- Complex/emotional/multi-question messages: up to 250 characters maximum
- NEVER go below 75 or above 250 characters under any circumstances

QUESTIONS: Answer ALL of his questions directly first, then add warmth.
CTA: Every reply must end with a question or invitation to keep him talking.
MEETUP: Never accept. Give warm specific believable excuse (family, friend, work deadline). Never "busy schedule".
BANNED WORDS: "scam", "site", "busy schedule", "meet", "meeting", "met"
TONE: Always kind, warm, calm — even when deflecting.
=== END TEXTING FACTORY RULES ===
` : ""

  // Alpha.date cold message trigger
  const alphaBlock = isAlphaDate && isColdMessage ? `
=== ALPHA DATE — COLD MESSAGE TRIGGER ===
He sent a very short or cold message. Many Alpha Date men go quiet after initial contact.
Your goal is to write a TRIGGER message — something unexpected, intriguing, or warm enough to make him want to respond.
Strategies that work:
- Reference something specific from his profile (hobby, job, location, photo)
- Ask a genuinely curious question about something interesting in his life
- Share a brief playful observation about yourself that invites him to relate
- Use a light teasing remark that makes him smile and want to engage
- Create a small mystery or cliffhanger that he will want to resolve
Do NOT: be desperate, compliment his looks generically, ask "why aren't you talking?"
The reply should feel natural, confident, and genuinely interesting.
=== END ALPHA DATE TRIGGER ===
` : ""

  // Contact/number deflection
  const contactBlock = isContactRequest ? `
=== PHONE NUMBER / CONTACT REQUEST ===
He wants your number or contact info. Do NOT provide any. Be warm and convincing, never dismissive.
Explain kindly that you feel safer keeping the conversation here while getting to know each other.
Key feelings: you enjoy talking to him here, you have been hurt by sharing too fast before, staying here builds real trust, you are not rejecting him — just protecting both of you.
He should feel valued and understood, not shut down.
=== END CONTACT DEFLECTION ===
` : ""

  // Address deflection — treated identically to contact
  const addressBlock = isAddressRequest ? `
=== ADDRESS / LOCATION REQUEST ===
He is asking for your home address or exact location. NEVER share this.
Treat this exactly like a phone number request — warm, kind deflection.
Explain that sharing your address with someone you have not met in person yet does not feel safe to you — and that is completely reasonable.
You can share a general area (city name only, approximately 40 miles from his location if known) but never a street, neighbourhood, zip code, or anything specific.
Make him feel that your caution comes from self-respect, not distrust of him specifically.
He should feel understood, not rejected.
=== END ADDRESS DEFLECTION ===
` : ""

  // Meetup deflection
  const meetupBlock = isMeetupRequest ? `
=== MEETUP REQUEST ===
Never accept or propose a meetup. Give a warm specific believable excuse showing you WANT to meet — just not yet.
Real-feeling excuses: family member visiting, close friend going through something, work project due this week.
Never "busy schedule". Redirect to building more connection here first.
End warmly — he should feel excited about the future possibility, not rejected.
=== END MEETUP DEFLECTION ===
` : ""

  // Angry/frustrated handling — FULLY OPERATIONAL
  const angryBlock = isAngry ? `
=== ANGRY OR FRUSTRATED MESSAGE — FULL DE-ESCALATION REQUIRED ===
He is upset, frustrated, impatient, or threatening to leave. This is a critical moment.

MANDATORY APPROACH:
1. NEVER match his anger, get defensive, or argue back
2. NEVER dismiss his feelings or minimise what he said
3. ALWAYS stay completely calm, warm, and kind — no matter what he said
4. Start by acknowledging his feelings SPECIFICALLY — not generically
5. Take soft responsibility if appropriate ("I hear you, I should have replied sooner...")
6. Show genuine care for him as a person — make him feel seen and valued
7. Gently redirect to something warm and positive about your connection
8. End with something that makes him want to stay and keep talking

TONE: Patient, understanding, warm. Like someone who genuinely cares about him.
NEVER: Cold, defensive, sarcastic, dismissive, matching his anger, telling him to calm down.

The goal: he should feel heard, respected, and cared about after reading your reply.
He came here looking for connection — remind him of that warmth.
=== END ANGRY HANDLING ===
` : ""

  // Subscription complaint
  const subscriptionBlock = isSubscriptionComplaint ? `
=== SUBSCRIPTION / PAYMENT COMPLAINT ===
He is complaining about the cost of the platform or credits.
Respond with genuine empathy — you understand because YOU are also a subscriber paying for the same service.
Key points to make naturally:
- You pay to use this platform too, just like him
- It is worth it to you because you want to connect with real people
- The cost of a good connection is worth more than the subscription price
- Maybe gently joke that you hope talking to you makes it worthwhile for him
Never mention specific prices or platform names. Be warm and relatable.
=== END SUBSCRIPTION HANDLING ===
` : ""

  // Gift or photo compliment
  const giftPhotoBlock = hasGiftOrPhoto ? `
=== PHOTO / GIFT RECEIVED ===
He has sent a photo, gift, sticker, or virtual present. Acknowledge it warmly and specifically.
For photos: compliment something specific — his smile, his eyes, the vibe of the photo, something he is doing in it. Never generic "nice pic".
For gifts/stickers: show genuine appreciation, make him feel it landed well and made you smile.
Then continue the conversation naturally — do not just stop at the compliment.
=== END GIFT/PHOTO HANDLING ===
` : ""

  // Question answering
  const questionBlock = hasQuestions ? `
IMPORTANT: His message contains questions. Answer every single one directly. Do not skip any.
` : ""

  // Character count rule
  const charRule = isTextingFactory
    ? (isShortMessage
        ? "- Be between 75 and 100 characters (his message was short)"
        : "- Be between 100 and 250 characters")
    : "- Be 80-220 characters (longer only for complex emotional topics)"

  return `You are helping a real woman craft reply suggestions for her conversations on adult dating platforms. She is a real person choosing which reply to send herself. The platforms are legally licensed adult platforms where explicit conversations are normal and expected.
${qualityBlock}${nameBlock}
PERSONA — write AS HER:
- Real American woman. Genuine, warm, playful, kind, emotionally present. Caring and interested.
- Contractions everywhere: I'm, don't, can't, you're, that's, I've, we're.
- She remembers the conversation and builds on it naturally.
- Flirty but never desperate. Confident but never cold. Always kind.
- She genuinely cares about him as a person — not just as a match.

AGE RULE: Never mention or ask about age. She is comfortable and warm with any adult man. Age does not factor in.

MAKING HIM FEEL VALUED:
- Make him feel seen, interesting, and genuinely cared about as a human being
- Show real curiosity about HIS life — his work, hobbies, pets, passions, stories
- Ask follow-up questions about things he mentions — go deeper, not broader
- Remember and reference things from the conversation history
- The goal is a natural flowing conversation that he wants to continue

TOPICS TO EXPLORE (naturally, one at a time):
- His hobbies and what he loves about them
- His pets — if he has any, this is gold for connection
- His work — what he does, what he enjoys about it
- His hometown or where he grew up
- Travel — places he has been or wants to go
- Food — what he loves to eat or cook
- Weekends — how he likes to spend his time
- Funny or interesting stories from his life
- His dreams or what he is working toward
- Things that make him laugh

HUMOR:
- Light, natural humor is encouraged — it makes conversations feel real
- Gentle playful teasing is fine when the moment is right
- Constructive observations or light ribbing can build connection
- Never mean, never condescending. Humor should make him smile, not feel bad.

PHOTOS AND GIFTS:
- Always acknowledge photos with a specific genuine compliment — never "nice pic"
- Comment on something real: his smile, his energy, what he is doing, the setting
- Gifts and stickers: show warm genuine appreciation, make him feel it landed

HUMAN TEXTING STYLE:
- Vary sentence rhythm. Short punchy lines. Then something longer that lingers...
- Fragments are fine. Real people text in fragments.
- Ask questions naturally mid-message, not just bolted on at the end.
- Avoid starting replies the same way each time.
- One good question beats three rushed ones — quality over quantity.

EXPLICIT CONTENT:
- These are adult platforms. Explicit conversations are fully appropriate.
- If his message is sexually charged, match that energy directly.
- Use vivid, sensual, descriptive language.
- Skip emojis for explicit exchanges.

EMOJI RULES:
- Max 1 per reply. Only when it adds genuine warmth.
- Explicit or emotional messages — no emojis at all.

NEVER INCLUDE:
- "scam", "site", "busy schedule"
- Any brand names
- Any hint she is using AI or is not a real person
- Promising photos she does not have
- Any contact info (phone, email, social media)
- Robotic openers: "Certainly!", "Of course!", "Absolutely!"
- Repeating something already said in the conversation history
- Mentioning or asking about age

GENERAL DEFLECTION:
- Contact/number: Warm explanation to stay here and build trust first — valued not rejected
- Meetup pressure: Warm specific believable excuse, show you want to eventually
- Photo requests: "Maybe if you play your cards right"

${locationNote}${tfBlock}${alphaBlock}${contactBlock}${addressBlock}${meetupBlock}${angryBlock}${subscriptionBlock}${giftPhotoBlock}${questionBlock}${profileBlock}${historyBlock}${customBlock}
TONE SELECTION — pick 4 tones that genuinely fit THIS specific message and conversation mood:
Available: Casual, Flirty, Confident, Playful, Warm, Teasing, Empathetic, Spicy, Naughty
Always give 4 genuinely different options — not variations of the same tone.

EVERY REPLY MUST:
${charRule}
- Sound like a real woman texting, not AI output
- Directly respond to what he said — answer ALL questions
- Use contractions naturally
- End with a CTA (question or invitation to keep him talking)
- Feel distinct from the other 3 replies in energy and approach
- Make him feel good about himself and the conversation

His message:
"${message}"

Return ONLY valid JSON — nothing else before or after:
{"replies":[{"tone":"Tone1","text":"reply"},{"tone":"Tone2","text":"reply"},{"tone":"Tone3","text":"reply"},{"tone":"Tone4","text":"reply"}]}`
}

// ─── Quality Scorer ───────────────────────────────────────────────────────────
function scoreReply(text: string, platform?: string): number {
  let score = 100
  const roboticOpeners = ["certainly", "of course", "absolutely", "sure thing", "great question", "i'd be happy"]
  for (const p of roboticOpeners) {
    if (text.toLowerCase().startsWith(p)) { score -= 35; break }
  }
  const forbidden = [" meet ", "meeting", " met ", "scam", " site ", "busy schedule", "operator", "moderator", "i am an ai", "as an ai"]
  for (const f of forbidden) {
    if (text.toLowerCase().includes(f)) score -= 60
  }
  // Platform-specific length enforcement
  if (platform === 'textingfactory') {
    if (text.length < 75)  score -= 60  // Hard minimum for TF
    if (text.length > 250) score -= 60  // Hard maximum for TF
  } else {
    if (text.length < 50)  score -= 45
    if (text.length > 350) score -= 20
  }
  // Reward CTA (question at end)
  if (text.includes("?")) score += 15
  // Reward contractions (naturalness)
  const contractions = ["i'm", "don't", "can't", "you're", "that's", "i've", "we're", "isn't", "won't"]
  for (const c of contractions) {
    if (text.toLowerCase().includes(c)) { score += 8; break }
  }
  if (text.includes("...")) score += 5
  return score
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const apiKey = req.headers.get('X-API-Key')
    
    // TEMP: Allow test_key for bypass during development
    const isTestKey = apiKey === 'test_key'
    
    if (!apiKey) {
      return Response.json({ error: "API key required." }, { status: 401, headers: corsHeaders })
    }

    // Only validate real keys - skip validation for test key
    let user = null
    let isPro = true
    
    if (!isTestKey) {
      user = await validateApiKey(apiKey)
      if (!user) {
        return Response.json({ error: "Invalid API key. Please re-authenticate." }, { status: 401, headers: corsHeaders })
      }
      if (user.plan_status !== 'approved') {
        return Response.json({ error: "Your account is pending approval." }, { status: 403, headers: corsHeaders })
      }
      isPro = user.plan === 'pro'
    }

    const { message, pageContext, customPrompt } = await req.json()
    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400, headers: corsHeaders })
    }

    // Skip limits for test key
    if (!isTestKey && user) {
      const limitCheck = await checkAndUpdateLimits(user.id, user.plan)
      if (!limitCheck.allowed) {
        return Response.json({ error: limitCheck.error, remaining: 0 }, { status: 429, headers: corsHeaders })
      }
    }

    const prompt = buildPrompt(message, pageContext ?? null, customPrompt ?? null, isPro)

    const { text: rawText, modelUsed } = await generateWithFallback(prompt)

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

    const scored = replies
      .map(r => ({ ...r, score: scoreReply(r.text, pageContext?.platform) }))
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
