"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Copy, Keyboard, Minus, Plus, Image } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface ReplyCardProps {
  tone: string
  reply: string
  index: number
  onCopy: () => void
  isCopied: boolean
  onTypeToChat: () => void
  isTypingToChat: boolean
  typingIndex: number | null
  wpm: number
  onIncreaseWpm: () => void
  onDecreaseWpm: () => void
  onGif: () => void
}

const toneColors: Record<string, { bg: string; text: string; dot: string }> = {
  Casual: { bg: "bg-emerald-900/30", text: "text-emerald-400", dot: "bg-emerald-500" },
  Flirty: { bg: "bg-pink-900/30", text: "text-pink-400", dot: "bg-pink-500" },
  Confident: { bg: "bg-amber-900/30", text: "text-amber-400", dot: "bg-amber-500" },
  Formal: { bg: "bg-slate-700/30", text: "text-slate-300", dot: "bg-slate-400" },
  Playful: { bg: "bg-purple-900/30", text: "text-purple-400", dot: "bg-purple-500" },
  Warm: { bg: "bg-orange-900/30", text: "text-orange-400", dot: "bg-orange-500" },
  Teasing: { bg: "bg-rose-900/30", text: "text-rose-400", dot: "bg-rose-500" },
  Empathetic: { bg: "bg-cyan-900/30", text: "text-cyan-400", dot: "bg-cyan-500" },
  Spicy: { bg: "bg-red-900/30", text: "text-red-400", dot: "bg-red-500" },
  Naughty: { bg: "bg-fuchsia-900/30", text: "text-fuchsia-400", dot: "bg-fuchsia-500" },
}

export function ReplyCard({ 
  tone,
  reply, 
  index, 
  onCopy, 
  isCopied, 
  onTypeToChat,
  isTypingToChat,
  typingIndex,
  wpm,
  onIncreaseWpm,
  onDecreaseWpm,
  onGif,
}: ReplyCardProps) {
  const isCurrentlyTyping = isTypingToChat && typingIndex === index
  const colors = toneColors[tone] || { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-sm">
      <CardContent className="p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${colors.dot}`}></span>
          <span className={`text-xs font-medium ${colors.text}`}>
            {tone}
          </span>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-foreground">{reply}</p>
        
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={onTypeToChat}
            disabled={isTypingToChat}
            className="flex-1 gap-2"
          >
            {isCurrentlyTyping ? (
              <>
                <Spinner className="h-4 w-4" />
                Typing...
              </>
            ) : (
              <>
                <Keyboard className="h-4 w-4" />
                Type to Chat
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="gap-1.5"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGif}
            className="gap-1.5 text-xs"
          >
            <Image className="h-4 w-4" />
            GIF
          </Button>
          <div className="flex items-center gap-1 rounded-md border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecreaseWpm}
              disabled={isTypingToChat || wpm <= 20}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="min-w-[50px] text-center text-xs font-medium">
              {wpm} WPM
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onIncreaseWpm}
              disabled={isTypingToChat || wpm >= 200}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
