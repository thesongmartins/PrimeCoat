"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { resendConfirmation, signInWithPassword } from "@/app/auth/actions";
import { Input, Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "./auth-shell";

export function EmailSignInForm({ next }: { next: string }) {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;
  const router = useRouter();
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resending, startResend] = useTransition();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: SignInInput) {
    setError(null);
    setNotice(null);
    const res = await signInWithPassword(values, next);
    if (!res.ok) {
      setError({ message: res.error, code: res.code });
      return;
    }
    router.replace(res.next ?? next);
    router.refresh();
  }

  function resend() {
    startResend(async () => {
      const res = await resendConfirmation(getValues("email"), next);
      if (res.ok) {
        setError(null);
        setNotice("We've sent a new confirmation link. Check your inbox and spam folder.");
      } else setError({ message: res.error });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor={f("email")}>Email</Label>
        <Input id={f("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? f("email-err") : undefined} {...register("email")} />
        <FieldError id={f("email-err")} message={errors.email?.message} />
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <Label htmlFor={f("password")} className="mb-0">Password</Label>
          <Link href="/forgot-password" className="text-sm text-charcoal-600 underline-offset-4 hover:underline">Forgot password?</Link>
        </div>
        <PasswordInput id={f("password")} autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? f("password-err") : undefined} {...register("password")} />
        <FieldError id={f("password-err")} message={errors.password?.message} />
      </div>
      {error && (
        <FormAlert>
          {error.message}
          {error.code === "email_not_confirmed" && (
            <>
              {" "}
              <button type="button" onClick={resend} disabled={resending} className="font-medium underline underline-offset-2">
                {resending ? "Sending…" : "Resend link"}
              </button>
            </>
          )}
        </FormAlert>
      )}
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
