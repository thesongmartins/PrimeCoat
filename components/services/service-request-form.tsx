"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { serviceRequestSchema, type ServiceRequestInput } from "@/lib/validations/service-request";
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPES, SERVICE_TYPE_LABELS, SERVICE_TYPES, type ServiceType } from "@/types/service-request";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  defaultServiceType?: ServiceType;
  defaultValues?: Partial<Pick<ServiceRequestInput, "name" | "email" | "phone">>;
}

export function ServiceRequestForm({ defaultServiceType, defaultValues }: Props) {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceRequestInput>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: defaultServiceType,
      preferredDate: "",
      message: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: ServiceRequestInput) {
    setErrorMessage(null);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We couldn't send your request. Please try again.");
      }
      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success-100 p-6">
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <h3 className="mt-3 font-display text-2xl font-medium">Request received</h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-charcoal-600">
          Thank you. A PrimeCoat consultant will call you within one working day to confirm details and arrange a site visit.
        </p>
        <Button type="button" variant="outline" className="mt-5" onClick={() => setStatus("idle")}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={f("name")}>Full name</Label>
        <Input id={f("name")} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? f("name-err") : undefined} {...register("name")} />
        <FieldError id={f("name-err")} message={errors.name?.message} />
      </div>
      <div>
        <Label htmlFor={f("email")}>Email</Label>
        <Input id={f("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? f("email-err") : undefined} {...register("email")} />
        <FieldError id={f("email-err")} message={errors.email?.message} />
      </div>
      <div>
        <Label htmlFor={f("phone")}>Phone</Label>
        <Input id={f("phone")} type="tel" autoComplete="tel" placeholder="0803 123 4567" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? f("phone-err") : undefined} {...register("phone")} />
        <FieldError id={f("phone-err")} message={errors.phone?.message} />
      </div>
      <div>
        <Label htmlFor={f("serviceType")}>Service</Label>
        <Select id={f("serviceType")} defaultValue="" aria-invalid={!!errors.serviceType} aria-describedby={errors.serviceType ? f("serviceType-err") : undefined} {...register("serviceType")}>
          <option value="" disabled>Select a service</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>{SERVICE_TYPE_LABELS[s]}</option>
          ))}
        </Select>
        <FieldError id={f("serviceType-err")} message={errors.serviceType?.message} />
      </div>
      <div>
        <Label htmlFor={f("propertyType")}>Property type</Label>
        <Select id={f("propertyType")} defaultValue="" aria-invalid={!!errors.propertyType} aria-describedby={errors.propertyType ? f("propertyType-err") : undefined} {...register("propertyType")}>
          <option value="" disabled>Select a property type</option>
          {PROPERTY_TYPES.map((p) => (
            <option key={p} value={p}>{PROPERTY_TYPE_LABELS[p]}</option>
          ))}
        </Select>
        <FieldError id={f("propertyType-err")} message={errors.propertyType?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={f("address")}>Property address</Label>
        <Input id={f("address")} autoComplete="street-address" aria-invalid={!!errors.address} aria-describedby={errors.address ? f("address-err") : undefined} {...register("address")} />
        <FieldError id={f("address-err")} message={errors.address?.message} />
      </div>
      <div>
        <Label htmlFor={f("preferredDate")}>Preferred start date <span className="font-normal text-mute">(optional)</span></Label>
        <Input id={f("preferredDate")} type="date" min={new Date().toISOString().slice(0, 10)} aria-invalid={!!errors.preferredDate} aria-describedby={errors.preferredDate ? f("preferredDate-err") : undefined} {...register("preferredDate")} />
        <FieldError id={f("preferredDate-err")} message={errors.preferredDate?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={f("message")}>Tell us about the project <span className="font-normal text-mute">(optional)</span></Label>
        <Textarea id={f("message")} placeholder="Number of rooms, current condition of the walls, colours you have in mind…" aria-describedby={f("message-hint")} {...register("message")} />
        <FieldHint id={f("message-hint")}>The more detail you share, the more accurate our first estimate.</FieldHint>
        <FieldError id={f("message-err")} message={errors.message?.message} />
      </div>
      {errorMessage && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-100 px-4 py-3 text-sm text-danger sm:col-span-2">
          {errorMessage}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
          Request a quote
        </Button>
      </div>
    </form>
  );
}
