import { NextResponse, type NextRequest } from "next/server";
import { serviceRequestSchema } from "@/lib/validations/service-request";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/service-requests — anonymous or signed-in. Stored in painting_service_requests. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Service requests are temporarily unavailable." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = serviceRequestSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Invalid details." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const v = parsed.data;
  const { error } = await supabase.from("painting_service_requests").insert({
    user_id: user?.id ?? null,
    name: v.name,
    email: v.email.toLowerCase(),
    phone: v.phone,
    service_type: v.serviceType,
    property_type: v.propertyType,
    address: v.address,
    preferred_date: v.preferredDate || null,
    message: v.message || null,
  });

  if (error) {
    logger.error("service_requests.insert_failed", { message: error.message });
    return NextResponse.json({ error: "We couldn't send your request. Please try again." }, { status: 500 });
  }

  logger.info("service_requests.created", { serviceType: v.serviceType, authenticated: Boolean(user) });
  return NextResponse.json({ ok: true }, { status: 201 });
}
