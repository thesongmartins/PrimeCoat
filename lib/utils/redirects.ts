/**
 * Only allow same-origin relative paths for post-auth redirects.
 * Rejects protocol-relative ("//evil.com"), absolute URLs and non-path values.
 */
export function sanitizeNextPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/^\/[a-z]+:/i.test(value)) return fallback;
  return value;
}
