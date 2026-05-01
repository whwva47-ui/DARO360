import { NextResponse } from 'next/server'

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function GET() {
  return NextResponse.json({
    version: "2.0.0",
    maintenanceMode: false,
    features: {
      autoDetectMessages: true,
      showRegenerateButton: true,
      showTypingSpeed: true,
      showCustomInstructions: true,
      requireAuth: true,
    },
    labels: {
      whatHeSaid: "What he said",
      yourReplies: "Your replies",
      generateButton: "Generate Replies",
      regenerateButton: "Regenerate",
      customInstructions: "Add custom instructions",
      inputPlaceholder: "Paste his message here...",
    },
  }, { headers: cors })
}
