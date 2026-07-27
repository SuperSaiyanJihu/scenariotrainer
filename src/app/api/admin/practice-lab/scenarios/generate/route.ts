import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/practice-lab/rate-limit";
import {
  generateScenarioDraft,
  GENERATED_SCENARIO_MAX_MINUTES,
} from "@/lib/practice-lab/scenario-generator";

const requestSchema = z.object({
  brief: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  const authResult = await requireRole(["ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const rate = checkRateLimit(`scenario-generate:${authResult.user.id}`, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many generation requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Describe the scenario in 10-2000 characters." },
      { status: 400 }
    );
  }

  const result = await generateScenarioDraft(parsed.data.brief, authResult.user.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    scenario: {
      ...result.scenario,
      estimatedMinutes: GENERATED_SCENARIO_MAX_MINUTES,
      maximumDurationMinutes: GENERATED_SCENARIO_MAX_MINUTES,
      modeAvailability: "TEXT_AND_VOICE",
      status: "DRAFT",
    },
  });
}
