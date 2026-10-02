import { describe, expect, it } from "vitest";
import { serviceRequestSchema } from "@/lib/validations/service-request";

const valid = {
  name: "Bayo Adeyemi",
  email: "bayo@example.com",
  phone: "08031234567",
  serviceType: "residential",
  propertyType: "duplex",
  address: "5 Admiralty Way, Lekki",
  preferredDate: "",
  message: "",
};

describe("serviceRequestSchema", () => {
  it("accepts a valid request with optional fields empty", () => {
    expect(serviceRequestSchema.safeParse(valid).success).toBe(true);
  });
  it("accepts a valid ISO date", () => {
    expect(serviceRequestSchema.safeParse({ ...valid, preferredDate: "2026-11-01" }).success).toBe(true);
  });
  it("rejects an invalid date and unknown enums", () => {
    expect(serviceRequestSchema.safeParse({ ...valid, preferredDate: "not-a-date" }).success).toBe(false);
    expect(serviceRequestSchema.safeParse({ ...valid, serviceType: "plumbing" }).success).toBe(false);
    expect(serviceRequestSchema.safeParse({ ...valid, propertyType: "castle" }).success).toBe(false);
  });
  it("limits the message length", () => {
    expect(serviceRequestSchema.safeParse({ ...valid, message: "x".repeat(1001) }).success).toBe(false);
  });
});
