// v2.1.4
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
  const config = {
    version: "2.1.4",
    maintenanceMode: false,
    maintenanceMessage: "Extension is being updated. Back in a few minutes!",
    announcement: null,
    typing: {
      defaultWPM: 60,
      minWPM: 20,
      maxWPM: 120,
      typoRate: 0.08,
      enableTypoCorrection: true,
      wordPauseEnabled: true,
    },
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
        coldMessageTrigger: true,
        triggerThreshold: 15,
      },
      onlyfans: { enabled: true },
      generic: { enabled: true, minChars: 80, maxChars: 220 },
    },
    features: {
      autoDetectMessages: true,
      showRegenerateButton: true,
      showNewMessageBadge: true,
      showTypingSpeed: true,
      showCustomInstructions: true,
      showContextPreview: true,
      showModelBadge: true,
      requireAuth: false,
      scrollCaptureEnabled: true,
    },
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
    availableTones: [
      "Casual", "Flirty", "Confident", "Playful",
      "Warm", "Teasing", "Empathetic", "Spicy", "Naughty"
    ],
    conversationTopics: [
      "his hobbies and what he loves about them",
      "his pets especially dogs and cats",
      "his work and what he enjoys about it",
      "his hometown or where he grew up",
      "travel places he has been or wants to visit",
      "food what he loves to eat or cook",
      "weekends how he likes to spend free time",
      "funny or interesting stories from his life",
      "his dreams or what he is working toward",
      "sports or fitness",
      "music movies or shows he enjoys",
      "things that make him laugh",
    ],
    deflectionHints: {
      contact: "Warm not dismissive. Stay here to build trust. Make him feel valued not rejected.",
      meetup: "Warm specific believable excuse. Show you want to eventually. Never busy schedule.",
      subscription: "Empathy. You also pay for this. The connection makes it worth it.",
      photo: "Maybe if you play your cards right",
    },
    globalBannedWords: ["scam", "busy schedule"],
    customCSS: "",
    notifyOnNewMessage: true,
    badgeColor: "#ef4444",
  }

  return NextResponse.json(config, { headers: corsHeaders })
}

