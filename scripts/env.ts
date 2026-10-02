import { config } from "dotenv";
import { existsSync } from "node:fs";

/** Loads .env.local then .env for scripts (Next does this automatically for the app). */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) config({ path: file, override: false, quiet: true });
  }
}

export function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Add it to .env.local (see .env.example).`);
    process.exit(1);
  }
  return v;
}
