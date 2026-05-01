"use client"

import { cn } from "@/lib/utils"

interface Tone {
  id: string
  label: string
  description: string
}

interface ToneSelectorProps {
  tones: Tone[]
  selected: string
  onSelect: (id: string) => void
}

export function ToneSelector({ tones, selected, onSelect }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reply tone">
      {tones.map((tone) => (
        <button
          key={tone.id}
          type="button"
          role="radio"
          aria-checked={selected === tone.id}
          onClick={() => onSelect(tone.id)}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selected === tone.id
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          title={tone.description}
        >
          {tone.label}
        </button>
      ))}
    </div>
  )
}
