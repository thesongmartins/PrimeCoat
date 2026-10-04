"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/app/auth/actions";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "./auth-shell";

export function ForgotPasswordForm() {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function onSubmit(values: ForgotPasswordInput) {
    setError(null);
    const res = await requestPasswordReset(values);
    if (!res.ok) setError(res.error);
    else setSentTo(values.email.trim().toLowerCase());
  }

  if (sentTo) {
    return (
      <FormAlert tone="success">
        If an account exists for {sentTo}, a password reset link is on its way. The link expires in one hour.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input id={`${id}-email`} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-err` : undefined} {...register("email")} />
        <FieldError id={`${id}-email-err`} message={errors.email?.message} />
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
