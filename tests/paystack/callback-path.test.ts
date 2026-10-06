import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { PAYSTACK_APP_CALLBACK_PATH, PAYSTACK_CALLBACK_PATH } from "@/lib/payments/paystack";

describe("Paystack return URL", () => {
  it("points at a route that actually exists", () => {
    // Regression: the URL sent to Paystack once pointed at a path with no route (404 after paying).
    const routeFile = join(process.cwd(), "app", ...PAYSTACK_CALLBACK_PATH.split("/").filter(Boolean), "route.ts");
    expect(existsSync(routeFile)).toBe(true);
  });

  it("has a matching route for payments started in the mobile app", () => {
    const routeFile = join(process.cwd(), "app", ...PAYSTACK_APP_CALLBACK_PATH.split("/").filter(Boolean), "route.ts");
    expect(existsSync(routeFile)).toBe(true);
    expect(PAYSTACK_APP_CALLBACK_PATH.startsWith("/checkout")).toBe(false);
  });

  it("is outside the login-protected /checkout prefix", () => {
    expect(PAYSTACK_CALLBACK_PATH.startsWith("/checkout")).toBe(false);
  });

  it("keeps the legacy /checkout return address forwarding", () => {
    expect(existsSync(join(process.cwd(), "app", "checkout", "paystack", "callback", "route.ts"))).toBe(true);
  });
});
