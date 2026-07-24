import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
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

  if (!["IN_PROGRESS", "FAILED"].includes(attempt.status)) {
    return NextResponse.json({ error: "Attempt cannot be ended" }, { status: 400 });
  }

  if (attempt.status === "IN_PROGRESS") {
    await prisma.practiceAttempt.update({
      where: { id },
      data: { endedAt: new Date() },
    });
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
