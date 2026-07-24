import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { generateReflectionFollowUp } from "@/lib/practice-lab/roleplay";

const reflectionSchema = z.object({
  reflections: z.array(
    z.object({
      id: z.string(),
      response: z.string().min(1).max(2000),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = reflectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reflection data" }, { status: 400 });
  }

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: { reflections: true },
  });

  if (!attempt || attempt.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.status !== "COMPLETED") {
    return NextResponse.json({ error: "Attempt must be completed first" }, { status: 400 });
  }

  for (const item of parsed.data.reflections) {
    const reflection = attempt.reflections.find((r) => r.id === item.id);
    if (!reflection) continue;

    const followUp = await generateReflectionFollowUp(reflection.question, item.response);

    await prisma.practiceReflection.update({
      where: { id: item.id },
      data: {
        employeeResponse: item.response,
        aiFollowUp: followUp,
      },
    });
  }

  await prisma.practiceAttempt.update({
    where: { id },
    data: { reflectionCompletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
