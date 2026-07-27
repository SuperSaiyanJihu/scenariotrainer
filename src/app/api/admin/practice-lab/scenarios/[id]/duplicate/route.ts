import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(["ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const original = await prisma.practiceScenario.findUnique({
    where: { id },
  });

  if (!original) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const slug = `${original.slug}-copy-${Date.now()}`;

  const duplicate = await prisma.practiceScenario.create({
    data: {
      title: `${original.title} (Copy)`,
      slug,
      description: original.description,
      category: original.category,
      difficulty: original.difficulty,
      estimatedMinutes: original.estimatedMinutes,
      employeeRole: original.employeeRole,
      aiCharacterName: original.aiCharacterName,
      aiCharacterRole: original.aiCharacterRole,
      aiCharacterDescription: original.aiCharacterDescription,
      startingEmotionalState: original.startingEmotionalState,
      conversationStyle: original.conversationStyle,
      situationBackground: original.situationBackground,
      openingMessage: original.openingMessage,
      roleplayInstructions: original.roleplayInstructions,
      hiddenCharacterInformation: original.hiddenCharacterInformation,
      escalationInstructions: original.escalationInstructions,
      deescalationConditions: original.deescalationConditions,
      successConditions: original.successConditions,
      prohibitedAssistantBehaviors: original.prohibitedAssistantBehaviors,
      policyContext: original.policyContext,
      modeAvailability: original.modeAvailability,
      passingScore: 0,
      maximumDurationMinutes: original.maximumDurationMinutes,
      status: "DRAFT",
      createdById: authResult.user.id,
      updatedById: authResult.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "SCENARIO_DUPLICATED",
      entityType: "PracticeScenario",
      entityId: duplicate.id,
      details: { sourceId: id },
    },
  });

  return NextResponse.json({ scenario: duplicate }, { status: 201 });
}
