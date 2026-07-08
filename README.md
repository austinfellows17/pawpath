# PawPath

**Your neighborhood. Your walker. No middleman.**

PawPath is a local connection platform for San Diego County dog owners and walkers. Unlike Rover and similar apps, PawPath does not process payments, take booking fees, or act as a service intermediary. Owners find nearby walkers, message in-app, and take scheduling and payment offline (Zelle, Venmo, etc.).

Walkers pay for listing tiers to increase visibility — not per-transaction fees.

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS 4**
- **PostgreSQL + Prisma** (Supabase)
- **NextAuth.js** — email/password + Google
- **Mapbox** — map view and geocoding
- **Stripe** — walker listing tier subscriptions
- **Supabase Storage** — private verification document uploads
- **Resend** — email notifications

## Getting started

```bash
cp .env.example .env
# Fill in database, auth, and provider keys (see below)

npm install
npm run db:push
npm run db:seed   # optional demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment setup helpers

| Command | Purpose |
|---------|---------|
| `npm run mapbox:setup` | Mapbox token instructions + verification |
| `npm run google:oauth-setup` | Google sign-in redirect URIs |
| `npm run storage:setup` | Create Supabase verification bucket |
| `npm run storage:verify` | Test Supabase upload/download |
| `npm run stripe:webhook-setup` | Create Stripe prices (one-time) |
| `npm run stripe:listen` | Forward Stripe webhooks locally |
| `npm run notifications:setup` | Resend + Twilio instructions |
| `npm run notifications:verify -- you@email.com` | Send test email |
| `npm run deploy:check` | Pre-deploy env checklist |

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all env vars from `.env.example` (use production values)
4. Set `NEXTAUTH_URL` to your production domain
5. Add production URLs in Stripe, Google OAuth, and Resend
6. Run `npm run deploy:check -- --production` locally before going live

**Production webhook:** `https://YOUR_DOMAIN/api/billing/webhook`

**Google redirect:** `https://YOUR_DOMAIN/api/auth/callback/google`

## Demo accounts (after `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pawpath.local` | `admin-change-me` |
| Owner | `owner.demo@pawpath.local` | `demo-walker` |
| Walkers | `*@pawpath.demo` | `demo-walker` |

## Current status

- [x] Landing page, search (list + map), walker profiles
- [x] Auth (email + Google), onboarding, role selection
- [x] In-app messaging with contact reveal
- [x] Reviews + admin moderation + support inquiries
- [x] Walker verification upload (Supabase Storage)
- [x] Stripe listing tiers (Trailhead / Summit / Peak)
- [x] Email notifications (Resend)
- [x] Google sign-in
- [ ] Mapbox token (optional — zip fallbacks work without it)
- [ ] SMS notifications (Twilio — optional)
- [ ] Production deploy + custom domain

## Launch region

North San Diego County — configured in `src/lib/constants.ts`.

## Legal note

PawPath is a directory/connection platform. It does not employ walkers, hold insurance, or process payments for dog walking services.
