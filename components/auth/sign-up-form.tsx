"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { PASSWORD_MIN, signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { resendConfirmation, signUpWithPassword } from "@/app/auth/actions";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "./auth-shell";

export function SignUpForm({ next }: { next: string }) {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resending, startResend] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setError(null);
    const res = await signUpWithPassword(values, next);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.status === "signed_in") {
      router.replace(res.next ?? next);
      router.refresh();
      return;
    }
    setSentTo(values.email.trim().toLowerCase());
  }

  if (sentTo) {
    return (
      <div className="rounded-lg border border-stone bg-cream p-6">
        <MailCheck className="size-8 text-terracotta" aria-hidden="true" />
        <h2 className="mt-3 font-display text-2xl font-medium">Check your email</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-charcoal-600">
          We&apos;ve sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your account, then you&apos;ll be signed in automatically.
        </p>
        <p className="mt-3 text-sm text-mute">Can&apos;t find it? Check spam, or</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          loading={resending}
          onClick={() =>
            startResend(async () => {
              const res = await resendConfirmation(sentTo, next);
              setNotice(res.ok ? "A new link is on its way." : res.error);
            })
          }
        >
          Resend the link
        </Button>
        {notice && <p role="status" className="mt-3 text-sm text-charcoal-600">{notice}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor={f("fullName")}>Full name</Label>
        <Input id={f("fullName")} autoComplete="name" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? f("fullName-err") : undefined} {...register("fullName")} />
        <FieldError id={f("fullName-err")} message={errors.fullName?.message} />
      </div>
      <div>
        <Label htmlFor={f("email")}>Email</Label>
        <Input id={f("email")} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? f("email-err") : undefined} {...register("email")} />
        <FieldError id={f("email-err")} message={errors.email?.message} />
      </div>
      <div>
        <Label htmlFor={f("password")}>Password</Label>
        <PasswordInput id={f("password")} autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? f("password-err") : f("password-hint")} {...register("password")} />
        {errors.password ? (
          <FieldError id={f("password-err")} message={errors.password.message} />
        ) : (
          <FieldHint id={f("password-hint")}>At least {PASSWORD_MIN} characters, with a letter and a number.</FieldHint>
        )}
      </div>
      <div>
        <Label htmlFor={f("confirmPassword")}>Confirm password</Label>
        <PasswordInput id={f("confirmPassword")} autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? f("confirmPassword-err") : undefined} {...register("confirmPassword")} />
        <FieldError id={f("confirmPassword-err")} message={errors.confirmPassword?.message} />
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Create account
      </Button>
    </form>
  );
}
