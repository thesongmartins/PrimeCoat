import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("next/headers", () => ({ headers: mocks.headers, cookies: vi.fn() }));

import { bearerToken } from "@/lib/supabase/server";

const withAuthorization = (value?: string) => mocks.headers.mockResolvedValue(new Headers(value ? { authorization: value } : {}));

describe("bearerToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the mobile app's access token", async () => {
    withAuthorization("Bearer eyJhbGciOi.payload.sig");
    expect(await bearerToken()).toBe("eyJhbGciOi.payload.sig");
  });

  it("is null for browser requests without the header", async () => {
    withAuthorization();
    expect(await bearerToken()).toBeNull();
  });

  it("ignores other schemes and empty tokens", async () => {
    withAuthorization("Basic abc");
    expect(await bearerToken()).toBeNull();
    withAuthorization("Bearer ");
    expect(await bearerToken()).toBeNull();
  });
});
