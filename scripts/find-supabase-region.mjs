import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const passMatch = env.match(/postgres\.nkyzrvvexblnftfghyil:([^@]+)@/);
const password = passMatch?.[1] ?? process.env.SUPABASE_DB_PASSWORD;
const ref = "nkyzrvvexblnftfghyil";

const regions = [
  "us-west-1",
  "us-west-2",
  "us-east-1",
  "us-east-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "ap-south-1",
  "sa-east-1",
];

for (const region of regions) {
  const direct = `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  process.env.DIRECT_URL = direct;
  process.env.DATABASE_URL = direct;

  try {
    execSync("npx prisma db execute --stdin <<< 'SELECT 1'", {
      stdio: "pipe",
      env: process.env,
      shell: "/bin/bash",
    });
    console.log(`SUCCESS: ${region}`);
    process.exit(0);
  } catch (error) {
    const message = error.stderr?.toString() ?? error.message;
    if (message.includes("not found")) {
      console.log(`skip: ${region} (tenant not found)`);
    } else {
      console.log(`fail: ${region} -> ${message.split("\n")[0]}`);
    }
  }
}

console.error("No matching region found");
process.exit(1);
