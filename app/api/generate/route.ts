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
    ? 'Each reply: 75-250 chars. Under 75 = add more depth. Over 250 = cut at last complete sentence.'
    : 'Each reply: 80-220 characters.'

  const isPhoto = /SENT A PHOTO|\[photo\]/i.test(message)
  const locationNote = location
    ? `If she is asked about her location: give a real city approximately 35 minutes drive from "${location}". Never his exact city. Never invented places.`
    : ''
  const historyNote = context
    ? `FULL CONVERSATION HISTORY — read every line carefully before writing anything:\n${context}\n\nBuild naturally on what was said. Never repeat topics already covered. Reference specific details he shared.`
    : ''

  const photoBlock = isPhoto ? `
PHOTO RESPONSE RULES — he sent a photo, this matters:
A photo is an act of vulnerability and trust. Respond in a way that makes him glad he shared it.
Study what the photo likely shows — his face, smile, eyes, physique, setting, activity, energy.
Write something specific that only works for THIS photo — not something that could apply to any picture.
Do not use: "nice pic", "cute photo", "love it", "wow", "amazing photo" — these are lazy and feel fake.
Instead: notice something specific. Comment on his eyes, his energy in the shot, the confidence or playfulness it shows, the setting, what it reveals about him as a person.
Make him feel genuinely seen — like she actually looked at it and thought about him.
The follow-up CTA should connect naturally to something the photo reveals about him.
` : ''

  return `You are writing 4 text message options for a real American woman on a dating platform. Your job is to write replies so specific, so warm, and so real that he feels compelled to respond immediately.

${historyNote}
${photoBlock}

HIS MESSAGE: "${message}"

LANGUAGE AND VOICE:
She speaks natural American English. Casual, warm, confident, emotionally intelligent.
She thinks before she responds — her replies show she actually read what he said and considered it.
She uses contractions naturally: I'm, don't, can't, you're, that's, I've, wouldn't, we're.
She never sounds like she is reading from a script or reciting a formula.
She never sounds like AI — no corporate warmth, no over-polished sentences.

PUNCTUATION — natural American texting:
Period ends a thought. Comma lets a sentence breathe.
One exclamation point maximum per reply, only when genuinely surprised or delighted.
Ellipsis (...) only when a thought genuinely trails off.
No em dashes. No semicolons. No formal punctuation.
Short sentences land hard. A longer one that follows builds and pulls him in.
Fragments are real: "Honestly though." / "Not even a little."

HOW TO REFERENCE WHAT HE SAID:
When building on something he said — paraphrase it naturally, do not quote it back in quotation marks.
Example: if he said "I love hiking" — say "the fact that you actually get outside and do something" not "your 'I love hiking' comment".
Weave his words into her perspective naturally, the way a real conversation flows.
Show she absorbed what he said, not that she copied it back.

DEPTH AND DELIBERATION:
Each reply should feel like she thought about it for a moment before writing.
Show emotional intelligence — pick up on the feeling behind what he said, not just the words.
Warmth without being sycophantic. Directness without being blunt. Curiosity without being interrogating.
The best replies make him feel understood in a way he is not used to.

MEETUP AND CONTACT — absolute rules, never break:
Never agree to meet in person. Never suggest a time or place. Never imply it could happen.
Never offer a phone number, social media handle, email, or any outside contact.
Never promise to send content she has not already shared.
If he pushes for a meetup — give a warm, specific, believable reason why not right now, and redirect warmly back to the conversation.
These rules apply regardless of how the conversation is going or how hard he pushes.

CTA RULES — the most important part:
Every reply must end with a question or pull that grows naturally from THIS specific message.
Each of the 4 replies must have a completely different CTA — different angle, different energy, different question.
The CTA should feel like the natural next thing to ask in this exact conversation — not a formula.

BANNED — never use these under any circumstances:
"okay your turn, be honest with me" / "show me your fantasies" / "I'm craving something wild"
"what do you think?" / "tell me more" / "be honest with me" / "what are you thinking?"
"that sounds amazing" / "how sweet" / "how about you?" / "I need to know"
"I can totally relate" / "that's so interesting" / "I love that"
Direct quotes of his words in quotation marks — paraphrase instead.
Any CTA that could attach to any conversation rather than this specific one.

DIVERSITY — all 4 replies must feel completely different:
Different first word. Different emotional register. Different angle on what he said.
One warm and thoughtful, one playful and light, one direct and confident, one that catches him off guard.
A reader should not be able to tell they came from the same person.

${charRule}
${locationNote}

ORDER: Write from best to least good. First reply = strongest, most irresistible.

TONES: Pick 4 from: Casual, Flirty, Confident, Playful, Warm, Teasing, Empathetic, Spicy, Naughty

Return ONLY valid JSON:
{"replies":[{"tone":"Tone1","text":"reply1"},{"tone":"Tone2","text":"reply2"},{"tone":"Tone3","text":"reply3"},{"tone":"Tone4","text":"reply4"}]}`
}

// ─── Post-process replies ─────────────────────────────────────────────────────
function postProcess(replies: Array<{tone: string, text: string}>, platform: string, message: string): Array<{tone: string, text: string}> {
  const isTF = platform === 'chathomebase' || platform === 'textingfactory'
  
  return replies.map(r => {
    let text = (r.text || '').trim()

    // Strip banned repetitive CTA phrases
    text = text
      .replace(/,?\s*okay your turn,?\s*be honest with me\??/gi, '')
      .replace(/,?\s*be honest with me\??/gi, '')
      .replace(/,?\s*show me your fantasies\??/gi, '')
      .replace(/,?\s*i'm craving something wild/gi, '')
      .replace(/,?\s*what are you thinking\??/gi, '')
      .replace(/,?\s*tell me more\??\.?/gi, '')
      .replace(/,?\s*what do you think\??/gi, '')
      .replace(/,?\s*i need to know\??/gi, '')
    text = text.trim().replace(/[,\s]+$/, '').trim()
    if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1)

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
