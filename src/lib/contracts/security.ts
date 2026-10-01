import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const DOSSIER_COOKIE = "studio_dossier_session";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function randomOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function evidenceHash(value: string | null): string | null {
  return value ? sha256(`${process.env.TRACKING_HASH_SALT ?? "dev-only-salt"}:${value}`) : null;
}

export function safeHashEqual(a: string, b: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function manifestHash(input: {
  dossierId: string;
  revision: number;
  briefHash: string;
  quoteHash: string;
  locale?: string;
  templateId?: string;
  templateVersion?: number;
  offerSnapshot?: unknown;
}): string {
  return sha256(JSON.stringify({
    dossier_id: input.dossierId,
    revision: input.revision,
    locale: input.locale ?? null,
    template_id: input.templateId ?? null,
    template_version: input.templateVersion ?? null,
    offer_snapshot: input.offerSnapshot ?? null,
    documents: [
      { kind: "brief", sha256: input.briefHash },
      { kind: "quote", sha256: input.quoteHash },
    ],
  }));
}
