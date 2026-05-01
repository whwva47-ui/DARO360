"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import { 
  MessageSquare, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Rocket, 
  Share2, 
  PlayCircle,
  DollarSign,
  History,
  Copy,
  Check,
  ChevronDown,
  Settings2,
  X,
  Image,
  LogOut,
  User,
  Crown,
  HelpCircle,
  Download,
  ChevronRight
} from "lucide-react"

type Tab = "chat" | "reactivation" | "opener" | "ppv" | "saved"

const platformOptions = [
  { value: "onlyfans", label: "OnlyFans" },
  { value: "textingfactory", label: "Texting Factory" },
  { value: "alphadate", label: "Alpha.date" },
  { value: "fansly", label: "Fansly" },
  { value: "cloudworkers", label: "Cloudworkers" },
  { value: "emoderators", label: "Emoderators" },
  { value: "other", label: "Other platform" },
]

const situationOptions = [
  { value: "new_hi", label: "New user said hi" },
  { value: "quiet", label: "Quiet user, hasn't engaged much" },
  { value: "upsell", label: "Ready to upsell a PPV" },
  { value: "rude", label: "User being rude or pushy" },
  { value: "flirty", label: "Playful or flirty conversation" },
  { value: "personal", label: "Asking personal questions" },
  { value: "fake", label: "Asking if profile is fake" },
  { value: "meet", label: "User wants to meet in person" },
  { value: "price", label: "Complaining about price" },
  { value: "other", label: "Other - describe below" },
]

const toneOptions = [
  { value: "warm", label: "Warm and friendly" },
  { value: "flirty", label: "Playful and flirty" },
  { value: "confident", label: "Confident and firm" },
  { value: "teasing", label: "Teasing and fun" },
  { value: "professional", label: "Professional" },
]

const secondaryToneOptions = [
  { value: "none", label: "None (use single tone)" },
  { value: "warm", label: "Warm and friendly" },
  { value: "flirty", label: "Playful and flirty" },
  { value: "confident", label: "Confident and firm" },
  { value: "teasing", label: "Teasing and fun" },
  { value: "mysterious", label: "Mysterious and intriguing" },
  { value: "vulnerable", label: "Slightly vulnerable" },
  { value: "humorous", label: "Lightly humorous" },
]

