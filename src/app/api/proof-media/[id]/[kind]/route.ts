import { NextResponse, type NextRequest } from "next/server";
import { getSession, repo } from "@/lib/data";
import { MEDIA_KINDS, type MediaKind } from "@/lib/proof";

/**
 * One testimonial medium. The status is checked on EVERY request: hidden,
 * rejected, withdrawn or deleted media stop working at once. Public viewers
 * get a short-lived signed URL (redirect); staff and the author may preview
 * before moderation. Videos load only when this URL is requested (on play).
 */
const notFound = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/proof-media/[id]/[kind]">) {
  const { id, kind } = await ctx.params;
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id) || !(MEDIA_KINDS as readonly string[]).includes(kind)) return notFound();
  const viewer = await getSession().catch(() => null);
  const url = await repo().resolveProofMedia(viewer, id, kind as MediaKind).catch(() => null);
  if (!url) return notFound();
  // Never cached: hiding, withdrawing or deleting must take effect on the next request.
  return NextResponse.redirect(new URL(url, _req.nextUrl.origin), { status: 302, headers: { "Cache-Control": "no-store" } });
}
