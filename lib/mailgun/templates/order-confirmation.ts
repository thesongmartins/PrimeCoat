import type { Order } from "@/types/order";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/types/order";
import { formatNaira } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/dates";

/**
 * Pure template: no network, fully unit-testable. Every user-supplied string is escaped.
 * Table-based layout with inline styles for broad email-client support.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const C = {
  charcoal: "#1B1B1F",
  warmWhite: "#FAF8F5",
  cream: "#F3EFE8",
  stone: "#E8E3DC",
  mute: "#6B665F",
  terracotta: "#C65D3B",
  success: "#3F7D4E",
};

export function renderOrderConfirmation(order: Order, siteUrl: string): RenderedEmail {
  const e = escapeHtml;
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const orderUrl = `${siteUrl.replace(/\/$/, "")}/orders/${order.id}`;
  const placed = formatDateTime(order.createdAt);
  const status = ORDER_STATUS_LABELS[order.status];
  const payment = PAYMENT_METHOD_LABELS[order.paymentMethod];

  const itemRows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${C.stone};font-size:14px;color:${C.charcoal};">
            ${e(i.productName)}
            <div style="font-size:12px;color:${C.mute};margin-top:2px;">Qty ${i.quantity} × ${formatNaira(i.unitPrice)}</div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${C.stone};font-size:14px;color:${C.charcoal};white-space:nowrap;">${formatNaira(i.subtotal)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your PrimeCoat order ${e(order.orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.charcoal};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Order ${e(order.orderNumber)} confirmed — ${formatNaira(order.total)}, pay on delivery.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.warmWhite};border:1px solid ${C.stone};border-radius:8px;overflow:hidden;">

        <tr><td style="background:${C.charcoal};padding:24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:${C.warmWhite};border-radius:4px;text-align:center;vertical-align:middle;font:700 18px Georgia,serif;color:${C.charcoal};">P</td>
            <td style="padding-left:10px;font:600 22px Georgia,'Times New Roman',serif;color:${C.warmWhite};letter-spacing:-0.3px;">PrimeCoat</td>
          </tr></table>
          <div style="margin-top:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9C2B8;">Quality Paints. Professional Finishes.</div>
        </td></tr>

        <tr><td style="height:4px;background:${C.terracotta};font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.terracotta};font-weight:700;">Order confirmed</div>
          <h1 style="margin:10px 0 0;font:500 28px Georgia,'Times New Roman',serif;color:${C.charcoal};">Thank you, ${e(firstName)}.</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${C.mute};">
            We've received your order and will call <strong style="color:${C.charcoal};">${e(order.phone)}</strong> to arrange delivery.
            Payment is made on delivery.
          </p>
        </td></tr>

        <tr><td style="padding:16px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid ${C.stone};border-radius:6px;">
            <tr>
              <td style="padding:14px 16px;font-size:12px;color:${C.mute};">Order number<div style="font:600 15px ui-monospace,Menlo,Consolas,monospace;color:${C.charcoal};margin-top:3px;">${e(order.orderNumber)}</div></td>
              <td style="padding:14px 16px;font-size:12px;color:${C.mute};">Placed<div style="font-size:14px;color:${C.charcoal};margin-top:3px;">${e(placed)}</div></td>
              <td style="padding:14px 16px;font-size:12px;color:${C.mute};">Status<div style="margin-top:4px;"><span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#F8EDD3;color:#8A6418;font-size:12px;font-weight:600;">${e(status)}</span></div></td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.mute};font-weight:700;">Your items</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            ${itemRows}
            <tr><td style="padding:14px 0 4px;font-size:14px;color:${C.mute};">Subtotal</td><td align="right" style="padding:14px 0 4px;font-size:14px;">${formatNaira(order.subtotal)}</td></tr>
            <tr><td style="padding:4px 0;font-size:14px;color:${C.mute};">Delivery · ${e(order.state)}</td><td align="right" style="padding:4px 0;font-size:14px;color:${order.deliveryFee === 0 ? C.success : C.charcoal};">${order.deliveryFee === 0 ? "Free" : formatNaira(order.deliveryFee)}</td></tr>
            <tr><td style="padding:12px 0 0;border-top:1px solid ${C.charcoal};font-size:16px;font-weight:600;">Total</td><td align="right" style="padding:12px 0 0;border-top:1px solid ${C.charcoal};font:600 20px Georgia,serif;">${formatNaira(order.total)}</td></tr>
            <tr><td colspan="2" style="padding:6px 0 0;font-size:12px;color:${C.mute};">Payment method: ${e(payment)}</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top" style="width:50%;padding-right:12px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.mute};font-weight:700;">Delivery address</div>
                <div style="margin-top:8px;font-size:14px;line-height:1.6;">
                  <strong>${e(order.customerName)}</strong><br>
                  ${e(order.deliveryAddress)}<br>
                  ${e(order.city)}, ${e(order.state)}<br>
                  <span style="color:${C.mute};">${e(order.phone)}</span>
                </div>
              </td>
              <td valign="top" style="width:50%;padding-left:12px;">
                ${
                  order.deliveryInstructions
                    ? `<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.mute};font-weight:700;">Delivery instructions</div>
                       <div style="margin-top:8px;font-size:14px;line-height:1.6;color:${C.mute};">${e(order.deliveryInstructions)}</div>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:32px 32px 8px;" align="center">
          <a href="${e(orderUrl)}" style="display:inline-block;background:${C.charcoal};color:${C.warmWhite};text-decoration:none;padding:14px 28px;border-radius:6px;font-size:14px;font-weight:600;">View your order</a>
        </td></tr>

        <tr><td style="padding:20px 32px 32px;font-size:13px;line-height:1.6;color:${C.mute};">
          Thank you for choosing PrimeCoat. If anything about this order looks wrong, reply to this email or call us on +234 800 000 0000 and we'll put it right before dispatch.
        </td></tr>

        <tr><td style="background:${C.cream};border-top:1px solid ${C.stone};padding:18px 32px;font-size:12px;color:${C.mute};">
          PrimeCoat Paints Ltd · 12 Adeola Odeku Street, Victoria Island, Lagos<br>
          You're receiving this because you placed an order at <a href="${e(siteUrl)}" style="color:${C.terracotta};text-decoration:none;">${e(siteUrl.replace(/^https?:\/\//, ""))}</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const lines = order.items.map((i) => `  - ${i.productName} × ${i.quantity} @ ${formatNaira(i.unitPrice)} = ${formatNaira(i.subtotal)}`);
  const text = [
    "PRIMECOAT — Quality Paints. Professional Finishes.",
    "",
    `Thank you, ${firstName}. Your order is confirmed.`,
    "",
    `Order number: ${order.orderNumber}`,
    `Placed:       ${placed}`,
    `Status:       ${status}`,
    `Payment:      ${payment}`,
    "",
    "Items:",
    ...lines,
    "",
    `Subtotal:     ${formatNaira(order.subtotal)}`,
    `Delivery:     ${order.deliveryFee === 0 ? "Free" : formatNaira(order.deliveryFee)} (${order.state})`,
    `Total:        ${formatNaira(order.total)}`,
    "",
    "Delivery address:",
    `  ${order.customerName}`,
    `  ${order.deliveryAddress}`,
    `  ${order.city}, ${order.state}`,
    `  ${order.phone}`,
    ...(order.deliveryInstructions ? ["", `Instructions: ${order.deliveryInstructions}`] : []),
    "",
    `View your order: ${orderUrl}`,
    "",
    "We will call to arrange delivery. Payment is made on delivery.",
    "PrimeCoat Paints Ltd · 12 Adeola Odeku Street, Victoria Island, Lagos",
  ].join("\n");

  return {
    subject: `Your PrimeCoat order ${order.orderNumber} is confirmed`,
    html,
    text,
  };
}
