# Enshore Insight

Enshore Insight is a full-stack Next.js application for capturing project-specific customer feedback, triaging urgency and SLA requirements, sending branded HTML email notifications, tracking follow-up actions, and providing role-based PM and CEO dashboards.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component primitives
- PostgreSQL + Prisma
- NextAuth credentials auth with Prisma adapter
- Recharts for dashboard visualisations

## Features

- Public project-specific feedback forms at `/f/[slug]`
- Internal role model for `ADMIN`, `PROJECT_REPRESENTATIVE`, and `VIEWER`
- Project-scoped access control with admin override
- Central feedback store with urgency and SLA calculation
- HTML email template rendering with placeholder replacement and hosted banner support
- PM action tracker with audit log
- PM dashboard for operational insight
- CEO dashboard for portfolio oversight
- Seed data for a fast local start

## Project structure

- `app/`: App Router pages, layouts, and server actions
- `components/`: UI primitives, shell, charts, and forms
- `lib/`: auth, Prisma client, domain logic, email rendering, and dashboard queries
- `prisma/`: schema, SQL migration, and seed script
- `types/`: module augmentation for NextAuth

## Environment

Copy `.env.example` to `.env` and populate:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/enshore_insight?schema=public"
AUTH_SECRET="replace-with-long-random-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="secret"
SMTP_FROM="Enshore Insight <insight@enshore.com>"
APP_BASE_URL="http://localhost:3000"
EMAIL_BANNER_URL="https://images.example.com/enshore-banner.png"
```

## Getting started

This workspace does not currently have Node.js installed, so dependency installation and runtime verification could not be executed here. Once Node 20+ is available:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Seeded users

- `admin@enshore.com` / `Password123!`
- `pm@enshore.com` / `Password123!`
- `ceo@enshore.com` / `Password123!`

## Domain rules

Urgency:

- `score <= 6` and contact requested `YES` => `LEVEL_1`
- `score <= 6` and contact requested `NO` => `LEVEL_2`
- `score >= 7` and contact requested `YES` => `LEVEL_3`
- `score >= 7` and contact requested `NO` => `LEVEL_4`

SLA:

- `LEVEL_1` => 24 hours
- `LEVEL_3` => 72 hours
- `LEVEL_2` and `LEVEL_4` => no direct-contact SLA

## Notes

- Email sending is implemented with Nodemailer and intentionally degrades safely when SMTP variables are missing.
- Route protection is enforced through session checks in layouts/pages, with project-level scoping on PM workflows.
- The SQL migration is included explicitly so the repository is runnable even before Prisma commands are executed locally.
