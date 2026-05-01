import { NextResponse } from 'next/server'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  // ═══════════════════════════════════════════════════════════════════════════
  // CHATTER'S INNER CIRCLE — REMOTE CONTROL CENTRE
  // ═══════════════════════════════════════════════════════════════════════════
  // Every setting here pushes to ALL subscribers instantly.
  // No reinstall required. Changes apply on the next page load.
  //
  // HOW TO USE:
  // - Change any value below
  // - Commit to GitHub
  // - Vercel redeploys in ~2 minutes
  // - All subscribers see the change immediately
  // ═══════════════════════════════════════════════════════════════════════════

  const config = {

    // ── Version ───────────────────────────────────────────────────────────────
    // Increment this whenever you make changes so you can track versions
    version: "2.1.0",

    // ── Maintenance Mode ──────────────────────────────────────────────────────
    // Set to true to disable the extension for all users (e.g. during updates)
    maintenanceMode: false,
    maintenanceMessage: "Extension is being updated. Back in a few minutes!",

    // ── Announcement Banner ───────────────────────────────────────────────────
    // Shows a banner at the top of the panel for all users
    // Set to null to hide it
    // Types: "info" (blue), "success" (green), "warning" (yellow), "error" (red)
    announcement: null,
    // Example to show a banner:
    // announcement: { type: "info", message: "New: Alpha.date trigger messages now available!" }

    // ── Typing Settings ───────────────────────────────────────────────────────
    // Control typing speed and behaviour remotely
    typing: {
      defaultWPM: 40,          // Default words per minute
      minWPM: 20,              // Minimum allowed WPM
      maxWPM: 120,             // Maximum allowed WPM
      typoRate: 0.08,          // Realistic typo rate (0.08 = 8% of words)
      enableTypoCorrection: true,  // Enable backspace-and-correct simulation
      wordPauseEnabled: true,  // Enable natural pauses between words
    },

    // ── Platform Settings ─────────────────────────────────────────────────────
    // Configure per-platform behaviour
    platforms: {
      textingfactory: {
        enabled: true,
        minChars: 75,
        maxChars: 250,
        requireCTA: true,
        bannedWords: ["scam", "site", "busy schedule", "meet", "meeting", "met"],
      },
      alphadate: {
        enabled: true,
        coldMessageTrigger: true,  // Enable cold message detection
        triggerThreshold: 15,      // Messages under this length trigger cold detection
      },
      onlyfans: {
        enabled: true,
      },
      generic: {
        enabled: true,
        minChars: 80,
        maxChars: 220,
      },
    },

    // ── Feature Flags ─────────────────────────────────────────────────────────
    // Toggle features on/off for all users instantly
    features: {
      autoDetectMessages: true,      // Auto-fill message input from page
      showRegenerateButton: true,    // Show Regenerate button
      showNewMessageBadge: true,     // Red badge on capsule for new messages
      showTypingSpeed: true,         // Show WPM controls on reply cards
      showCustomInstructions: true,  // Show custom instructions field
      showContextPreview: true,      // Show chat history preview in popup
      showModelBadge: true,          // Show which AI model responded
      requireAuth: false,            // Set true to enforce login (false = test mode)
      scrollCaptureEnabled: true,    // Enable scroll-to-capture history
    },

    // ── UI Labels ─────────────────────────────────────────────────────────────
    // Change any text shown in the extension without reinstalling
    labels: {
      panelTitle: "Chatter's Inner Circle",
      whatHeSaid: "What he said",
      yourReplies: "Your replies",
      generateButton: "Generate Replies",
      regenerateButton: "Regenerate",
      typeButton: "Type",
      copyButton: "Copy",
      customInstructions: "Add custom instructions",
      inputPlaceholder: "Paste his message or wait for auto-detect...",
      customPlaceholder: "e.g. Be more mysterious, reference his dog...",
      autoDetectedText: "Auto-detected from chat",
      contextPreviewTitle: "Chat context",
      noHistoryText: "Open a conversation to load context",
    },

    // ── Tone Options ──────────────────────────────────────────────────────────
    // Control which tones the AI can use — add or remove tones here
    availableTones: [
      "Casual", "Flirty", "Confident", "Playful",
      "Warm", "Teasing", "Empathetic", "Spicy", "Naughty"
    ],

    // ── Conversation Topics ───────────────────────────────────────────────────
    // Topics the AI should explore to keep conversations going
    // Add new topics here and they push to all subscribers immediately
    conversationTopics: [
      "his hobbies and what he loves about them",
      "his pets — especially dogs and cats",
      "his work and what he enjoys about it",
      "his hometown or where he grew up",
      "travel — places he has been or wants to visit",
      "food — what he loves to eat or cook",
      "weekends — how he likes to spend free time",
      "funny or interesting stories from his life",
      "his dreams or what he is working toward",
      "sports or fitness",
      "music, movies, or shows he enjoys",
      "things that make him laugh",
    ],

    // ── Deflection Scripts ────────────────────────────────────────────────────
    // Example responses for common deflection situations
    // The AI uses these as inspiration, not verbatim scripts
    deflectionHints: {
      contact: "Warm, not dismissive. Stay here to build trust. Make him feel valued not rejected.",
      meetup: "Warm specific believable excuse. Show you want to eventually. Never busy schedule.",
      subscription: "Empathy. You also pay for this. The connection makes it worth it.",
      photo: "Maybe if you play your cards right",
    },

    // ── Banned Words (Global) ─────────────────────────────────────────────────
    // These words are banned across ALL platforms
    globalBannedWords: ["scam", "busy schedule"],

    // ── Custom CSS ────────────────────────────────────────────────────────────
    // Inject custom CSS into the floating panel (not the popup)
    // Use this to tweak colours or sizes without reinstalling
    customCSS: `
      /* Panel tweaks — edit freely */
      /* Example: make reply cards slightly taller */
      /* .mp-reply-card { min-height: 80px; } */
    `,

    // ── Notification Settings ─────────────────────────────────────────────────
    notifyOnNewMessage: true,   // Flash capsule badge when new message detected
    badgeColor: "#ef4444",      // Red badge colour
  }

  return NextResponse.json(config, { headers: corsHeaders })
}
