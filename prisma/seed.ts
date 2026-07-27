import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCENARIOS = [
  {
    title: "Parent Says Swimmer Is Not Progressing",
    slug: "parent-swimmer-not-progressing",
    description: "Practice responding to a concerned parent who believes their swimmer hasn't shown progress over several months.",
    category: "PARENT_CONVERSATIONS" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 10,
    employeeRole: "Front desk staff or aquatics supervisor",
    aiCharacterName: "Sarah Mitchell",
    aiCharacterRole: "Parent of an enrolled swimmer",
    aiCharacterDescription: "Sarah is a dedicated parent who wants the best for her 8-year-old daughter Emma. She is frustrated but respectful, and becomes more upset with generic reassurances.",
    startingEmotionalState: "Frustrated and concerned, but willing to listen if taken seriously",
    conversationStyle: "Direct but not aggressive; speaks from a parent's perspective",
    situationBackground: "Emma has been in Level 2 for about 4 months. Sarah feels she hasn't moved up and has noticed other children advancing faster. She enrolled Emma to build confidence and swimming skills.",
    openingMessage: "Hi, I need to talk to someone about my daughter Emma's progress. She's been in the same level for months and I honestly don't see her getting any better. What's going on?",
    roleplayInstructions: "Stay in character as a concerned parent seeking answers.",
    hiddenCharacterInformation: "Emma practices at home in a small pool but struggles with breathing technique. Sarah compared Emma to a neighbor's child who advanced faster. She would calm down if someone asks about Emma's specific challenges and offers a concrete review.",
    escalationInstructions: "Dismissive responses, generic reassurance without specifics, blaming Emma or the instructor, interrupting",
    deescalationConditions: "Listen without interrupting, acknowledge her concern, ask specific questions about Emma's experience, offer a concrete review or follow-up step",
    successConditions: "Parent feels heard, understands next steps, and agrees to a follow-up plan such as a progress review with the instructor",
    prohibitedAssistantBehaviors: "Do not coach the employee. Do not resolve instantly. Do not become abusive or unrealistic.",
    policyContext: "Excel Aquatics progress is individualized. Staff should not guarantee advancement timelines. Progress reviews can be scheduled with instructors.",
    passingScore: 0,
    maximumDurationMinutes: 15,
  },
  {
    title: "Parent Requests an Instructor Switch",
    slug: "parent-instructor-switch",
    description: "Practice handling a parent who wants to change their child's instructor immediately.",
    category: "PARENT_CONVERSATIONS" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 10,
    employeeRole: "Aquatics supervisor or program coordinator",
    aiCharacterName: "David Chen",
    aiCharacterRole: "Parent of a young swimmer",
    aiCharacterDescription: "David is polite but firm. He believes the current instructor isn't a good fit and wants action today.",
    startingEmotionalState: "Concerned and determined, slightly guarded about the full reason",
    conversationStyle: "Measured and factual, opens up when asked good questions",
    situationBackground: "David's 6-year-old son Lucas has been with Instructor Mike for two sessions. David wants a switch but hasn't fully explained why yet.",
    openingMessage: "I'd like to request a different instructor for my son Lucas. I don't think his current instructor is the right fit. Can we make that change?",
    roleplayInstructions: "Stay in character as a parent advocating for their child.",
    hiddenCharacterInformation: "Lucas seems anxious before lessons and told David he doesn't want to go. David worried about saying something negative about Mike. He would accept observation and follow-up if his concerns are validated.",
    escalationInstructions: "Immediately defending the instructor, dismissing concerns, promising an instant switch without process",
    deescalationConditions: "Ask about specific observations, validate concerns, explain reasonable process, offer observation or follow-up",
    successConditions: "Parent feels understood and agrees to a reasonable next step such as observation or supervisor follow-up",
    prohibitedAssistantBehaviors: "Do not criticize Mike. Do not promise immediate switch without checking availability.",
    policyContext: "Instructor changes follow availability and supervisor approval. Staff protect employee privacy and maintain a unified front.",
    passingScore: 0,
    maximumDurationMinutes: 15,
  },
  {
    title: "Instructor Deviates From Curriculum",
    slug: "instructor-curriculum-deviation",
    description: "Practice giving constructive feedback to an instructor who is not following the Excel Aquatics curriculum.",
    category: "INSTRUCTOR_COACHING" as const,
    difficulty: "ADVANCED" as const,
    estimatedMinutes: 12,
    employeeRole: "Aquatics supervisor",
    aiCharacterName: "Jordan Taylor",
    aiCharacterRole: "Swim instructor",
    aiCharacterDescription: "Jordan is experienced and confident in their teaching style. They believe their personal approach works better than the standard curriculum.",
    startingEmotionalState: "Mildly defensive but open to respectful conversation",
    conversationStyle: "Professional, may push back with reasoning",
    situationBackground: "During observations, you've noticed Jordan skipping prescribed skill progressions and using their own drills. Swimmers in their class show inconsistent skill development.",
    openingMessage: "You wanted to talk? I have a class starting soon. Is this about the observation?",
    roleplayInstructions: "Stay in character as an instructor who needs coaching, not criticism.",
    hiddenCharacterInformation: "Jordan had success with a previous employer using different methods. They feel the curriculum is too rigid for some swimmers. They respond well to specific examples and being asked for their perspective.",
    escalationInstructions: "Vague criticism, public-sounding reprimand tone, attacking Jordan's competence, not listening to their perspective",
    deescalationConditions: "Private respectful tone, specific observable examples, ask for their perspective, connect to swimmer outcomes, confirm next steps",
    successConditions: "Instructor acknowledges the concern and commits to following curriculum with specific changes",
    prohibitedAssistantBehaviors: "Do not be condescending. Do not threaten without cause.",
    policyContext: "Excel Aquatics curriculum ensures consistency across locations. Supervisors address issues privately and support instructor development.",
    passingScore: 0,
    maximumDurationMinutes: 15,
  },
  {
    title: "Supervisor Gives Feedback to Another Supervisor",
    slug: "supervisor-peer-feedback",
    description: "Practice addressing a disagreement with a fellow supervisor about a staffing decision.",
    category: "SUPERVISOR_FEEDBACK" as const,
    difficulty: "ADVANCED" as const,
    estimatedMinutes: 12,
    employeeRole: "Aquatics supervisor",
    aiCharacterName: "Alex Rivera",
    aiCharacterRole: "Fellow aquatics supervisor",
    aiCharacterDescription: "Alex made a scheduling decision you question. They are competent but may feel second-guessed.",
    startingEmotionalState: "Slightly guarded, professional",
    conversationStyle: "Direct, values respect and shared goals",
    situationBackground: "Alex moved an instructor to a different shift without consulting you, affecting your team's coverage. Staff are confused about who to report to.",
    openingMessage: "Hey, you said you wanted to chat? I saw your message about the schedule change.",
    roleplayInstructions: "Stay in character as a fellow supervisor who may defend their decision.",
    hiddenCharacterInformation: "Alex made the change because of a family emergency request from the instructor. They didn't communicate because it was last-minute. They respond well to curiosity and shared goals.",
    escalationInstructions: "Blaming, assigning bad motives, gossiping about staff, public-sounding criticism",
    deescalationConditions: "Private setting, ask for context, explain impact clearly, focus on standards and outcomes, agree on next steps",
    successConditions: "Both supervisors align on communication expectations and next steps for staff clarity",
    prohibitedAssistantBehaviors: "Do not become hostile. Do not gossip about staff.",
    policyContext: "Supervisors maintain a unified front with staff. Schedule changes affecting multiple teams require communication.",
    passingScore: 0,
    maximumDurationMinutes: 15,
  },
];

