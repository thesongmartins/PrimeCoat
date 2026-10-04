"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_MIN, resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { updatePassword } from "@/app/auth/actions";
import { Label, FieldError, FieldHint } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "./auth-shell";

export function ResetPasswordForm() {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: ResetPasswordInput) {
    setError(null);
    const res = await updatePassword(values);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace("/account?password=updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor={f("password")}>New password</Label>
        <PasswordInput id={f("password")} autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? f("password-err") : f("password-hint")} {...register("password")} />
        {errors.password ? (
          <FieldError id={f("password-err")} message={errors.password.message} />
        ) : (
          <FieldHint id={f("password-hint")}>At least {PASSWORD_MIN} characters, with a letter and a number.</FieldHint>
        )}
      </div>
      <div>
        <Label htmlFor={f("confirmPassword")}>Confirm new password</Label>
        <PasswordInput id={f("confirmPassword")} autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? f("confirmPassword-err") : undefined} {...register("confirmPassword")} />
        <FieldError id={f("confirmPassword-err")} message={errors.confirmPassword?.message} />
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Update password
      </Button>
    </form>
  );
}
