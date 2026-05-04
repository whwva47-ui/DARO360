// CIC generate route v8.0.0 — fixed Gemini model + Groq fallback model
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'

// ─── CORS ─────────────────────────────────────────────────────────────────────
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() })
}

// ─── AI Generation ────────────────────────────────────────────────────────────
async function generate(prompt: string): Promise<string> {
  const errors: string[] = []

  // Try Groq with multiple models (if one hits daily limit, try next)
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    const groqModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'gemma2-9b-it',
      'mixtral-8x7b-32768',
    ]
    const groq = createGroq({ apiKey: groqKey })
    for (const model of groqModels) {
      try {
        const result = await generateText({
          model: groq(model),
          prompt,
          temperature: 0.85,
          maxOutputTokens: 800,
        })
        if (result.text) {
          console.log('[CIC] Groq success with model:', model)
          return result.text
        }
      } catch (e: any) {
        const status = e?.statusCode || e?.status || ''
        errors.push(`Groq/${model}(${status}): ${e?.message?.substring(0,80)}`)
        console.warn('[CIC] Groq model failed:', model, status)
        // Only try next model if rate limited — otherwise break
        if (status !== 429 && !e?.message?.includes('Rate limit') && !e?.message?.includes('limit')) break
      }
    }
  }

  // Try Google Gemini — AI SDK v5 uses google() directly
  const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (googleKey) {
    const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest']
    for (const model of geminiModels) {
      try {
        const result = await generateText({
          model: google(model),
          prompt,
          temperature: 0.85,
          maxOutputTokens: 800,
        })
        if (result.text) {
          console.log('[CIC] Gemini success with model:', model)
          return result.text
        }
      } catch (e: any) {
        errors.push(`Gemini/${model}: ${e?.message?.substring(0,80)}`)
        console.warn('[CIC] Gemini model failed:', model, e?.message?.substring(0,80))
      }
    }
  }

  // Try OpenAI last
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const openai = createOpenAI({ apiKey: openaiKey })
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        prompt,
        temperature: 0.85,
        maxOutputTokens: 800,
      })
      if (result.text) return result.text
    } catch (e: any) {
      errors.push(`OpenAI: ${e?.message?.substring(0,80)}`)
    }
  }

  throw new Error('All AI providers failed: ' + errors.join(' | '))
}

// ─── Parse AI response ────────────────────────────────────────────────────────
function parseReplies(text: string): Array<{tone: string, text: string}> {
  try {
    // Remove markdown code fences
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed.replies)) return parsed.replies
  } catch {}

  // Try to find JSON anywhere in response
  const match = text.match(/\{[\s\S]*"replies"[\s\S]*?\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed.replies)) return parsed.replies
    } catch {}
  }

  return []
}

// ─── Build prompt ─────────────────────────────────────────────────────────────
function buildPrompt(message: string, platform: string, context: string, location: string): string {
  const isTF = platform === 'chathomebase' || platform === 'textingfactory'
  const charRule = isTF
    ? 'Each reply: 75-250 chars. Under 75 = add more warmth or detail. Over 250 = cut at last complete sentence.'
    : 'Each reply: 80-220 characters.'

  const locationNote = location
    ? `If he asks where she lives or is located: respond with a real American city 30-40 miles from "${location}". Never use his exact city.`
    : ''

  const historyNote = context
    ? `CONVERSATION HISTORY:\n${context}\n\nPick up naturally where this left off. Use what he said.`
    : ''

  return `You are writing 4 text message reply options for a real American woman chatting on a dating platform. Write like a real person texts — not like a chatbot or essay.

${historyNote}

HIS MESSAGE: "${message}"

LANGUAGE & VOICE:
She speaks natural American English. Casual but smart. Warm but confident.
She uses everyday contractions: I'm, don't, can't, you're, that's, I've, wouldn't, hasn't, we're
She uses common American expressions naturally when they fit the moment
She never sounds formal, stiff, or over-polished
She never uses words or phrases that sound like AI output

PUNCTUATION — standard, natural, American texting style:
Use a period to end a thought. Use a comma to let a sentence breathe, like this.
A question mark at the end of a real question? Yes, always.
One exclamation point per reply, only when she is genuinely excited or surprised.
A comma before "and" or "but" in longer sentences makes it flow right.
She uses "..." sometimes when a thought trails off naturally.
She never uses em dashes, semicolons, or formal punctuation — that sounds like an essay, not a text.
Quotes around something he said show she was listening.
Short sentences land hard. A longer one after it builds momentum and pulls him in.

CONTENT RULES:
- Answer everything he asked, directly, before anything else
- Quote or reference something specific he said — shows she was actually reading
- End every reply with a genuine question tied to what HE said — not a generic one
- Never suggest meeting up, a call, or share any contact info
- When he is direct or explicit — match his energy, be specific and vivid
- ${charRule}
- ${locationNote}

TONES: Pick 4 from: Casual, Flirty, Confident, Playful, Warm, Teasing, Empathetic, Spicy, Naughty
Each of the 4 replies must feel completely different — different angle, different energy, different opening word.

Return ONLY valid JSON with no extra text:
{"replies":[{"tone":"Tone1","text":"reply1"},{"tone":"Tone2","text":"reply2"},{"tone":"Tone3","text":"reply3"},{"tone":"Tone4","text":"reply4"}]}`
}

