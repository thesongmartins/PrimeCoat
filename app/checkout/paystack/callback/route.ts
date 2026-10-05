import { NextResponse, type NextRequest } from "next/server";
import { PAYSTACK_CALLBACK_PATH } from "@/lib/payments/paystack";
import { originFromRequest } from "@/lib/utils/origin";

/**
 * Legacy return address. Payments started before the fix asked Paystack to return here;
 * forward them (query intact) to the real callback so they still verify and show success.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(`${originFromRequest(request)}${PAYSTACK_CALLBACK_PATH}${request.nextUrl.search}`);
}
