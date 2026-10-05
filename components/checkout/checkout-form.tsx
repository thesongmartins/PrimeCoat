"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, CreditCard, ShieldCheck } from "lucide-react";
import { checkoutSchema, type CheckoutFormValues, type CheckoutInput } from "@/lib/validations/checkout";
import { cn } from "@/lib/utils/cn";
import { NIGERIA_STATES } from "@/lib/utils/nigeria-states";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  defaults: Partial<Pick<CheckoutFormValues, "fullName" | "email" | "phone">>;
  deliveryState: string;
  onDeliveryStateChange: (state: string) => void;
  cartIsEmpty: boolean;
  /** Card payment is offered only when Paystack is configured on the server. */
  cardAvailable: boolean;
  /** Email is locked to the signed-in account so the confirmation goes to a verified inbox. */
  lockEmail?: boolean;
}

interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  emailStatus?: "sent" | "failed";
  /** Card orders: Paystack hosted checkout to send the customer to. */
  paymentUrl?: string;
  /** Card orders: the order exists but Paystack couldn't be reached; retry from the order page. */
  paymentError?: string;
}

export function CheckoutForm({ defaults, deliveryState, onDeliveryStateChange, cartIsEmpty, cardAvailable, lockEmail = false }: Props) {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues, unknown, CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: defaults.fullName ?? "",
      email: defaults.email ?? "",
      phone: defaults.phone ?? "",
      deliveryAddress: "",
      city: "",
      state: (NIGERIA_STATES as readonly string[]).includes(deliveryState) ? (deliveryState as CheckoutInput["state"]) : "Lagos",
      deliveryInstructions: "",
      paymentMethod: cardAvailable ? "card" : "pay_on_delivery",
    },
  });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const [redirecting, setRedirecting] = useState(false);

  async function onSubmit(customer: CheckoutInput) {
    setServerError(null);
    if (cartIsEmpty) {
      setServerError("Your cart is empty.");
      return;
    }
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The server reads the cart from Supabase; only delivery details are sent.
        body: JSON.stringify({ customer }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      const body = (await res.json().catch(() => null)) as (CreateOrderResponse & { error?: string }) | null;
      if (!res.ok || !body?.orderNumber) {
        throw new Error(body?.error ?? "We couldn't place your order. Please try again.");
      }
      // The cart was emptied inside the same database transaction that created the order.
      if (body.paymentUrl) {
        setRedirecting(true);
        // Paystack hosted checkout; it returns to PAYSTACK_CALLBACK_PATH (/payments/paystack/callback).
        window.location.assign(body.paymentUrl);
        return;
      }
      const confirmation = `/checkout/confirmation/${encodeURIComponent(body.orderNumber)}`;
      router.push(body.paymentError ? `${confirmation}?payment=failed` : `${confirmation}${body.emailStatus === "failed" ? "?email=failed" : ""}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10">
      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-medium">Contact information</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor={f("fullName")}>Full name</Label>
            <Input id={f("fullName")} autoComplete="name" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? f("fullName-err") : undefined} {...register("fullName")} />
            <FieldError id={f("fullName-err")} message={errors.fullName?.message} />
          </div>
          <div>
            <Label htmlFor={f("email")}>Email</Label>
            <Input id={f("email")} type="email" autoComplete="email" readOnly={lockEmail} aria-invalid={!!errors.email} aria-describedby={lockEmail ? f("email-hint") : errors.email ? f("email-err") : undefined} className={lockEmail ? "bg-stone-200 text-charcoal-600" : undefined} {...register("email")} />
            {lockEmail ? <FieldHint id={f("email-hint")}>Your confirmation will be sent to your Google account email.</FieldHint> : <FieldError id={f("email-err")} message={errors.email?.message} />}
          </div>
          <div>
            <Label htmlFor={f("phone")}>Phone</Label>
            <Input id={f("phone")} type="tel" autoComplete="tel" placeholder="0803 123 4567" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? f("phone-err") : undefined} {...register("phone")} />
            <FieldError id={f("phone-err")} message={errors.phone?.message} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-medium">Delivery address</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor={f("deliveryAddress")}>Street address</Label>
            <Input id={f("deliveryAddress")} autoComplete="street-address" placeholder="House number, street, estate" aria-invalid={!!errors.deliveryAddress} aria-describedby={errors.deliveryAddress ? f("deliveryAddress-err") : undefined} {...register("deliveryAddress")} />
            <FieldError id={f("deliveryAddress-err")} message={errors.deliveryAddress?.message} />
          </div>
          <div>
            <Label htmlFor={f("city")}>City / town</Label>
            <Input id={f("city")} autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby={errors.city ? f("city-err") : undefined} {...register("city")} />
            <FieldError id={f("city-err")} message={errors.city?.message} />
          </div>
          <div>
            <Label htmlFor={f("state")}>State</Label>
            <Select id={f("state")} autoComplete="address-level1" aria-invalid={!!errors.state} aria-describedby={errors.state ? f("state-err") : undefined} {...register("state", { onChange: (e) => onDeliveryStateChange(e.target.value) })}>
              {NIGERIA_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <FieldError id={f("state-err")} message={errors.state?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={f("deliveryInstructions")}>Delivery instructions <span className="font-normal text-mute">(optional)</span></Label>
            <Textarea id={f("deliveryInstructions")} placeholder="Gate code, landmark, best time to deliver…" className="min-h-20" aria-invalid={!!errors.deliveryInstructions} aria-describedby={errors.deliveryInstructions ? f("deliveryInstructions-err") : undefined} {...register("deliveryInstructions")} />
            <FieldError id={f("deliveryInstructions-err")} message={errors.deliveryInstructions?.message} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-medium">Payment</legend>
        <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Payment method">
          {cardAvailable && (
            <PaymentOption
              id={f("pay-card")}
              checked={paymentMethod === "card"}
              icon={<CreditCard className="size-5" aria-hidden="true" />}
              title="Pay now with card"
              body="Secure payment by card, bank transfer or USSD through Paystack. You'll return here once it's done."
              input={<input id={f("pay-card")} type="radio" value="card" className="sr-only" {...register("paymentMethod")} />}
            />
          )}
          <PaymentOption
            id={f("pay-pod")}
            checked={paymentMethod === "pay_on_delivery"}
            icon={<Banknote className="size-5" aria-hidden="true" />}
            title="Pay on Delivery"
            body="Pay the driver in cash or by bank transfer when your order arrives."
            input={<input id={f("pay-pod")} type="radio" value="pay_on_delivery" className="sr-only" {...register("paymentMethod")} />}
          />
        </div>
      </fieldset>

      {serverError && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-100 px-4 py-3 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="space-y-3">
        <Button type="submit" size="lg" loading={isSubmitting || redirecting} className="w-full">
          {paymentMethod === "card" ? (redirecting ? "Opening secure payment…" : "Continue to payment") : "Place Order"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-mute">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {paymentMethod === "card"
            ? "Card details are entered on Paystack, never on this site."
            : "Your order is saved to your account and confirmed by email."}
        </p>
      </div>
    </form>
  );
}

function PaymentOption({ id, checked, icon, title, body, input }: { id: string; checked: boolean; icon: React.ReactNode; title: string; body: string; input: React.ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-lg border bg-white p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta",
        checked ? "border-charcoal ring-1 ring-charcoal" : "border-stone hover:border-charcoal-600",
      )}
    >
      {input}
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-cream text-terracotta">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-mute">{body}</span>
      </span>
      <span aria-hidden="true" className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full border", checked ? "border-charcoal" : "border-stone-400")}>
        {checked && <span className="size-2.5 rounded-full bg-charcoal" />}
      </span>
    </label>
  );
}
