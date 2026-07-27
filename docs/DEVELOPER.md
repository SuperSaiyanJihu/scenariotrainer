# Practice Lab — Developer Guide

## Architecture

- Next.js 15 App Router, React 19, and Tailwind CSS
- PostgreSQL with Prisma
- NextAuth JWT sessions with Employee, Supervisor, Administrator, and Superadmin roles
- OpenAI Responses API for text role-play and post-reflection coaching
- OpenAI Realtime API over WebRTC for voice practice

## Conversation lifecycle

1. The server creates an attempt with a snapshot of the selected scenario.
2. The employee talks with the AI character by text or voice.
3. Character instructions remain server-side and employee messages are treated as
   untrusted conversation content.
4. Ending the conversation creates three fixed reflection prompts:
   - What went well?
   - What did not go well?
   - What would you change or do better next time?
5. After all three answers are submitted, the server sends the transcript and
   reflections to the OpenAI Responses API.
6. Structured output is validated with Zod and requires exactly three coaching
   suggestions, each with an implementation step.
7. The conversational coaching response is saved and displayed to the employee.

No score, grade, ranking, rubric, or pass/fail result is generated or displayed.
Legacy nullable score columns remain in the initial schema for migration compatibility
but are always written as `null`.

## OpenAI integration

The SDK reads `OPENAI_API_KEY` only on the server. Model defaults are:

```text
OPENAI_ROLEPLAY_MODEL=gpt-5.6
OPENAI_COACHING_MODEL=gpt-5.6
OPENAI_REALTIME_MODEL=gpt-realtime-2.1
```

Text calls use the Responses API with application instructions separated from user
input. Coaching uses strict JSON Schema output. Voice uses server-minted ephemeral
client secrets and includes a hashed safety identifier; the permanent API key never
reaches the browser.

## Authorization

- Employees access their own attempts.
- Supervisors access completion activity for direct reports.
- Administrators configure the product and manage scenarios.
- Superadmins inherit administrator access and can remove scenarios from the library.

Scenario removal is an audited archive operation so historical attempts remain intact.

## Security and operations

- Configure API, auth, and database secrets in the deployment platform.
- Demo seeding requires `SEED_DEMO_PASSWORD` and should not run in production.
- API/auth responses are excluded from service-worker caching.
- Transcript retention and supervisor transcript access are configurable.
- The included rate limiter is process-local and assumes a single application instance;
  replace it with a shared store before scaling horizontally.
- CI runs tests, lint, and a production build on pushes and pull requests.