// ─── Post-process replies ─────────────────────────────────────────────────────
function postProcess(replies: Array<{tone: string, text: string}>, platform: string, message: string): Array<{tone: string, text: string}> {
  const isTF = platform === 'chathomebase' || platform === 'textingfactory'
  
  return replies.map(r => {
    let text = (r.text || '').trim()
    
    // Strip meetup/call language
    text = text
      .replace(/\bget together\b/gi, 'keep talking')
      .replace(/\bcome over\b/gi, 'keep this going')
      .replace(/\bphone call\b/gi, 'conversation')
      .replace(/\bcall me\b/gi, 'message me')
      .replace(/\bmeet up\b/gi, 'connect more')
      .replace(/\bin person\b/gi, 'on here')

    // Strip generic openers
    text = text.replace(/^(that sounds amazing|that's so sweet|aww|how sweet|i love that|wow that's|oh that's)[,!.]?\s*/i, '')
    if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1)

    // TF max 250 chars
    if (isTF && text.length > 250) {
      const cut = text.substring(0, 247)
      const last = Math.max(cut.lastIndexOf('?'), cut.lastIndexOf('.'), cut.lastIndexOf('!'))
      text = last > 150 ? cut.substring(0, last + 1) : cut + '...'
    }

    // Min 75 chars
    if (text.length < 75) {
      const fillers = [
        " — honestly I need to hear more about that?",
        " — okay now I'm genuinely curious, tell me more?",
        "... there's more to this story isn't there?",
        " — what made you think of that?",
      ]
      for (const f of fillers) {
        const padded = text + f
        if (padded.length >= 75 && (!isTF || padded.length <= 250)) {
          text = padded
          break
        }
      }
    }

    // Ensure CTA
    if (!text.includes('?')) {
      const ctas = [
        " — okay your turn, be honest with me?",
        "... what actually happened after that?",
        " — tell me the real version?",
        " — what are you thinking right now?",
      ]
      for (const cta of ctas) {
        const withCta = text + cta
        if (!isTF || withCta.length <= 250) {
          text = withCta
          break
        }
      }
    }

    return { tone: r.tone || 'Reply', text }
  }).filter(r => r.text.length > 10)
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const headers = cors()

  try {
    const body = await req.json()
    const message = ((body.message || '') + '').replace(/[\x00-\x1F\x7F-\x9F`]/g, ' ').trim()
    const pageContext = body.pageContext || {}
    const platform = (pageContext.platform || 'generic').toString()
    const context = (pageContext.conversationSummary || '').toString().substring(0, 2000)
    const location = (pageContext.userLocation || '').toString()

    if (!message) {
      return NextResponse.json({ error: 'Message is required', replies: [] }, { status: 400, headers })
    }

    // Handle re-engagement analysis
    if (message === 'REENGAGE_ANALYSIS') {
      const prompt = `A woman needs 3 re-engagement messages to send a man who went quiet.

Conversation: ${context || 'No history available'}

Write 3 trigger messages (50-150 chars each):
1. References something specific from their chat
2. Creates curiosity/mystery  
3. Warm gentle callback

Return ONLY: {"analysis":"why he went quiet","triggers":[{"label":"label","text":"message"},{"label":"label","text":"message"},{"label":"label","text":"message"}]}`

      const raw = await generate(prompt)
      try {
        const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
        const parsed = JSON.parse(clean)
        return NextResponse.json({
          replies: (parsed.triggers || []).map((t: any) => ({ tone: t.label, text: t.text })),
          analysis: parsed.analysis || '',
          isReengage: true
        }, { headers })
      } catch {
        return NextResponse.json({
          replies: [{ tone: 'Trigger', text: raw.substring(0, 150) }],
          analysis: '',
          isReengage: true
        }, { headers })
      }
    }

    // Build prompt and generate
    const prompt = buildPrompt(message, platform, context, location)
    const rawText = await generate(prompt)
    const replies = parseReplies(rawText)
    const finalReplies = postProcess(
      replies.length >= 1 ? replies : [{ tone: 'Casual', text: rawText.substring(0, 200) }],
      platform,
      message
    )

    return NextResponse.json({
      replies: finalReplies,
      remaining: 999,
      plan: 'pro',
      modelUsed: 'groq/llama-3.3-70b'
    }, { headers })

  } catch (error: any) {
    const errMsg = error?.message || 'Generation failed'
    console.error('[CIC] Error:', errMsg)
    return NextResponse.json({
      error: errMsg,
      replies: [],
      remaining: 999
    }, { status: 200, headers })
  }
}
