# Performance Pulse — Practice Lab

Excel Aquatics employee training platform for realistic, AI-powered conversation practice.

## What it does

- Text and voice role-play with configurable AI characters
- Three-question self-reflection after every practice
- Conversational AI coaching with exactly three practical suggestions
- No grades, scores, rankings, or pass/fail results
- Scenario assignment and completion tracking
- Superadmin scenario creation, editing, duplication, publishing, and removal
- Installable Progressive Web App

## Local setup

Requirements: Node.js 20+, PostgreSQL, and an OpenAI API key.

```bash
docker compose up -d
pnpm install
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY, and SEED_DEMO_PASSWORD
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

## Seeded development accounts

The seed script requires `SEED_DEMO_PASSWORD`; no password is stored in source.

| Role | Email |
|---|---|
| Superadmin | `superadmin@goswimexcel.com` |
| Supervisor | `supervisor@goswimexcel.com` |
| Employee | `employee@goswimexcel.com` |

Do not run the demo seed in production.

## OpenAI configuration

All OpenAI calls are server-side. Set these deployment secrets:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Server-side OpenAI API credential |
| `OPENAI_ROLEPLAY_MODEL` | Text character model; defaults to `gpt-5.6` |
| `OPENAI_COACHING_MODEL` | Post-reflection coaching model; defaults to `gpt-5.6` |
| `OPENAI_REALTIME_MODEL` | Voice model; defaults to `gpt-realtime-2.1` |

Voice sessions use short-lived client secrets. The permanent API key is never sent to
the browser.

## Deployment

`railway.json` builds the Next.js app and applies Prisma migrations at startup.
Configure PostgreSQL and every required environment variable in Railway before
deploying. Generate a unique `AUTH_SECRET`; never use the example value.

## Verification

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

See [Developer Guide](docs/DEVELOPER.md) and
[Superadmin Guide](docs/ADMINISTRATOR.md).
