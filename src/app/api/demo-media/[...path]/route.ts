import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/env";
import { getSession, repo } from "@/lib/data";
import { demoMedia, putDemoMedia } from "@/lib/data/messaging.demo";

/**
 * DEMO ONLY — stands in for the private `chat-media` Storage bucket so
 * messaging media work without Supabase. 404 outside demo mode. Uploads must
 * have been announced by createAttachmentUpload (same path shape and access
 * checks as Storage); files live in memory and are capped.
 */
const notFound = () => new NextResponse(null, { status: 404 });

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/demo-media/[...path]">) {
  if (!isDemoMode) return notFound();
  const path = (await ctx.params).path.join("/");
  const s = await getSession();
  if (!s || !(await repo().getConversation(s, path.split("/")[0]))) return notFound();
  const file = demoMedia(path);
  if (!file || !file.data.length) return notFound();
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/demo-media/[...path]">) {
  if (!isDemoMode) return notFound();
  const path = (await ctx.params).path.join("/");
  const s = await getSession();
  if (!s || path.split("/")[1] !== s.userId) return notFound();
  const data = Buffer.from(await req.arrayBuffer());
  const ok = putDemoMedia(path, req.headers.get("content-type") ?? "", data);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false }, { status: 400 });
}
