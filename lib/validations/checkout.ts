import { z } from "zod";
import { NIGERIA_STATES } from "@/lib/utils/nigeria-states";

const NIGERIAN_PHONE = /^(?:\+234|0)[7-9][01]\d{8}$/;

export function normalisePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number")
    .refine((v) => NIGERIAN_PHONE.test(normalisePhone(v)), "Enter a valid Nigerian phone number, e.g. 0803 123 4567"),
  deliveryAddress: z.string().trim().min(5, "Enter your street address").max(300, "Address is too long"),
  city: z.string().trim().min(2, "Enter your city or town").max(100),
  state: z.enum(NIGERIA_STATES, { message: "Select your state" }),
  deliveryInstructions: z.string().trim().max(500, "Keep instructions under 500 characters").optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.uuid("Invalid product"),
      quantity: z.number().int().min(1).max(999),
    }),
  )
  .min(1, "Your cart is empty")
  .max(50, "Too many line items");

export type CartItemsInput = z.infer<typeof cartItemsSchema>;

export const createOrderSchema = z.object({
  customer: checkoutSchema,
  items: cartItemsSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
