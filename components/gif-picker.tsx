"use client"

import { useState, useEffect } from "react"
import { X, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface GifPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (gifUrl: string) => void
  initialSearch?: string
}

interface GiphyGif {
  id: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    original: {
      url: string
    }
  }
  title: string
}

export function GifPicker({ isOpen, onClose, onSelect, initialSearch = "" }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // GIPHY API key (public beta key for demo - replace with your own for production)
  const GIPHY_API_KEY = "dc6zaTOxFJmzC"

  useEffect(() => {
    if (isOpen && initialSearch) {
      setSearchTerm(initialSearch)
      searchGifs(initialSearch)
    }
  }, [isOpen, initialSearch])

  useEffect(() => {
    if (isOpen && !initialSearch) {
      fetchTrendingGifs()
    }
  }, [isOpen])

  const fetchTrendingGifs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=r`
      )
      const data = await response.json()
      setGifs(data.data || [])
    } catch {
      setError("Failed to load GIFs")
    } finally {
      setIsLoading(false)
    }
  }

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      fetchTrendingGifs()
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=r`
      )
      const data = await response.json()
      setGifs(data.data || [])
    } catch {
      setError("Failed to search GIFs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchGifs(searchTerm)
  }

  const handleSelectGif = (gif: GiphyGif) => {
    onSelect(gif.images.original.url)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative mx-4 flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="text-sm font-semibold text-foreground">Choose a GIF</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search GIFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {error}
            </div>
          ) : gifs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No GIFs found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelectGif(gif)}
                  className="group relative overflow-hidden rounded-lg bg-muted transition-transform hover:scale-105"
                  style={{
                    aspectRatio: `${gif.images.fixed_height.width} / ${gif.images.fixed_height.height}`,
                  }}
                >
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 text-center">
          <span className="text-xs text-muted-foreground">Powered by GIPHY</span>
        </div>
      </div>
    </div>
  )
}
