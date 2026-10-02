/**
 * Database tasks via the Supabase CLI in --db-url mode (no login needed).
 *   pnpm db:push    apply supabase/migrations/* to the database in SUPABASE_DB_URL
 *   pnpm db:types   regenerate lib/supabase/database.types.ts
 *
 * SUPABASE_DB_URL: Supabase dashboard → Connect → Session pooler URI (port 5432), with the
 * database password filled in. Keep it in .env.local only.
 */
import { spawnSync } from "node:child_process";
import { loadEnv, need } from "./env";

loadEnv();
const dbUrl = need("SUPABASE_DB_URL");
const task = process.argv[2];

function run(args: string[], opts: { stdoutToFile?: string } = {}) {
  const res = spawnSync("pnpm", ["dlx", "supabase@latest", ...args], {
    stdio: opts.stdoutToFile ? ["inherit", "pipe", "inherit"] : "inherit",
    env: process.env,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
  return res.stdout?.toString() ?? "";
}

if (task === "push") {
  run(["db", "push", "--db-url", dbUrl, "--include-all"]);
} else if (task === "types") {
  const out = run(["gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public"], { stdoutToFile: "lib/supabase/database.types.ts" });
  const { writeFileSync } = await import("node:fs");
  writeFileSync("lib/supabase/database.types.ts", out);
  console.log("Wrote lib/supabase/database.types.ts");
} else {
  console.error("Usage: node --import tsx scripts/db.ts <push|types>");
  process.exit(1);
}
