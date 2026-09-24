import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import {
  REF_COOKIE, REF_COOKIE_MAX_AGE, VISITOR_COOKIE, decodeRefCookie, encodeRefCookie, recordTouch,
  looksLikeBot, deviceType, utmFromSearchParams, type Touch,
} from "@/lib/attribution";
import { env } from "@/lib/env";
import { repo } from "@/lib/data";
import type { ReferralTarget } from "@/lib/data/types";

/** Salted daily hash: lets us spot abnormal patterns without storing raw IPs. */
function dailyHash(value: string | null) {
  if (!value) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${env.trackingSalt}:${day}:${value}`).digest("hex").slice(0, 32);
}

export interface TrackOptions {
  target: ReferralTarget;
  privatePageId?: string | null;
  privatePageSlug?: string | null;
  landingPath: string;
}

/**
 * Records a referral click and writes the attribution cookies on `res`.
 * Inactive (pending / suspended) affiliates are not credited.
 */
export async function trackReferral(req: NextRequest, res: NextResponse, opts: TrackOptions) {
  const { target } = opts;
  const ua = req.headers.get("user-agent");
  const isBot = looksLikeBot(ua);
  let visitorId = req.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId || !/^[0-9a-f-]{36}$/.test(visitorId)) visitorId = randomUUID();

  const cookieOpts = { path: "/", maxAge: REF_COOKIE_MAX_AGE, sameSite: "lax" as const, httpOnly: true, secure: req.nextUrl.protocol === "https:" };
  res.cookies.set(VISITOR_COOKIE, visitorId, cookieOpts);

  if (!target.active || isBot) return;

  const utm = utmFromSearchParams(req.nextUrl.searchParams);
  const touch: Touch = {
    ref: target.affiliateCode,
    link: target.linkCode ?? undefined,
    page: opts.privatePageSlug ?? undefined,
    at: new Date().toISOString(),
    utm,
  };
  const next = recordTouch(decodeRefCookie(req.cookies.get(REF_COOKIE)?.value), touch);
  res.cookies.set(REF_COOKIE, encodeRefCookie(next), cookieOpts);

  let referrerHost: string | null = null;
  try {
    const r = req.headers.get("referer");
    referrerHost = r ? new URL(r).host : null;
  } catch {}

  await repo().recordClick({
    affiliateId: target.affiliateId,
    linkId: target.linkId,
    campaignId: target.campaignId,
    privatePageId: opts.privatePageId ?? null,
    visitorId,
    landingPath: opts.landingPath.slice(0, 300),
    utm: (utm ?? {}) as Record<string, string>,
    referrerHost,
    country: req.headers.get("x-vercel-ip-country"),
    deviceType: deviceType(ua),
    ipHash: dailyHash(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null),
    uaHash: dailyHash(ua),
    isBot,
  });
}
