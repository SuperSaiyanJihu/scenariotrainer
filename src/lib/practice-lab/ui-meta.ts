import { GraduationCap, MessagesSquare, ClipboardCheck, UsersRound, type LucideIcon } from "lucide-react";
import type { ScenarioCategory, ScenarioDifficulty } from "@/generated/prisma/client";

export const categoryIcon: Record<ScenarioCategory, LucideIcon> = {
  PARENT_CONVERSATIONS: UsersRound,
  INSTRUCTOR_COACHING: GraduationCap,
  SUPERVISOR_FEEDBACK: ClipboardCheck,
  COWORKER_COMMUNICATION: MessagesSquare,
};

export const difficultyMeta: Record<ScenarioDifficulty, { dotClassName: string; label: string }> = {
  BEGINNER: { dotClassName: "bg-emerald-500", label: "Beginner" },
  INTERMEDIATE: { dotClassName: "bg-amber-500", label: "Intermediate" },
  ADVANCED: { dotClassName: "bg-rose-500", label: "Advanced" },
};
