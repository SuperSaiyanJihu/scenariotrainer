import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

const settingsSchema = z.object({
  practiceLabEnabled: z.boolean().optional(),
  practiceLabVoiceEnabled: z.boolean().optional(),
  supervisorCanViewTranscripts: z.boolean().optional(),
  transcriptRetentionDays: z.number().int().min(1).max(3650).optional(),
});

export async function GET() {
  const authResult = await requireRole(["ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const authResult = await requireRole(["ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "SETTINGS_UPDATED",
      entityType: "AppSettings",
      entityId: "default",
      details: parsed.data,
    },
  });

  return NextResponse.json({ settings });
}
