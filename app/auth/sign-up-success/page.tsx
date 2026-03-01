import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-5">
            <MailCheck size={28} className="text-accent" />
          </div>
          <h1 className="text-foreground font-bold text-2xl tracking-tight mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {"We've sent a confirmation link to your email address. Click it to activate your account and start using Kickup."}
          </p>
          <Link
            href="/auth/login"
            className="h-11 rounded-xl bg-card border border-border text-foreground font-semibold text-sm flex items-center justify-center px-8 hover:bg-muted transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
