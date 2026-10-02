/**
 * Sends a sample order confirmation through Mailgun to prove credentials and template.
 *   pnpm mailgun:test you@example.com
 * On a sandbox domain the recipient must be an Authorized Recipient.
 */
import { loadEnv, need } from "./env";
import type { Order } from "../types/order";

loadEnv();
need("MAILGUN_API_KEY");
need("MAILGUN_DOMAIN");
need("MAILGUN_FROM_EMAIL");

const to = process.argv[2];
if (!to || !to.includes("@")) {
  console.error("Usage: pnpm mailgun:test <recipient-email>");
  process.exit(1);
}

const sample: Order = {
  id: "00000000-0000-4000-8000-000000000000",
  userId: "00000000-0000-4000-8000-000000000001",
  orderNumber: "PC-20261002-TEST",
  customerName: "Test Customer",
  email: to,
  phone: "0803 123 4567",
  deliveryAddress: "14 Bourdillon Road, Ikoyi",
  city: "Lagos",
  state: "Lagos",
  deliveryInstructions: "Call at the gate; the estate security will direct you.",
  subtotal: 42600,
  deliveryFee: 2500,
  total: 45100,
  status: "pending",
  paymentMethod: "pay_on_delivery",
  paymentStatus: "unpaid",
  confirmationEmailStatus: "pending",
  createdAt: new Date().toISOString(),
  items: [
    { id: "i1", orderId: "o", productId: null, productName: "Velvet Matt Interior Emulsion — Sage Grove, 4 L", productImageUrl: null, unitPrice: 18500, quantity: 2, subtotal: 37000 },
    { id: "i2", orderId: "o", productId: null, productName: "Microfibre Roller Sleeve (230 mm, 2-pack)", productImageUrl: null, unitPrice: 5600, quantity: 1, subtotal: 5600 },
  ],
};

async function main() {
  // server-only modules can't be imported by plain scripts; load via the untagged pieces.
  const { renderOrderConfirmation } = await import("../lib/mailgun/templates/order-confirmation");
  const rendered = renderOrderConfirmation(sample, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

  const apiKey = process.env.MAILGUN_API_KEY!;
  const domain = process.env.MAILGUN_DOMAIN!;
  const base = (process.env.MAILGUN_API_BASE_URL || "https://api.mailgun.net").replace(/\/$/, "");
  const body = new URLSearchParams({ from: process.env.MAILGUN_FROM_EMAIL!, to, subject: rendered.subject, text: rendered.text, html: rendered.html, "o:tag": "mailgun-test" });
  const res = await fetch(`${base}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Mailgun ${res.status}: ${text}`);
    process.exit(1);
  }
  console.log("Accepted by Mailgun:", text);
}

void main();