const inactiveOptions = [
  { value: "hours", label: "A few hours" },
  { value: "1day", label: "1 day" },
  { value: "2-3days", label: "2 to 3 days" },
  { value: "week", label: "About a week" },
  { value: "longer", label: "Longer than a week" },
]

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("chat")
  const [platform, setPlatform] = useState("")
  const [situation, setSituation] = useState("")
  const [tone, setTone] = useState("")
  const [secondaryTone, setSecondaryTone] = useState("none")
  const [subscriberMessage, setSubscriberMessage] = useState("")
  const [chatHistory, setChatHistory] = useState("")
  const [goal, setGoal] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [showPromptPanel, setShowPromptPanel] = useState(false)
  
  // Reactivation state
  const [inactiveTime, setInactiveTime] = useState("")
  const [lastMessage, setLastMessage] = useState("")
  const [userDetails, setUserDetails] = useState("")
  
  // Opener state
  const [openerTone, setOpenerTone] = useState("")
  const [openerUserInfo, setOpenerUserInfo] = useState("")
  const [openerAngle, setOpenerAngle] = useState("")
  
  // Results state
  const [replies, setReplies] = useState<{ tone: string; text: string; strategy?: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [generationsLeft] = useState(50)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setReplies([])

    try {
      let prompt = subscriberMessage
      let context = ""

      if (activeTab === "chat") {
        context = `Platform: ${platform}, Situation: ${situation}, Tone: ${tone}${secondaryTone !== "none" ? ` mixed with ${secondaryTone}` : ""}`
        if (chatHistory) context += `, Chat history: ${chatHistory}`
        if (goal) context += `, Goal: ${goal}`
      } else if (activeTab === "reactivation") {
        prompt = `Reactivate a user who has been inactive for ${inactiveTime}. Last message: ${lastMessage}`
        context = `Platform: ${platform}, User details: ${userDetails || "none provided"}`
      } else if (activeTab === "opener") {
        prompt = `Generate an opening message for a new conversation`
        context = `Platform: ${platform}, Tone: ${openerTone}, User info: ${openerUserInfo || "none"}, Angle: ${openerAngle || "general"}`
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: prompt,
          pageContext: { platform, situation, chatHistory },
          customPrompt: customPrompt || context,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setReplies(data.replies || [])
    } catch {
      setReplies([{ tone: "Error", text: "Something went wrong. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (index: number) => {
    await navigator.clipboard.writeText(replies[index]?.text || "")
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const menuItems = [
    { id: "chat" as Tab, icon: MessageSquare, label: "Chat Agent" },
    { id: "reactivation" as Tab, icon: Zap, label: "Reactivation" },
    { id: "opener" as Tab, icon: Rocket, label: "Opener Generator" },
    { id: "ppv" as Tab, icon: DollarSign, label: "PPV Builder", pro: true },
    { id: "saved" as Tab, icon: History, label: "Saved Replies", pro: true },
  ]

  const toneColors: Record<string, string> = {
    Casual: "bg-emerald-500",
    Flirty: "bg-pink-500",
    Confident: "bg-amber-500",
    Formal: "bg-slate-400",
    Playful: "bg-purple-500",
    Warm: "bg-orange-500",
    Teasing: "bg-rose-500",
    Empathetic: "bg-cyan-500",
    Spicy: "bg-red-500",
    Naughty: "bg-fuchsia-500",
    Error: "bg-red-600",
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-lg font-bold text-transparent">
              Chatter&apos;s Inner Circle
            </h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.pro && setActiveTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-purple-600/20 to-amber-500/20 text-foreground"
                  : item.pro
                  ? "cursor-not-allowed text-muted-foreground opacity-50"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 ${activeTab === item.id ? "text-purple-400" : ""}`} />
                <span>{item.label}</span>
              </div>
              {item.pro && (
                <span className="rounded bg-gradient-to-r from-purple-600 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  PRO
                </span>
              )}
              {activeTab === item.id && !item.pro && (
                <ChevronRight className="h-4 w-4 text-purple-400" />
              )}
            </button>
          ))}

          <div className="my-4 border-t border-border"></div>

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
          
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Upgrade to Pro</span>
          </button>
          
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </button>
        </nav>

        {/* Extension Download Card */}
        <div className="m-3 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-amber-900/20 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Download className="h-4 w-4 text-purple-400" />
            Chrome Extension
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Type replies directly into chat platforms
          </p>
          <Button size="sm" className="mt-2 w-full bg-gradient-to-r from-purple-600 to-amber-500 text-xs hover:from-purple-700 hover:to-amber-600">
            Download Extension
          </Button>
        </div>

        {/* Sign Out */}
        <div className="border-t border-border p-3">
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === "chat" && "Get instant reply suggestions for any message"}
                {activeTab === "reactivation" && "Re-engage inactive subscribers"}
                {activeTab === "opener" && "Create engaging conversation starters"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600/20 to-amber-500/20 px-4 py-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-foreground">{generationsLeft} generations left</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Panel */}
            <div className="space-y-4">
              {activeTab === "chat" && (
                <>
                  {/* Platform Select */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Platform type</label>
                    <div className="relative">
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select platform...</option>
                        {platformOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Situation Select */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Situation type</label>
                    <div className="relative">
                      <select
                        value={situation}
                        onChange={(e) => setSituation(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select situation...</option>
                        {situationOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Tone Select */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Reply tone</label>
                    <div className="relative">
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select tone...</option>
                        {toneOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Secondary Tone */}
                    <div className="mt-3">
                      <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        Mix with a second tone
                        <span className="rounded bg-gradient-to-r from-purple-600 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">PRO</span>
                      </label>
                      <div className="relative">
                        <select
                          value={secondaryTone}
                          onChange={(e) => setSecondaryTone(e.target.value)}
                          className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          {secondaryToneOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      What did the subscriber say?
                    </label>
                    <Textarea
                      value={subscriberMessage}
                      onChange={(e) => setSubscriberMessage(e.target.value)}
                      placeholder="Paste the subscriber's message here..."
                      className="min-h-24 resize-none focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  {/* Chat History */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Last few messages in the chat
                      <span className="ml-2 text-xs text-muted-foreground">(optional but recommended)</span>
                    </label>
                    <Textarea
                      value={chatHistory}
                      onChange={(e) => setChatHistory(e.target.value)}
                      placeholder="Paste 2 to 3 recent messages so the AI understands the conversation context"
                      className="min-h-20 resize-none focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  {/* Custom Instructions */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <button
                      onClick={() => setShowPromptPanel(!showPromptPanel)}
                      className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Settings2 className="h-4 w-4" />
                      {showPromptPanel ? "Hide custom instructions" : "Add custom instructions"}
                    </button>
                    {showPromptPanel && (
                      <div className="mt-3">
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="e.g., Be more flirty, mention you love dogs, ask about his weekend plans..."
                          className="min-h-16 resize-none text-sm focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "reactivation" && (
                <>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Platform type</label>
                    <div className="relative">
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select platform...</option>
                        {platformOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">How long have they been inactive?</label>
                    <div className="relative">
                      <select
                        value={inactiveTime}
                        onChange={(e) => setInactiveTime(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select time...</option>
                        {inactiveOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">What was the last thing said?</label>
                    <Textarea
                      value={lastMessage}
                      onChange={(e) => setLastMessage(e.target.value)}
                      placeholder="Paste the last message exchanged..."
                      className="min-h-20 resize-none focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Any details about this user?
                      <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <Textarea
                      value={userDetails}
                      onChange={(e) => setUserDetails(e.target.value)}
                      placeholder="e.g., He likes hiking, mentioned he's from Texas..."
                      className="min-h-16 resize-none focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {activeTab === "opener" && (
                <>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Platform type</label>
                    <div className="relative">
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select platform...</option>
                        {platformOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Opener tone</label>
                    <div className="relative">
                      <select
                        value={openerTone}
                        onChange={(e) => setOpenerTone(e.target.value)}
                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select tone...</option>
                        {toneOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      What do you know about this user?
                      <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <Textarea
                      value={openerUserInfo}
                      onChange={(e) => setOpenerUserInfo(e.target.value)}
                      placeholder="e.g., New subscriber, profile says he likes sports..."
                      className="min-h-16 resize-none focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Opener angle
                      <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <Textarea
                      value={openerAngle}
                      onChange={(e) => setOpenerAngle(e.target.value)}
                      placeholder="e.g., Thank them for subscribing, ask a question, tease upcoming content..."
                      className="min-h-16 resize-none focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate}
                disabled={isLoading || (activeTab === "chat" && !subscriberMessage.trim())}
                className="w-full bg-gradient-to-r from-purple-600 to-amber-500 py-6 text-base font-semibold hover:from-purple-700 hover:to-amber-600"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-5 w-5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Replies
                  </>
                )}
              </Button>
            </div>

            {/* Results Panel */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Generated Replies
                </h3>
                {replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                )}
              </div>

              {replies.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your generated replies will appear here
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner className="h-8 w-8 text-purple-500" />
                  <p className="mt-3 text-sm text-muted-foreground">Crafting perfect replies...</p>
                </div>
              )}

              <div className="space-y-3">
                {replies.map((reply, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${toneColors[reply.tone] || "bg-gray-500"}`}></span>
                      <span className="text-xs font-medium text-muted-foreground">{reply.tone}</span>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-foreground">{reply.text}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(index)}
                        className="gap-1.5 text-xs"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        <Image className="h-3.5 w-3.5" />
                        GIF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
