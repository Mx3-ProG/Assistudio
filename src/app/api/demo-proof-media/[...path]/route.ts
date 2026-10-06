import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/env";
import { demoProofMedia, putDemoProofMedia } from "@/lib/data/proof.demo";

/**
 * DEMO ONLY — stands in for the private `testimonial-media` bucket. 404
 * outside demo mode. Uploads must have been announced by create*Upload (same
 * path rules as Storage); files live in memory and are capped. Reads go
 * through /api/proof-media, which checks the testimonial's status first.
 */
const notFound = () => new NextResponse(null, { status: 404 });

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/demo-proof-media/[...path]">) {
  if (!isDemoMode) return notFound();
  const file = demoProofMedia((await ctx.params).path.join("/"));
  if (!file) return notFound();
  return new NextResponse(new Uint8Array(file.data), {
    headers: { "Content-Type": file.mime, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/demo-proof-media/[...path]">) {
  if (!isDemoMode) return notFound();
  const ok = putDemoProofMedia((await ctx.params).path.join("/"), req.headers.get("content-type") ?? "", Buffer.from(await req.arrayBuffer()));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false }, { status: 400 });
}
