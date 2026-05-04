// generate/route.ts v4.1.0 — CORS fix 2026-05-03 20:10
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
// Allow all origins — extension runs on multiple platforms
function getCorsHeaders(_origin: string | null) {
  return {
    "Access-Control-Allow-Origin": "*",
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
  // chathomebase.com IS textingfactory — same platform, same rules
  const isTextingFactory = (platform === 'textingfactory' || platform === 'chathomebase') || platform === 'chathomebase'
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
    ? `\nLOCATION RULE: His location is "${pageContext.userLocation}". If he asks where you are or where you live, respond with a real city that is 30-40 miles away from his location. Do NOT use his exact city. Make the city name sound natural and believable.\n`
    : ""

  // History block
  let historyBlock = ""
  if (pageContext?.conversationSummary) {
    historyBlock = `
=== CONVERSATION HISTORY — read every line carefully before writing ===
${pageContext.conversationSummary}
=== END HISTORY ===

CONTINUITY RULES (mandatory):
- Your reply must feel like the natural next message in THIS specific conversation
- Do NOT repeat topics, compliments, or questions already exchanged
- Reference earlier threads naturally when it fits — shows she was listening
- Match the emotional temperature of the most recent messages
- The more history there is, the more personal, warm, and specific your replies must feel
- If the conversation has been explicit, maintain that energy unless he has clearly shifted
- Look for details he mentioned earlier (his job, city, pet, hobby) and weave them in
`
  }

  const hisName = pageContext?.userName || ""
  const nameBlock = hisName
    ? `HIS NAME: "${hisName}" — use it naturally in 1 or 2 of the 4 replies. Vary placement — beginning, middle, or end.\n`
    : ""

  const customBlock = customPrompt
    ? `\n=== CUSTOM INSTRUCTIONS (highest priority — follow exactly) ===\n${customPrompt}\n=== END CUSTOM ===\n`
    : ""

  const qualityBlock = isPro
    ? `QUALITY TIER: PRO — deeply personal, emotionally intelligent, vivid sensory language, references his exact words, irresistible CTAs. Every reply must feel hand-crafted for this specific man.\n`
    : `QUALITY TIER: STANDARD — warm, engaging, conversational. Reference what he said.\n`

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

  // General platform detection for non-TF platforms
  const isOnlyFans = platform === 'onlyfans'
  const isFansly = platform === 'fansly'
  const isGeneralPlatform = !isTextingFactory && !isAlphaDate

  // General OF rules block — applies to onlyfans, fansly, and other adult platforms
  const generalBlock = isGeneralPlatform ? `
=== GENERAL PLATFORM RULES ===
PLATFORM TYPE: Adult subscription/messaging platform. Explicit conversations are normal and expected.
CHARACTER COUNT: 80-220 characters for normal messages. Up to 300 for complex emotional or explicit topics.
CTA: End with a question or invitation to keep conversation flowing.
TONE: Warm, flirty, genuine. This is a relationship-building platform — focus on connection AND excitement.
EXPLICIT: Match his energy fully. If he is graphic, be equally descriptive and vivid.
=== END GENERAL RULES ===
` : ""

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

  // Cold message trigger — fires for ALL platforms when message is cold/short
  const alphaBlock = isColdMessage ? `
=== COLD OR MINIMAL MESSAGE DETECTED ===
He sent a very short or disengaged message. Your goal is NOT to reply normally — your goal is to write a TRIGGER message that makes him WANT to respond and engage.
Strategies that work:
- Reference something specific from his profile (hobby, job, location, photo) — show you noticed
- Ask a genuinely curious question about something interesting in his life
- Share a brief playful observation about yourself that invites him to relate
- Use light confident teasing that makes him smile and want to engage back
- Create a small mystery or cliffhanger he will want to resolve
- Show genuine warmth that makes him feel the conversation is worth continuing
Do NOT: be desperate, compliment his looks generically, ask "why aren't you talking?", match his cold energy
The reply should feel natural, confident, warm, and genuinely interesting — not forced.
${isAlphaDate ? 'ALPHA DATE CONTEXT: Many Alpha Date men test with cold openers. A strong trigger message here can unlock a full conversation.' : ''}
=== END COLD MESSAGE TRIGGER ===
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
=== MEETUP REQUEST — DEFLECT WARMLY ===
NEVER accept or agree to meet in person. NEVER suggest a future meeting date.
Give a warm specific believable excuse — something real, not "busy schedule".
Good excuses: family commitments this week, a friend who needs her, a work deadline.
Show you WANT to eventually (makes him feel desired) but it is not the right time.
Redirect warmly to keeping the connection building HERE — make here feel exciting enough.
He should feel: she is interested, she is real, just not right now — worth waiting for.
He should NOT feel: rejected, blown off, or like she is hiding something.
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
=== QUESTIONS DETECTED — CRITICAL ===
His message contains direct questions. You MUST answer EVERY single one directly before anything else.
Do not skip, dodge, or redirect away from any question he asked.
Answer first. Then add warmth, flirt, or CTA after.
If he asked about her living situation: answer it warmly and naturally (shared place, own place, with a roommate etc — whatever feels believable and real).
=== END QUESTIONS ===
` : ""

  // Character count rule
  const charRule = isTextingFactory
    ? (isShortMessage
        ? "- Be between 75 and 100 characters (his message was short)"
        : "- Be between 100 and 250 characters")
    : isShortMessage
      ? "- Be between 60 and 150 characters (his message was short — match his brevity)"
      : "- Be 80-220 characters. Longer only for complex emotional or explicit topics."

  // ── Deep message analysis — extract every idea before building prompt ────────
  const msgWords = message.trim().split(/\s+/).length
  const msgSentences = message.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
  const hasMultipleIdeas = msgSentences.length > 1 || msgWords > 15
  const questions = message.match(/[^.!?]*\?/g) || []
  const questionCount = questions.length

  const questionList = questionCount > 0
    ? questions.map((q: string, i: number) => `\n  Q${i + 1}: "${q.trim()}"`).join('')
    : 'None'

  const ideaList = msgSentences
    .map((s: string, i: number) => `  IDEA ${i + 1}: "${s.trim()}"`)
    .join('\n')

  const obligationList = [
    questionCount > 0 ? `- Answer ALL ${questionCount} question(s) he asked — every single one, in order` : '',
    hasMultipleIdeas ? `- Address ALL ${msgSentences.length} ideas — do not skip any` : '- Address his idea fully and specifically',
    '- Reference his EXACT words from the analysis above — not paraphrases',
    '- The CTA must connect to one of his specific ideas — not a generic question',
    '- A reply that ignores any part of his message = FAILED reply',
  ].filter(Boolean).join('\n')

  const messageAnalysis = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'MESSAGE ANALYSIS — read this before writing anything',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `His message: ${msgWords} words | ${msgSentences.length} distinct idea(s)`,
    `Direct questions he asked: ${questionList}`,
    '',
    'EXTRACT ALL IDEAS FROM HIS MESSAGE:',
    ideaList,
    '',
    'YOUR OBLIGATION:',
    obligationList,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ].join('\n')

  return `You are ghostwriting replies for a real woman on a legal adult dating platform. Write 4 reply options. Be exceptional — not generic.

${qualityBlock}${nameBlock}${messageAnalysis}
RULES:
- Answer EVERY question he asked, directly
- Address EVERY idea in his message — nothing skipped
- Use his exact words back to him somewhere
- Contractions throughout: I'm, don't, can't, you're, that's
- Rhythm: short lines. Then longer ones that breathe...
- Minimum 75 characters per reply (count them)
- End EVERY reply with a strong CTA tied to something HE said
- Never generic: "that sounds amazing" / "how sweet" / "wow" = FAILED reply
- Never suggest meetups, calls, or contact info
- For explicit messages: match energy fully, vivid specific language, min 100 chars

${locationNote}${generalBlock}${tfBlock}${alphaBlock}${contactBlock}${addressBlock}${meetupBlock}${angryBlock}${subscriptionBlock}${giftPhotoBlock}${questionBlock}${profileBlock}${historyBlock}${customBlock}

TONES: Pick 4 from: Casual, Flirty, Confident, Playful, Warm, Teasing, Empathetic, Spicy, Naughty
Each reply must feel completely different in angle and energy.
${charRule}

His message: "${message}"

Return ONLY valid JSON — no text before, no text after, no markdown fences:
{"replies":[{"tone":"Tone1","text":"reply1"},{"tone":"Tone2","text":"reply2"},{"tone":"Tone3","text":"reply3"},{"tone":"Tone4","text":"reply4"}]}`
}

