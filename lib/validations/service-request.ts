import { z } from "zod";
import { PROPERTY_TYPES, SERVICE_TYPES } from "@/types/service-request";
import { normalisePhone } from "./checkout";

const NIGERIAN_PHONE = /^(?:\+234|0)[7-9][01]\d{8}$/;

export const serviceRequestSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number")
    .refine((v) => NIGERIAN_PHONE.test(normalisePhone(v)), "Enter a valid Nigerian phone number"),
  serviceType: z.enum(SERVICE_TYPES, { message: "Select a service" }),
  propertyType: z.enum(PROPERTY_TYPES, { message: "Select a property type" }),
  address: z.string().trim().min(5, "Enter the property address").max(300),
  preferredDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  message: z.string().trim().max(1000, "Keep your message under 1000 characters").optional().or(z.literal("")),
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;
