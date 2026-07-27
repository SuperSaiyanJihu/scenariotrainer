import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Compass className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900">
              We couldn&apos;t find that page
            </h1>
            <p className="text-sm text-zinc-500">
              It may have been removed, renamed, or the link might be out of date.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
