import { NextResponse } from 'next/server'
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }) }
export async function GET() {
  return NextResponse.json({
    version: "2.1.4",
    maintenanceMode: false,
    announcement: null,
    typing: { defaultWPM: 60, minWPM: 20, maxWPM: 120, typoRate: 0.08, enableTypoCorrection: true, wordPauseEnabled: true },
    platforms: { textingfactory: { enabled: true, minChars: 75, maxChars: 250, requireCTA: true }, alphadate: { enabled: true, coldMessageTrigger: true }, generic: { enabled: true } },
    features: { autoDetectMessages: true, showRegenerateButton: true, showNewMessageBadge: true, showTypingSpeed: true, showCustomInstructions: true, showContextPreview: true, showModelBadge: true, requireAuth: false, scrollCaptureEnabled: true },
    labels: { whatHeSaid: "What he said", yourReplies: "Your replies", generateButton: "Generate Replies", regenerateButton: "Regenerate", typeButton: "Type", copyButton: "Copy", customInstructions: "Add custom instructions", inputPlaceholder: "Paste his message or wait for auto-detect...", autoDetectedText: "Auto-detected from chat" },
    availableTones: ["Casual","Flirty","Confident","Playful","Warm","Teasing","Empathetic","Spicy","Naughty"],
    globalBannedWords: ["scam","busy schedule"],
    customCSS: "",
    notifyOnNewMessage: true,
    badgeColor: "#ef4444"
  }, { headers: cors })
}
