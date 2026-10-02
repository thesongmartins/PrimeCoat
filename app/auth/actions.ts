"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Drop the cached root layout so the header re-renders in its signed-out state immediately.
  revalidatePath("/", "layout");
  redirect("/");
}
