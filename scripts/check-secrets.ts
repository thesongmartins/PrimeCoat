/**
 * Greps the working tree (excluding ignored files) for strings that look like
 * credentials. Run before committing: pnpm check:secrets
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execSync("git ls-files --cached --others --exclude-standard", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !f.startsWith("public/") && !f.endsWith(".svg") && !f.endsWith(".png") && f !== "pnpm-lock.yaml");

const patterns: [string, RegExp][] = [
  ["Supabase JWT", /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}/],
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{10,}/],
  ["Mailgun key", /\bkey-[0-9a-f]{32}\b/],
  ["Mailgun new-style key", /\b[0-9a-f]{32}-[0-9a-f]{8}-[0-9a-f]{8}\b/],
  ["Google client secret", /GOCSPX-[A-Za-z0-9_-]{10,}/],
  ["Postgres URL with password", /postgres(ql)?:\/\/[^:\s]+:[^@\s]+@/],
  ["Private key block", /-----BEGIN (RSA |EC )?PRIVATE KEY-----/],
];

let hits = 0;
for (const file of files) {
  let content: string;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const [label, re] of patterns) {
    if (re.test(content)) {
      hits++;
      console.error(`SECRET? ${label} in ${file}`);
    }
  }
}

if (hits) {
  console.error(`\n${hits} potential secret(s) found. Remove them before committing.`);
  process.exit(1);
}
console.log(`No secret-shaped strings in ${files.length} tracked files.`);
