import { describe, expect, it } from "vitest";
import { escapeHtml, renderOrderConfirmation } from "@/lib/mailgun/templates/order-confirmation";
import type { Order } from "@/types/order";

const order: Order = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  orderNumber: "PC-20261002-0007",
  customerName: "Ada <script>alert(1)</script> Okonkwo",
  email: "ada@example.com",
  phone: "0803 123 4567",
  deliveryAddress: "14 Bourdillon Road & Co",
  city: "Lagos",
  state: "Lagos",
  deliveryInstructions: 'Gate code "4421"',
  subtotal: 42600,
  deliveryFee: 2500,
  total: 45100,
  status: "pending",
  paymentMethod: "pay_on_delivery",
  paymentStatus: "unpaid",
  confirmationEmailStatus: "pending",
  createdAt: "2026-10-02T10:15:00.000Z",
  items: [
    { id: "a", orderId: "o", productId: null, productName: "Velvet Matt Interior Emulsion", productImageUrl: null, unitPrice: 18500, quantity: 2, subtotal: 37000 },
    { id: "b", orderId: "o", productId: null, productName: "Microfibre Roller Sleeve", productImageUrl: null, unitPrice: 5600, quantity: 1, subtotal: 5600 },
  ],
};

describe("escapeHtml", () => {
  it("escapes the five HTML metacharacters", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;");
  });
});

describe("renderOrderConfirmation", () => {
  const rendered = renderOrderConfirmation(order, "https://primecoat.example");

  it("builds the subject from the order number", () => {
    expect(rendered.subject).toBe("Your PrimeCoat order PC-20261002-0007 is confirmed");
  });

  it("includes every required field in the HTML", () => {
    for (const s of ["PrimeCoat", "PC-20261002-0007", "Velvet Matt Interior Emulsion", "Qty 2", "₦18,500", "Microfibre Roller Sleeve", "₦42,600", "₦2,500", "₦45,100", "14 Bourdillon Road &amp; Co", "Lagos", "Pending", "Pay on Delivery", "Thank you"]) {
      expect(rendered.html).toContain(s);
    }
  });

  it("escapes user-supplied content", () => {
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("Gate code &quot;4421&quot;");
  });

  it("links to the order page on the given site", () => {
    expect(rendered.html).toContain("https://primecoat.example/orders/11111111-1111-4111-8111-111111111111");
    expect(rendered.text).toContain("https://primecoat.example/orders/11111111-1111-4111-8111-111111111111");
  });

  it("produces a plain-text alternative with the same facts", () => {
    for (const s of ["PC-20261002-0007", "Velvet Matt Interior Emulsion × 2", "₦45,100", "14 Bourdillon Road & Co", "Pay on Delivery"]) {
      expect(rendered.text).toContain(s);
    }
    expect(rendered.text).not.toContain("<");
  });

  it("shows Free when delivery is zero", () => {
    const free = renderOrderConfirmation({ ...order, deliveryFee: 0, total: 42600 }, "https://x.test");
    expect(free.html).toContain(">Free<");
    expect(free.text).toContain("Delivery:     Free");
  });
});
