"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import type { Session } from "@/lib/data/types";
import { REACTIONS, messagingErrorCode, type MessagingError } from "@/lib/messaging/policy";
import type {
  ChatMessage, FriendRequestResult, ModerationAction, OpenedReport, UploadTarget,
} from "@/lib/messaging/types";

/**
 * Messaging server actions. The sender is always the server session; the
 * database functions re-check every rule (see 20261002000001_messaging.sql).
 * Errors come back as stable codes the UI translates (t.msg.errors).
 */
type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: MessagingError | "generic" };

async function session(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}
const isStaff = (s: Session) => s.role === "super_admin" || s.role === "admin";

async function run<T>(fn: (s: Session) => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn(await session()) };
  } catch (e) {
    const code = messagingErrorCode(e instanceof Error ? e.message : String(e));
    if (!code) console.error("[messaging]", e);
    return { ok: false, error: code ?? "generic" };
  }
}

const refreshContacts = () => revalidatePath("/[locale]/dashboard/messages", "layout");
/** Lists + unread badges live in the dashboard / admin layouts. */
const refreshInbox = () => {
  revalidatePath("/[locale]/dashboard", "layout");
  revalidatePath("/[locale]/admin", "layout");
};

const id = z.string().min(1).max(64);
const sendSchema = z.object({
  conversationId: id,
  kind: z.enum(["text", "image", "video", "audio", "file"]),
  body: z.string().max(4000).nullish(),
  attachmentPath: z.string().max(300).nullish(),
  attachmentMime: z.string().max(100).nullish(),
  attachmentSize: z.number().int().min(0).nullish(),
  attachmentName: z.string().max(200).nullish(),
  durationMs: z.number().int().min(0).max(600_000).nullish(),
  width: z.number().int().min(0).max(20_000).nullish(),
  height: z.number().int().min(0).max(20_000).nullish(),
  replyTo: id.nullish(),
  clientId: z.uuid().nullish(),
});

export async function sendMessage(input: z.input<typeof sendSchema>): Promise<Result<ChatMessage>> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_kind" };
  return run((s) => repo().sendMessage(s, parsed.data));
}

export async function createUpload(conversationId: string, mime: string): Promise<Result<UploadTarget>> {
  return run((s) => repo().createAttachmentUpload(s, id.parse(conversationId), z.string().max(100).parse(mime)));
}

export async function fetchMessages(conversationId: string, page: { before?: string; after?: string }): Promise<Result<ChatMessage[]>> {
  const p = z.object({ before: z.string().max(40).optional(), after: z.string().max(40).optional() }).parse(page);
  return run((s) => repo().listMessages(s, id.parse(conversationId), p));
}

export async function fetchMessage(messageId: string): Promise<Result<ChatMessage | null>> {
  return run((s) => repo().getMessage(s, id.parse(messageId)));
}

export async function markRead(conversationId: string): Promise<Result> {
  const r = await run(async (s) => { await repo().markConversationRead(s, id.parse(conversationId)); return undefined; });
  refreshInbox();
  return r;
}

export async function unreadCount(): Promise<number> {
  const s = await getSession();
  return s ? repo().getUnreadMessageCount(s) : 0;
}

export async function editMessage(messageId: string, body: string): Promise<Result> {
  return run(async (s) => { await repo().editMessage(s, id.parse(messageId), z.string().max(4000).parse(body)); return undefined; });
}

export async function deleteMessage(messageId: string): Promise<Result> {
  return run(async (s) => { await repo().deleteMessage(s, id.parse(messageId)); return undefined; });
}

export async function react(messageId: string, emoji: string): Promise<Result> {
  return run(async (s) => { await repo().reactToMessage(s, id.parse(messageId), z.enum(REACTIONS).parse(emoji)); return undefined; });
}

export async function reportMessage(messageId: string, reason: string): Promise<Result> {
  return run(async (s) => { await repo().reportMessage(s, id.parse(messageId), z.string().trim().min(1).max(1000).parse(reason)); return undefined; });
}

export async function openDirect(profileId: string): Promise<Result<string>> {
  return run((s) => repo().openDirectConversation(s, id.parse(profileId)));
}

export async function openSupport(profileId?: string): Promise<Result<string>> {
  return run((s) => repo().openSupportConversation(s, profileId ? id.parse(profileId) : undefined));
}

// ------------------------------------------------------------------ contacts
export async function requestFriend(code: string): Promise<Result<FriendRequestResult>> {
  const r = await run((s) => repo().requestFriend(s, z.string().trim().min(1).max(40).parse(code)));
  refreshContacts();
  return r;
}

export async function respondFriend(friendshipId: string, accept: boolean): Promise<Result> {
  const r = await run(async (s) => { await repo().respondFriend(s, id.parse(friendshipId), !!accept); return undefined; });
  refreshContacts();
  return r;
}

export async function removeFriend(profileId: string): Promise<Result> {
  const r = await run(async (s) => { await repo().removeFriend(s, id.parse(profileId)); return undefined; });
  refreshContacts();
  return r;
}

export async function blockProfile(profileId: string): Promise<Result> {
  const r = await run(async (s) => { await repo().blockProfile(s, id.parse(profileId)); return undefined; });
  refreshContacts();
  return r;
}

export async function unblockProfile(profileId: string): Promise<Result> {
  const r = await run(async (s) => { await repo().unblockProfile(s, id.parse(profileId)); return undefined; });
  refreshContacts();
  return r;
}

// ------------------------------------------------------------------ staff
export async function openReport(reportId: string): Promise<Result<OpenedReport>> {
  return run((s) => {
    if (!isStaff(s)) throw new Error("messaging.not_allowed");
    return repo().openMessageReport(s, id.parse(reportId));
  });
}

export async function moderateReport(reportId: string, action: ModerationAction, reason: string): Promise<Result> {
  const r = await run(async (s) => {
    if (!isStaff(s)) throw new Error("messaging.not_allowed");
    await repo().moderateMessageReport(s, id.parse(reportId), z.enum(["dismiss", "delete_message", "mute_sender"]).parse(action),
      z.string().trim().max(500).parse(reason) || null);
    return undefined;
  });
  revalidatePath("/[locale]/admin/messages", "layout");
  return r;
}
