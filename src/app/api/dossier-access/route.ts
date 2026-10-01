import { NextRequest, NextResponse } from "next/server";
import { DOSSIER_COOKIE, exchangeAccessToken } from "@/lib/contracts/service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";
  const result = token && reference ? await exchangeAccessToken(reference, token) : null;
  if (!result) return NextResponse.redirect(new URL(`/${locale}/dossier/${encodeURIComponent(reference)}?invalid=1`, request.url));
  const response = NextResponse.redirect(new URL(`/${result.dossier.locale}/dossier/${encodeURIComponent(reference)}`, request.url));
  response.cookies.set(DOSSIER_COOKIE, result.sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
  return response;
}
