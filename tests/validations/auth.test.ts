import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validations/auth";

const signUp = { fullName: "Ada Okonkwo", email: "Ada@Example.com ", password: "paint2026", confirmPassword: "paint2026" };

describe("signUpSchema", () => {
  it("accepts a valid sign-up and normalises the email", () => {
    const r = signUpSchema.parse(signUp);
    expect(r.email).toBe("ada@example.com");
  });
  it.each([
    ["short password", { password: "ab1", confirmPassword: "ab1" }, "password"],
    ["no number", { password: "paintpaint", confirmPassword: "paintpaint" }, "password"],
    ["no letter", { password: "12345678", confirmPassword: "12345678" }, "password"],
    ["too long", { password: "a1".repeat(40), confirmPassword: "a1".repeat(40) }, "password"],
    ["mismatch", { confirmPassword: "paint2027" }, "confirmPassword"],
    ["bad email", { email: "nope" }, "email"],
    ["short name", { fullName: "A" }, "fullName"],
  ])("rejects %s", (_label, patch, field) => {
    const r = signUpSchema.safeParse({ ...signUp, ...patch });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual([field]);
  });
});

describe("signInSchema", () => {
  it("requires email and a non-empty password but no strength rule", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "bad", password: "x" }).success).toBe(false);
  });
});

describe("forgot and reset", () => {
  it("validates email for reset requests", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
  it("enforces strength and match on new passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "newpaint9", confirmPassword: "newpaint9" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "newpaint9", confirmPassword: "newpaint8" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "short1", confirmPassword: "short1" }).success).toBe(false);
  });
});
