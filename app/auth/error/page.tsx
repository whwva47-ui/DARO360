import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-10 w-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Authentication Error
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Something went wrong during authentication. This could be due to an expired link or an invalid session.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link href="/auth/login">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600">
                Try Again
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
