"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import { HELP_CATEGORIES, HELP_STATUSES, HELP_URGENCIES } from "@/lib/data/types";
import { kickEmailOutbox } from "@/lib/email/service";
import { log } from "@/lib/log";
import type { AdminState } from "./admin";

export type HelpState = { ok?: boolean; ref?: string; error?: "invalid" | "rate_limited" | "generic" };

const optionalId = z.string().trim().max(100).transform((v) => v || null).nullable().optional();
const input = z.object({
  category: z.enum(HELP_CATEGORIES),
  urgency: z.enum(HELP_URGENCIES),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  prospectId: optionalId,
  dossierId: optionalId,
  pagePath: z.string().trim().max(300).regex(/^\/[\w\-/[\]?=&.%]*$/).nullable().optional().catch(null),
});

/** Affiliate → Studio ATS team. The database adds the account snapshot and queues one email per staff member. */
export async function submitHelpRequest(_: HelpState, f: FormData): Promise<HelpState> {
  const s = await getSession();
  if (!s?.affiliate) return { error: "generic" };
  const parsed = input.safeParse({
    category: f.get("category"), urgency: f.get("urgency"), subject: f.get("subject"), message: f.get("message"),
    prospectId: f.get("prospectId") ?? null, dossierId: f.get("dossierId") ?? null, pagePath: f.get("pagePath") || null,
  });
  if (!parsed.success) return { error: "invalid" };
  try {
    const { ref } = await repo().submitHelpRequest(s, parsed.data);
    kickEmailOutbox();
    revalidatePath("/[locale]/dashboard/help", "page");
    revalidatePath("/[locale]/admin", "layout");
    return { ok: true, ref };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("help.rate_limited")) return { error: "rate_limited" };
    log.error("help", "submit failed", { error: message });
    return { error: "generic" };
  }
}

/** Staff: take / resolve / close / reopen a request (audited, notifies the affiliate). */
export async function updateHelpRequest(_: AdminState, f: FormData): Promise<AdminState> {
  const s = await getSession();
  if (!isStaff(s)) throw new Error("Forbidden");
  try {
    const id = z.string().min(1).max(100).parse(f.get("id"));
    const status = z.enum(HELP_STATUSES).parse(f.get("status"));
    const note = z.string().trim().max(2000).parse(f.get("note") ?? "");
    await repo().adminUpdateHelpRequest(s!, id, status, note || null);
    revalidatePath("/[locale]/admin", "layout");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "error" };
  }
}
