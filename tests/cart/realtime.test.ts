import { describe, expect, it } from "vitest";
import { isOwnCartChange } from "@/lib/cart/realtime";

const me = "user-a";
const mine = new Set(["line-1"]);

describe("isOwnCartChange", () => {
  it("counts inserts and updates only for the signed-in user's rows", () => {
    expect(isOwnCartChange({ eventType: "INSERT", new: { user_id: me } }, me, mine)).toBe(true);
    expect(isOwnCartChange({ eventType: "UPDATE", new: { user_id: me } }, me, mine)).toBe(true);
    expect(isOwnCartChange({ eventType: "UPDATE", new: { user_id: "user-b" } }, me, mine)).toBe(false);
  });

  it("counts a delete carrying only an id when it is one of our lines (e.g. an order emptying the cart)", () => {
    expect(isOwnCartChange({ eventType: "DELETE", old: { id: "line-1" } }, me, mine)).toBe(true);
  });

  it("ignores another user's delete", () => {
    expect(isOwnCartChange({ eventType: "DELETE", old: { id: "line-9" } }, me, mine)).toBe(false);
    expect(isOwnCartChange({ eventType: "DELETE", old: {} }, me, mine)).toBe(false);
  });

  it("decides by user_id when a delete carries it", () => {
    expect(isOwnCartChange({ eventType: "DELETE", old: { id: "line-9", user_id: me } }, me, new Set())).toBe(true);
    expect(isOwnCartChange({ eventType: "DELETE", old: { id: "line-1", user_id: "user-b" } }, me, mine)).toBe(false);
  });
});
