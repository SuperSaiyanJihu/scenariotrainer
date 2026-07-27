import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { enforceTranscriptRetention } from "@/lib/practice-lab/retention";

export async function POST() {
  const authResult = await requireRole(["ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const result = await enforceTranscriptRetention();
  return NextResponse.json(result);
}
