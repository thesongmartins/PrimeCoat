import type { NextRequest } from "next/server";

/** Public origin of a request, honouring Vercel's forwarded host in production. */
export function originFromRequest(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost && process.env.NODE_ENV !== "development") {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}
