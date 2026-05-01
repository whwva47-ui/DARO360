"use client"

import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MessageInput({ value, onChange, placeholder }: MessageInputProps) {
  return (
    <div>
      <label htmlFor="message-input" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
        What he said
      </label>
      <Textarea
        id="message-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-24 resize-none border-blue-200 bg-blue-50/50 text-base focus:border-blue-400 focus:ring-blue-400"
        aria-describedby="message-help"
      />
    </div>
  )
}
