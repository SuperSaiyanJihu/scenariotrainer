import { Suspense } from "react";
import { MessagesSquare, Mic, Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: MessagesSquare,
    title: "Realistic roleplay",
    description: "Practice the exact conversations you'll have on the pool deck.",
  },
  {
    icon: Mic,
    title: "Text or voice",
    description: "Rehearse by typing or speaking with a live AI character.",
  },
  {
    icon: Sparkles,
    title: "Personal coaching",
    description: "Get specific, judgment-free feedback after every session.",
  },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-zinc-900 px-12 py-14 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ScenarioTrainer</span>
        </div>

        <div className="relative space-y-8">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Practice the conversation before it happens.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/70">
            Rehearse real workplace conversations with an AI character, then get
            coaching feedback you can actually use next time.
          </p>
          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Excel Aquatics</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-zinc-900">
              ScenarioTrainer
            </span>
          </div>
          <Card className="border-none shadow-none sm:border sm:border-zinc-200/80 sm:shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to start practicing and get coaching feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-64" />}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
