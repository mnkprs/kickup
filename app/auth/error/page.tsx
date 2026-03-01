import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
            <AlertTriangle size={28} className="text-destructive" />
          </div>
          <h1 className="text-foreground font-bold text-2xl tracking-tight mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            We ran into a problem with your authentication.
          </p>
          {params?.error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-6 w-full">
              {params.error}
            </p>
          )}
          <Link
            href="/auth/login"
            className="h-11 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center px-8 hover:bg-accent-light transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
