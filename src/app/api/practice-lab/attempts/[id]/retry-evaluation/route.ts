import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { practiceLabConfig } from "@/lib/practice-lab/config";
import { performAttemptEvaluation } from "@/lib/practice-lab/evaluate-attempt";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const attempt = await prisma.practiceAttempt.findUnique({ where: { id } });
  if (!attempt || attempt.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.status !== "FAILED") {
    return NextResponse.json({ error: "Evaluation retry not available" }, { status: 400 });
  }

  if (attempt.evaluationRetryCount >= practiceLabConfig.evaluationRetryLimit) {
    return NextResponse.json({ error: "Evaluation retry limit reached" }, { status: 429 });
  }

  const evalResult = await performAttemptEvaluation(id, authResult.user.id);

  if (!evalResult.success) {
    return NextResponse.json(
      { error: evalResult.error, canRetry: true },
      { status: evalResult.status }
    );
  }

  return NextResponse.json({ success: true });
}
