import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
        <Sparkles className="h-[18px] w-[18px]" />
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
        <Compass className="h-6 w-6" />
      </span>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">
          We couldn&apos;t find that page
        </h1>
        <p className="max-w-sm text-sm text-zinc-500">
          The page may have moved or the link may be out of date. Head back to your dashboard to keep going.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
