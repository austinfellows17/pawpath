# Prisma Migrate

This project uses Prisma migrations for production schema history.

## Commands

```bash
# Create a new migration after schema changes (local dev)
npm run db:migrate:dev

# Apply pending migrations (production / staging)
npm run db:migrate:deploy

# Quick schema sync without migration files (local only)
npm run db:push
```

## Baseline

The initial migration at `20250709000000_baseline` captures the schema including:

- User suspension fields (`isSuspended`, `suspendedAt`, `suspensionReason`)
- Conversation read tracking (`ownerLastReadAt`, `walkerLastReadAt`)
- Walker service radius (`serviceRadiusMiles`)

If your database was previously managed with `db push`, mark the baseline as applied without re-running SQL:

```bash
npx prisma migrate resolve --applied 20250709000000_baseline
```

Then use `db:migrate:deploy` for future changes.
