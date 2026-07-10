/**
 * Removes seeded demo accounts from the database.
 * Safe for production cleanup before launch.
 *
 * Usage:
 *   npx tsx scripts/remove-demo-accounts.ts --dry-run
 *   npx tsx scripts/remove-demo-accounts.ts --confirm
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env" });

const DEMO_EMAIL_PATTERNS = [
  "admin@pawpath.local",
  "owner.demo@pawpath.local",
  "@pawpath.demo",
];

const db = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const confirm = process.argv.includes("--confirm");

  if (!dryRun && !confirm) {
    console.error("\nUsage:");
    console.error("  npx tsx scripts/remove-demo-accounts.ts --dry-run");
    console.error("  npx tsx scripts/remove-demo-accounts.ts --confirm\n");
    process.exit(1);
  }

  const users = await db.user.findMany({
    where: {
      OR: DEMO_EMAIL_PATTERNS.map((pattern) =>
        pattern.startsWith("@")
          ? { email: { endsWith: pattern } }
          : { email: pattern }
      ),
    },
    select: { id: true, email: true, role: true },
  });

  if (users.length === 0) {
    console.log("\nNo demo accounts found.\n");
    return;
  }

  console.log(`\nFound ${users.length} demo account(s):\n`);
  for (const user of users) {
    console.log(`  - ${user.email} (${user.role})`);
  }

  if (dryRun) {
    console.log("\nDry run — no accounts deleted.\n");
    return;
  }

  await db.user.deleteMany({
    where: { id: { in: users.map((u) => u.id) } },
  });

  console.log(`\nDeleted ${users.length} demo account(s).\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
