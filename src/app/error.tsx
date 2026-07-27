"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-zinc-500">
          We hit an unexpected error loading this page. Trying again usually fixes it — if it keeps
          happening, let your administrator know.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
