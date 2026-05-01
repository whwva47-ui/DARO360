import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Rocket,
  Check,
  Shield,
  ChevronRight
} from "lucide-react"

export default function Home() {
  const features = [
    "Unlimited AI replies, openers and reactivations daily",
    "PPV Upsell Builder to turn fans into buyers",
    "Conversation History to track and build on past chats",
    "Higher quality AI model reserved for Pro members only",
    "Access to the Chrome extension for direct typing",
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-amber-900/10"></div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center">
          {/* Logo */}
          <div className="mb-8 inline-flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500">
              <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h1 className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-3xl font-bold text-transparent">
              Chatter&apos;s Inner Circle
            </h1>
          </div>

          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            The AI-powered assistant for professional chatters. Generate engaging replies, 
            reactivation messages, and openers in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="mx-auto mb-8 flex max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/login" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600">
                Sign In
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full gap-2">
                Create Account
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            By signing up you agree to use AI-generated replies responsibly. 
            Always proofread before sending and ensure replies follow your platform guidelines.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Everything you need to chat faster
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-purple-500/10 p-3">
                <MessageSquare className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Chat Agent</h3>
              <p className="text-sm text-muted-foreground">
                Get instant reply suggestions for any subscriber situation. Copy, paste, convert.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-amber-500/10 p-3">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Reactivation Messages</h3>
              <p className="text-sm text-muted-foreground">
                Wake up cold users with messages designed to pull them back into the conversation.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-green-500/10 p-3">
                <Rocket className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Opener Generator</h3>
              <p className="text-sm text-muted-foreground">
                Generate compelling first messages that start conversations on the right note.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Comparison */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            See the difference
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <span className="mb-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Free reply
              </span>
              <p className="text-sm text-muted-foreground">
                Hey, glad you reached out! What have you been up to today?
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500/20 to-amber-500/20 px-3 py-1 text-xs font-medium text-purple-400">
                <Sparkles className="h-3 w-3" />
                Pro reply
              </span>
              <p className="text-sm text-foreground">
                Something about the way you said that made me stop scrolling. I feel like there is a whole story behind those words. What is really going on with you today?
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Same message. Completely different result.
          </p>
        </div>
      </div>

      {/* Pro Features */}
      <div className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-amber-900/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-amber-400" />
              <h2 className="text-2xl font-bold text-foreground">Pro Features</h2>
            </div>
            
            <ul className="mb-8 space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 sm:w-auto">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">Use AI Responsibly</h2>
            </div>
            
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">1.</span>
                <span><strong className="text-foreground">Always proofread before sending.</strong> AI suggestions are a starting point, not a final message.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">2.</span>
                <span><strong className="text-foreground">Follow your platform rules.</strong> Ensure every reply complies with your platform&apos;s terms of service.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">3.</span>
                <span><strong className="text-foreground">Use your judgment.</strong> If a suggestion does not feel right, do not use it.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">4.</span>
                <span><strong className="text-foreground">Never send harmful content.</strong> Do not use AI to violate rules or harass users.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">5.</span>
                <span><strong className="text-foreground">You are responsible.</strong> Chatter&apos;s Inner Circle provides suggestions only. You are fully responsible for every message you send.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Chatter&apos;s Inner Circle is a professional tool designed to help chatters work more efficiently.
        </p>
      </footer>
    </main>
  )
}