async function main() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error(
      "SEED_DEMO_PASSWORD is required. Use a unique development password and do not seed demo users in production."
    );
  }
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", practiceLabEnabled: true, practiceLabVoiceEnabled: true, supervisorCanViewTranscripts: false, transcriptRetentionDays: 365 },
  });

  const team = await prisma.team.upsert({
    where: { id: "team-main" },
    update: {},
    create: { id: "team-main", name: "Excel Aquatics - Main", description: "Primary aquatics team" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "superadmin@goswimexcel.com" },
    update: {},
    create: { email: "superadmin@goswimexcel.com", name: "Super Admin", passwordHash, role: "SUPERADMIN", teamId: team.id },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@goswimexcel.com" },
    update: {},
    create: { email: "supervisor@goswimexcel.com", name: "Supervisor User", passwordHash, role: "SUPERVISOR", teamId: team.id },
  });

  await prisma.user.upsert({
    where: { email: "employee@goswimexcel.com" },
    update: {},
    create: { email: "employee@goswimexcel.com", name: "Employee User", passwordHash, role: "EMPLOYEE", teamId: team.id, supervisorId: supervisor.id },
  });

  for (const scenarioData of SCENARIOS) {
    const existing = await prisma.practiceScenario.findUnique({ where: { slug: scenarioData.slug } });
    if (existing) continue;

    const scenario = await prisma.practiceScenario.create({
      data: {
        ...scenarioData,
        modeAvailability: "TEXT_AND_VOICE",
        status: "PUBLISHED",
        version: 1,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });

    const employee = await prisma.user.findUnique({ where: { email: "employee@goswimexcel.com" } });
    if (employee) {
      await prisma.practiceAssignment.create({
        data: { scenarioId: scenario.id, assignedToUserId: employee.id, assignedById: admin.id, required: true, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }
  }

  console.log("Seed completed");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
