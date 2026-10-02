"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export function GoogleSignInButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function signIn() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) {
      setError("We couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
    // On success the browser navigates to Google; no further state needed.
  }

  return (
    <div>
      <Button type="button" size="lg" variant="outline" className="w-full bg-white" onClick={signIn} loading={loading} disabled={!configured}>
        {!loading && <GoogleMark />}
        Continue with Google
      </Button>
      {!configured && (
        <p className="mt-3 text-xs leading-relaxed text-mute">
          Sign-in is not configured yet. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-md border border-danger/30 bg-danger-100 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.2z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
