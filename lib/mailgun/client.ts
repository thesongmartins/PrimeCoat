import "server-only";
import { optionalServerEnv, requireServerEnv } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: string[];
  /** Mailgun custom variables, e.g. { order_number: "PC-…" }. */
  variables?: Record<string, string>;
}

export interface MailResult {
  id: string;
  message: string;
}

export class MailgunError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Sends one message through Mailgun's HTTP API using fetch + HTTP Basic auth.
 * Credentials come from server environment variables only. This is the single
 * place in the codebase that talks to Mailgun (AGENTS.md §8).
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const apiKey = requireServerEnv("MAILGUN_API_KEY");
  const domain = requireServerEnv("MAILGUN_DOMAIN");
  const from = requireServerEnv("MAILGUN_FROM_EMAIL");
  const baseUrl = (optionalServerEnv("MAILGUN_API_BASE_URL") ?? "https://api.mailgun.net").replace(/\/$/, "");
  const replyTo = optionalServerEnv("MAILGUN_REPLY_TO");

  const body = new URLSearchParams();
  body.set("from", from);
  body.set("to", message.to);
  body.set("subject", message.subject);
  body.set("text", message.text);
  body.set("html", message.html);
  if (replyTo) body.set("h:Reply-To", replyTo);
  for (const tag of message.tags ?? []) body.append("o:tag", tag);
  for (const [k, v] of Object.entries(message.variables ?? {})) body.set(`v:${k}`, v);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      // Mailgun returns helpful plain-text/JSON reasons (e.g. sandbox recipient not authorised).
      logger.error("mailgun.send_failed", { status: res.status, reason: text.slice(0, 300) });
      throw new MailgunError(`Mailgun responded ${res.status}: ${text.slice(0, 200)}`, res.status);
    }
    const json = JSON.parse(text) as MailResult;
    logger.info("mailgun.sent", { id: json.id, to: message.to.replace(/(.{2}).+(@.+)/, "$1***$2") });
    return json;
  } finally {
    clearTimeout(timeout);
  }
}
