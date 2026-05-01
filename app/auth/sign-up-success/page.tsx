import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500">
            <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          
          <h1 className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-2xl font-bold text-transparent mb-3">
            Check Your Email
          </h1>
          
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent you a confirmation link. Please check your email and click the link to activate your account.
          </p>
          
          <div className="rounded-md bg-secondary/50 p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive an email? Check your spam folder or try signing up again.
            </p>
          </div>
          
          <Link href="/auth/login">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
