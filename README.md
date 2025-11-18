# ContentOS

ContentOS (code name `OrbitCapture_Venus`) is a unified content operations platform for marketing teams and agencies. It centralizes planning, AI-assisted creation, multi-step approvals, omnichannel publishing, and performance analytics so teams can move from idea to live campaign inside a single workspace.

The repository houses both the Next.js 16 web app and the local infrastructure that mirrors production (Dockerized PostgreSQL, Prisma schema, and supporting documentation).

## Feature Highlights

- **Workspaces & Access Control** – Clerk-powered authentication, workspace creation, role-based membership, and branded white-label themes.
- **Planner & Tasks** – Calendar views built with FullCalendar and drag-and-drop scheduling using `@dnd-kit` to manage briefs, tasks, and due dates.
- **AI Studio** – Editor.js-based canvas with GPT-4o / Claude 3.5 prompts (via OpenRouter) for ideation, rewriting, and channel-specific adaptations (`web/src/actions/ai.ts`).
- **Approvals & Compliance** – Two-step approval queues, inline comments, version history, and GDPR/CCPA privacy tooling defined in the Prisma schema (`web/prisma/schema.prisma`).
- **Distribution & Analytics** – Channel adapters and analytics snapshots (Google Search Console, GA4, Microsoft Webmaster) with optimization insights (`web/src/actions/analytics.ts`).
- **Collaboration & Notifications** – Real-time presence scaffolding via Liveblocks libraries plus email/Slack notifications sent through Resend (`web/src/lib/notifications.ts`).

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS + shadcn/ui, FullCalendar, Editor.js, Zustand, React Hook Form, Zod.
- **Backend within Next.js:** Server Actions, Prisma ORM, serverless API routes, OpenRouter for AI calls, Resend for transactional email.
- **Auth & Collaboration:** Clerk for auth/session management, Liveblocks.io for multi-user editing.
- **Data Layer:** PostgreSQL 16 (Docker), Prisma schema with rich enums for workflow states, row-level security planned.
- **Dev Tooling:** ESLint 9, TypeScript 5, dotenv-cli, Docker Compose, GitHub Actions (planned).

## Repository Layout

| Path | Purpose |
| --- | --- |
| `web/` | Next.js app (app router, components, Prisma schema, configs, scripts). |
| `documentation/` | Product requirements, architecture, flowcharts, tech stack references. |
| `docker/` | Local PostgreSQL definition, seed scripts, persisted volume. |
| `dashboard reference/` | Design references and mockups for the dashboard experience. |

## Prerequisites

- Node.js 20+ (Next.js 16 requirement)
- npm 10+ (or pnpm/bun if you update scripts)
- Docker Desktop (for local PostgreSQL)
- OpenRouter account + API key
- Clerk application (publishable + secret keys)
- Resend account (optional, for notification testing)

## Quick Start

1. **Clone & install**
   ```bash
   git clone <repo-url>
   cd OrbitCapture_Venus/web
   npm install
   ```
2. **Provision environment**
   ```bash
   cp .env.example .env.local  # create this file if it does not exist
   ```
   Populate the variables (see next section).
3. **Start PostgreSQL**
   ```bash
   docker compose up -d postgres  # run from repo root
   ```
4. **Generate Prisma client & sync schema**
   ```bash
   npm run db:generate
   npm run db:push
   ```
5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Environment Variables

Create `web/.env.local` with the following keys:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for the frontend. |
| `CLERK_SECRET_KEY` | Server-side key for Clerk. |
| `CLERK_SIGNING_SECRET` | (Optional) Webhook signing secret for Clerk events. |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/contentos`. |
| `OPENROUTER_API_KEY` | Required for GPT-4o / Claude calls inside `web/src/actions/ai.ts` and `web/src/actions/analytics.ts`. |
| `NEXT_PUBLIC_APP_URL` | Public base URL used when calling OpenRouter (`http://localhost:3000` in dev). |
| `RESEND_API_KEY` | Enables outbound notification emails via Resend. |
| `NOTIFICATION_FROM_EMAIL` | Friendly “from” address for workflow notifications. |

> Tip: keep `.env.local` out of version control; it is already ignored by default.

## Useful npm Scripts (`web/package.json`)

```bash
npm run dev        # Start Next.js locally
npm run build      # Production build
npm run start      # Serve built app
npm run lint       # ESLint (fails on warnings)
npm run typecheck  # TypeScript project check
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema changes to the connected DB
```

## Database & Prisma

The Prisma schema (`web/prisma/schema.prisma`) defines every workflow entity (workspaces, personas, content items, approvals, analytics snapshots, compliance events, etc.). Use `db:push` during early development and switch to migrations (`prisma migrate`) before production. Database volumes live under `docker/postgres/data/db` so you can wipe local data by clearing that folder and restarting Docker.

## Documentation & Design References

- Product requirements, architecture diagrams, flowcharts, and security notes live in `documentation/`.
- UI inspiration, component breakdowns, and workflow specs are inside `dashboard reference/`.

Read these before extending a module so new work stays aligned with the original brief.

## Deployment Notes

- **Frontend/API:** Deploy the `web` app to Vercel. Set all environment variables in the Vercel project settings.
- **Database:** Point `DATABASE_URL` to your managed PostgreSQL instance (Supabase, Neon, RDS, etc.) and run Prisma migrations.
- **AI & Email:** Store `OPENROUTER_API_KEY`, `RESEND_API_KEY`, and notification sender address as encrypted secrets.
- **Auth:** Configure the production domain in Clerk and update `NEXT_PUBLIC_APP_URL` accordingly.

With these steps, any contributor can spin up ContentOS locally, understand the architecture, and push changes confidently.

