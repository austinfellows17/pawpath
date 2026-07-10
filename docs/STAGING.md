# Staging environment

Use a separate Supabase project and Vercel preview deployment for staging so production data stays isolated.

## Setup checklist

1. **Supabase** — Create a new project (e.g. `pawpath-staging`). Copy the pooler URLs for `DATABASE_URL` and `DIRECT_URL`.
2. **Vercel** — Connect the repo and create a **Preview** environment, or a dedicated `staging` branch deployment.
3. **Env vars** — Copy `.env.staging.example` to `.env.staging` locally, or add the same keys in Vercel → Settings → Environment Variables (Preview scope).
4. **Schema** — Apply the database schema:
   ```bash
   cp .env.staging .env
   npm run db:push
   npm run db:seed   # optional demo data for QA
   ```
5. **Storage** — Run `npm run storage:setup` and `npm run storage:verify` against the staging Supabase project.
6. **Stripe** — Use Stripe **test mode** keys and test Price IDs. Do not reuse production webhook secrets.
7. **Email / SMS** — Use Resend/Twilio test credentials or disable outbound notifications in staging.

## Recommended staging-only values

| Variable | Staging value |
|----------|---------------|
| `NEXTAUTH_URL` | `https://usepawpath.io` |
| `NEXT_PUBLIC_SHOW_BETA_BANNER` | `true` |
| `REQUIRE_EMAIL_VERIFICATION` | `true` (recommended for beta) |
| `SENTRY_DSN` | Optional separate Sentry project |

## Deploy readiness

Before promoting to production:

```bash
npm run lint
npm run build
npm run deploy:check
npm run storage:verify
npm run test:e2e
```

## Removing demo accounts before launch

```bash
npx tsx scripts/remove-demo-accounts.ts --dry-run
npx tsx scripts/remove-demo-accounts.ts --confirm
```

Run `--confirm` against **production** only when you are ready to delete seeded demo users.

## Prisma schema changes

This repo uses `db:push` for rapid iteration. For production migration history, use:

```bash
npm run db:migrate:dev    # local: create + apply migration
npm run db:migrate:deploy # production: apply pending migrations
```

After the first baseline migration exists, prefer `migrate deploy` over `db push` in production.