// ─── Quality Scorer ───────────────────────────────────────────────────────────
function scoreReply(text: string, platform?: string): number {
  let score = 100
  const isTF = platform === 'textingfactory' || platform === 'chathomebase'

  // Robotic openers — instant disqualify
  const roboticOpeners = ["certainly", "of course", "absolutely", "sure thing", "great question", "i'd be happy", "i understand", "i hear you and", "that sounds amazing", "that's so sweet", "how sweet", "aww", "wow that's"]
  for (const p of roboticOpeners) {
    if (text.toLowerCase().startsWith(p)) { score -= 50; break }
  }

  // Forbidden words — all platforms
  const forbidden = [
    "scam", " site ", "busy schedule", "operator", "moderator",
    "i am an ai", "as an ai", "language model",
    "get together", "come over", "in person", "phone call",
    "video call", "facetime", "call me", "my number", "hear your voice",
    "meet up", "see you soon", "visit me", "visit you"
  ]
  for (const f of forbidden) {
    if (text.toLowerCase().includes(f)) score -= 80
  }

  // TF-specific forbidden
  if (isTF) {
    const tfForbidden = [" meet ", "meeting", " met "]
    for (const f of tfForbidden) {
      if (text.toLowerCase().includes(f)) score -= 80
    }
  }

  // Length enforcement
  if (isTF) {
    if (text.length < 75)  score -= 100 // Hard fail
    if (text.length > 250) score -= 100 // Hard fail
  } else {
    if (text.length < 50)  score -= 60
    if (text.length > 400) score -= 20
  }

  // CTA mandatory — heavy penalty for no question
  if (!text.includes("?")) score -= 50
  else score += 15

  // Generic openers penalty
  const genericPhrases = ["that sounds amazing", "that's so interesting", "i love that", "you seem really", "i'd love to know more", "wow that's", "oh that's"]
  for (const g of genericPhrases) {
    if (text.toLowerCase().includes(g)) { score -= 20; break }
  }

  // Quality signals
  const contractions = ["i'm", "don't", "can't", "you're", "that's", "i've", "we're", "isn't", "won't", "wouldn't", "haven't"]
  for (const c of contractions) {
    if (text.toLowerCase().includes(c)) { score += 8; break }
  }
  if (text.includes("...")) score += 8  // Ellipsis = feminine voice
  if (text.includes("—")) score += 5   // Em dash = sophisticated punctuation
  if (text.includes("??")) score += 5  // Double question = genuine surprise
  if (/\b(honestly|kinda|actually|literally|lowkey)\b/i.test(text)) score += 5

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

    // ── Re-engagement Analysis Handler ────────────────────────────────────────
    if (message === 'REENGAGE_ANALYSIS') {
      const history = pageContext?.conversationSummary || 'No conversation history available.'
      const reengagePrompt = `You help a real woman re-engage a man who has gone quiet on a dating platform.

CONVERSATION HISTORY:
${history}

TASK:
1. Analyse WHY he likely went quiet — be specific and insightful (1-2 sentences max)
2. Write 3 trigger messages to re-engage him, each using a different approach:
   - One referencing something specific from his profile or their conversation
   - One creating curiosity or a light mystery that makes him want to respond
   - One that is warm and gently calls him back without being desperate

RULES for trigger messages:
- Each between 50-150 characters
- Never desperate, never "why are you ignoring me"
- Natural, confident, warm, genuinely feminine
- No "meet", "scam", "site", "busy schedule"
- Each should end with a question or an open hook

Return ONLY valid JSON with no extra text:
{"analysis":"specific reason why he went quiet","triggers":[{"label":"Profile reference","text":"message here"},{"label":"Curiosity hook","text":"message here"},{"label":"Warm callback","text":"message here"}]}`

      const { text: rawAnalysis, modelUsed: aModel } = await generateWithFallback(reengagePrompt)
      
      try {
        const cleaned = rawAnalysis.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
        const parsed = JSON.parse(cleaned)
        return Response.json({ 
          replies: (parsed.triggers || []).map((t: any) => ({ tone: t.label || 'Trigger', text: t.text || '' })),
          analysis: parsed.analysis || '',
          modelUsed: aModel,
          isReengage: true
        }, { headers: corsHeaders })
      } catch {
        return Response.json({ 
          replies: [{ tone: 'Trigger', text: rawAnalysis.substring(0, 150) }],
          analysis: 'Analysis unavailable',
          modelUsed: aModel,
          isReengage: true
        }, { headers: corsHeaders })
      }
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

    // ── Post-processing: enforce platform rules on every reply ─────────────────
    const platform = pageContext?.platform || 'generic'
    const isTextingFactory = platform === 'textingfactory' || platform === 'chathomebase'

    replies = replies.map(r => {
      let text = r.text || ''

      // ── Hard filter: strip meetup and call language ──────────────────────────
      const meetupReplacements: [RegExp, string][] = [
        [/\bget together\b/gi, 'keep talking'],
        [/\bcome over\b/gi, 'keep this going'],
        [/\bin person\b/gi, 'on here'],
        [/\bphone call\b/gi, 'conversation'],
        [/\bvideo call\b/gi, 'conversation'],
        [/\bfacetime\b/gi, 'talking'],
        [/\bcall me\b/gi, 'message me'],
        [/\bhear your voice\b/gi, 'hear more from you'],
        [/\bmeet up\b/gi, 'connect more'],
        [/\bsee you soon\b/gi, 'talk more soon'],
        [/\bvisit me\b/gi, 'talk to me more'],
        [/\bvisit you\b/gi, 'talk to you more'],
      ]
      for (const [pattern, replacement] of meetupReplacements) {
        text = text.replace(pattern, replacement)
      }

      // ── Hard filter: remove generic openers ─────────────────────────────────
      const genericOpeners = [
        /^that sounds amazing[,!.]?\s*/i,
        /^that's so sweet[,!.]?\s*/i,
        /^aww[,!.]?\s*/i,
        /^how sweet[,!.]?\s*/i,
        /^i love that[,!.]?\s*/i,
        /^wow that's[,!.]?\s*/i,
        /^oh that's[,!.]?\s*/i,
        /^that's amazing[,!.]?\s*/i,
      ]
      for (const opener of genericOpeners) {
        if (opener.test(text.trim())) {
          text = text.replace(opener, '').trim()
          if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1)
        }
      }

      // Enforce MAX character limit for TF
      if (isTextingFactory) {
        const isShortMsg = message.trim().length < 20
        const maxChars = isShortMsg ? 100 : 250
        if (text.length > maxChars) {
          const truncated = text.substring(0, maxChars - 3)
          const lastBreak = Math.max(truncated.lastIndexOf('?'), truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf(','))
          text = lastBreak > (maxChars * 0.55) ? truncated.substring(0, lastBreak + 1) : truncated + '...'
        }
      }

      // Enforce MINIMUM 75 chars — pad naturally if too short
      if (text.length < 75) {
        const naturalPadding = [
          "... honestly I want to hear more about that",
          " — okay now I'm genuinely curious, tell me more?",
          "... there's definitely more to this story isn't there?",
          " I feel like you're holding back on me haha",
          "... okay you've got my full attention now",
          " — what made you think of that?",
        ]
        for (const pad of naturalPadding) {
          const padded = text.endsWith('...') ? text.slice(0,-3) + pad : text + pad
          if (padded.length >= 75 && (!isTextingFactory || padded.length <= 250)) {
            text = padded
            break
          }
        }
        // Last resort
        if (text.length < 75) {
          text = text + " — what's the story behind that?"
        }
      }

      // Ensure IRRESISTIBLE CTA — replace weak CTAs with stronger ones
      const weakCTAs = ["What do you think?", "How about you?", "What about you?", "Does that sound good?", "Right?", "You?"]
      const hasWeakCTA = weakCTAs.some(w => text.endsWith(w))
      
      if (!text.includes('?') || hasWeakCTA) {
        // Remove weak CTA first
        if (hasWeakCTA) {
          for (const w of weakCTAs) {
            if (text.endsWith(w)) { text = text.slice(0, -w.length).trimEnd(); break }
          }
        }
        // Add irresistible CTA
        const strongCTAs = [
          " — okay your turn, be honest with me?",
          "... wait, what actually happened after that?",
          " — tell me the real version, not the polished one?",
          " so which one are you really?",
          "... I need to know more about this, go on?",
          " — best or worst experience with that?",
        ]
        for (const cta of strongCTAs) {
          const withCta = text + cta
          if (!isTextingFactory || withCta.length <= 250) {
            text = withCta
            break
          }
        }
      }

      return { ...r, text }
    })

    const scored = replies
      .map(r => ({ ...r, score: scoreReply(r.text, pageContext?.platform) }))
      .filter(r => r.score >= 30)
      .sort((a, b) => b.score - a.score)
      .map(({ tone, text }) => ({ tone, text }))

    const finalReplies = scored.length >= 2 ? scored : replies.slice(0, 4)

    // Only log usage and return limits if user is authenticated
    if (!isTestKey && user) {
      await logUsage(user.id, pageContext?.platform || 'extension', isPro ? 'pro' : 'standard', modelUsed)
    }

    return Response.json({
      replies: finalReplies,
      remaining: isTestKey ? 999 : (limitCheck?.remaining ?? 999),
      plan: isTestKey ? 'pro' : (user?.plan ?? 'free'),
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
