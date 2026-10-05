import { NextResponse, type NextRequest } from "next/server";

import { getStudioDemo } from "@/lib/demos";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/[locale]/demos/[slug]/admin">,
) {
  const { locale, slug } = await params;
  const demo = getStudioDemo(slug);

  if (!demo) {
    return new NextResponse("Not found", { status: 404 });
  }

  const destination = demo.adminHref ?? `/${locale}/demos/${slug}`;

  return NextResponse.redirect(new URL(destination, request.url));
}
