/* eslint-disable @typescript-eslint/no-explicit-any -- rows are untyped until `supabase gen types` is wired in */
import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { attachmentPath, kindForMime } from "@/lib/messaging/policy";
import type { Reaction } from "@/lib/messaging/policy";
import type {
  ChatMessage, ConversationSummary, Contacts, LastMessagePreview, MessageReportRow, Participants, SupportInboxRow,
} from "@/lib/messaging/types";
import type { MessagingRepo } from "./repo";

/**
 * Messaging on Supabase. Reads go through RLS (the caller's own client);
 * writes and name lookups through the SECURITY DEFINER functions of
 * 20261002000001_messaging.sql. Media: private bucket, short signed URLs.
 */
const BUCKET = "chat-media";
const SIGNED_URL_TTL = 60 * 60;
const PAGE = 50;
const MSG_COLS = "id, conversation_id, sender_id, kind, body, attachment_path, attachment_mime, attachment_size, attachment_name, duration_ms, width, height, reply_to, client_id, created_at, edited_at, deleted_at";

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? String(res.error));
  return res.data;
}

const toPreview = (r: any): LastMessagePreview | null => r ? ({
  kind: r.kind, body: r.body ?? null, senderId: r.senderId ?? null, deleted: !!r.deleted, createdAt: r.createdAt,
}) : null;

const toSummary = (r: any): ConversationSummary => ({
  id: r.id, kind: r.kind, lastMessageAt: r.last_message_at ?? null, pinned: !!r.pinned,
  peerId: r.peer_id ?? null, peerName: r.peer_name ?? null, relationship: r.relationship ?? null,
  canSend: !!r.can_send, unread: Number(r.unread ?? 0), lastMessage: toPreview(r.last_message),
});

const toMessage = (r: any): ChatMessage => ({
  id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, kind: r.kind, body: r.body ?? null,
  attachment: r.attachment_path ? {
    path: r.attachment_path, mime: r.attachment_mime ?? "", size: Number(r.attachment_size ?? 0), name: r.attachment_name ?? null, url: null,
  } : null,
  durationMs: r.duration_ms ?? null, width: r.width ?? null, height: r.height ?? null, replyTo: r.reply_to ?? null,
  clientId: r.client_id ?? null, createdAt: r.created_at, editedAt: r.edited_at ?? null, deletedAt: r.deleted_at ?? null,
  reactions: [],
});

/** Signed URLs + reaction counts for a batch of messages (one round trip each). */
async function hydrate(sb: any, me: string, msgs: ChatMessage[]): Promise<ChatMessage[]> {
  if (!msgs.length) return msgs;
  const paths = msgs.map((m) => m.attachment?.path).filter((p): p is string => !!p);
  const [signed, reactions] = await Promise.all([
    paths.length ? sb.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL) : Promise.resolve({ data: [] }),
    sb.from("message_reactions").select("message_id, profile_id, emoji").in("message_id", msgs.map((m) => m.id)),
  ]);
  const urls = new Map<string, string>();
  for (const x of (signed.data ?? []) as any[]) if (x.path && x.signedUrl) urls.set(x.path, x.signedUrl);
  const byMsg = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const r of (reactions.data ?? []) as any[]) {
    const m = byMsg.get(r.message_id) ?? new Map();
    const e = m.get(r.emoji) ?? { count: 0, mine: false };
    e.count += 1;
    if (r.profile_id === me) e.mine = true;
    m.set(r.emoji, e);
    byMsg.set(r.message_id, m);
  }
  return msgs.map((m) => ({
    ...m,
    attachment: m.attachment ? { ...m.attachment, url: urls.get(m.attachment.path) ?? null } : null,
    reactions: [...(byMsg.get(m.id) ?? new Map()).entries()].map(([emoji, v]) => ({ emoji: emoji as Reaction, ...v })),
  }));
}

export const supabaseMessaging: MessagingRepo = {
  async listConversations() {
    const sb = await supabaseServer();
    return ((check(await sb.rpc("my_conversations")) as any[]) ?? []).map(toSummary);
  },

  async getUnreadMessageCount() {
    const sb = await supabaseServer();
    const { data, error } = await sb.rpc("my_unread_count");
    return error ? 0 : Number(data ?? 0);
  },

  async getConversation(s, conversationId) {
    const sb = await supabaseServer();
    const conv = check(await sb.from("conversations").select("id, kind, subject_profile_id").eq("id", conversationId).maybeSingle()) as any;
    if (!conv) return null;
    const [participants, rows, summaries] = await Promise.all([
      sb.rpc("conversation_participants", { p_conv: conversationId }),
      sb.from("messages").select(MSG_COLS).eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(PAGE + 1),
      sb.rpc("my_conversations"),
    ]);
    const parts = (check(participants) ?? {}) as Participants;
    const list = (check(rows) as any[]).map(toMessage);
    const mine = ((summaries.data ?? []) as any[]).map(toSummary).find((c) => c.id === conversationId);
    const staff = s.role === "super_admin" || s.role === "admin";
    const peerId = conv.kind === "direct" ? mine?.peerId ?? null : conv.kind === "support" && staff ? conv.subject_profile_id : null;
    return {
      id: conv.id, kind: conv.kind, peerId,
      peerName: conv.kind === "direct" ? mine?.peerName ?? null : peerId ? parts[peerId]?.name ?? null : null,
      relationship: mine?.relationship ?? null,
      canSend: conv.kind === "support" ? true : conv.kind === "announcements" ? staff : !!mine?.canSend,
      participants: parts,
      hasMore: list.length > PAGE,
      messages: await hydrate(sb, s.userId, list.slice(0, PAGE).reverse()),
    };
  },

  async listMessages(s, conversationId, page) {
    const sb = await supabaseServer();
    let q = sb.from("messages").select(MSG_COLS).eq("conversation_id", conversationId);
    if (page.before) q = q.lt("created_at", page.before).order("created_at", { ascending: false });
    else if (page.after) q = q.gt("created_at", page.after).order("created_at", { ascending: true });
    else q = q.order("created_at", { ascending: false });
    const list = (check(await q.limit(PAGE)) as any[]).map(toMessage);
    return hydrate(sb, s.userId, page.after ? list : list.reverse());
  },

  async getMessage(s, messageId) {
    const sb = await supabaseServer();
    const row = check(await sb.from("messages").select(MSG_COLS).eq("id", messageId).maybeSingle());
    return row ? (await hydrate(sb, s.userId, [toMessage(row)]))[0] : null;
  },

  async openDirectConversation(_s, profileId) {
    const sb = await supabaseServer();
    return check(await sb.rpc("open_direct_conversation", { p_other: profileId })) as string;
  },

  async openSupportConversation(_s, profileId) {
    const sb = await supabaseServer();
    return check(await sb.rpc("open_support_conversation", { p_subject: profileId ?? null })) as string;
  },

  async getAnnouncementsConversationId() {
    const sb = await supabaseServer();
    return (check(await sb.rpc("announcements_conversation_id")) as string | null) ?? null;
  },

  async sendMessage(s, i) {
    const sb = await supabaseServer();
    const row = check(await sb.rpc("send_message", {
      p_conv: i.conversationId, p_kind: i.kind, p_body: i.body ?? null,
      p_attachment_path: i.attachmentPath ?? null, p_attachment_mime: i.attachmentMime ?? null,
      p_attachment_size: i.attachmentSize ?? null, p_attachment_name: i.attachmentName ?? null,
      p_duration_ms: i.durationMs ?? null, p_width: i.width ?? null, p_height: i.height ?? null,
      p_reply_to: i.replyTo ?? null, p_client_id: i.clientId ?? null,
    }));
    return (await hydrate(sb, s.userId, [toMessage(row)]))[0];
  },

  async markConversationRead(_s, conversationId) {
    const sb = await supabaseServer();
    check(await sb.rpc("mark_conversation_read", { p_conv: conversationId }));
  },

  async editMessage(_s, messageId, body) {
    const sb = await supabaseServer();
    check(await sb.rpc("edit_message", { p_message: messageId, p_body: body }));
  },

  async deleteMessage(_s, messageId) {
    const sb = await supabaseServer();
    const path = check(await sb.rpc("delete_message", { p_message: messageId })) as string | null;
    if (path) await sb.storage.from(BUCKET).remove([path]);
  },

  async reactToMessage(_s, messageId, emoji) {
    const sb = await supabaseServer();
    check(await sb.rpc("react_to_message", { p_message: messageId, p_emoji: emoji }));
  },

  async createAttachmentUpload(s, conversationId, mime) {
    if (!kindForMime(mime)) throw new Error("messaging.invalid_attachment");
    const sb = await supabaseServer();
    const path = attachmentPath(conversationId, s.userId, randomUUID().replaceAll("-", ""), mime);
    // The storage insert policy re-checks that the caller can access the conversation.
    const data = check(await sb.storage.from(BUCKET).createSignedUploadUrl(path)) as { signedUrl: string };
    return { path, uploadUrl: data.signedUrl };
  },

  async listContacts() {
    const sb = await supabaseServer();
    const c = (check(await sb.rpc("my_contacts")) ?? {}) as any;
    return {
      canUseDirect: !!c.canUseDirect, sponsor: c.sponsor ?? null, recruits: c.recruits ?? [], friends: c.friends ?? [],
      incoming: c.incoming ?? [], outgoing: c.outgoing ?? [], blocked: c.blocked ?? [],
    } satisfies Contacts;
  },

  async requestFriend(_s, code) {
    const sb = await supabaseServer();
    return check(await sb.rpc("request_friend", { p_code: code })) as any;
  },

  async respondFriend(_s, friendshipId, accept) {
    const sb = await supabaseServer();
    check(await sb.rpc("respond_friend", { p_friendship: friendshipId, p_accept: accept }));
  },

  async removeFriend(_s, profileId) {
    const sb = await supabaseServer();
    check(await sb.rpc("remove_friend", { p_other: profileId }));
  },

  async blockProfile(_s, profileId) {
    const sb = await supabaseServer();
    check(await sb.rpc("block_profile", { p_other: profileId }));
  },

  async unblockProfile(_s, profileId) {
    const sb = await supabaseServer();
    check(await sb.rpc("unblock_profile", { p_other: profileId }));
  },

  async reportMessage(_s, messageId, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("report_message", { p_message: messageId, p_reason: reason }));
  },

  async listSupportInbox() {
    const sb = await supabaseServer();
    return ((check(await sb.rpc("staff_support_inbox")) as any[]) ?? []).map((r): SupportInboxRow => ({
      id: r.id, subjectId: r.subject_id, subjectName: r.subject_name ?? null, subjectStatus: r.subject_status ?? null,
      lastMessageAt: r.last_message_at ?? null, lastMessage: toPreview(r.last_message), unread: Number(r.unread ?? 0),
    }));
  },

  async listMessageReports() {
    const sb = await supabaseServer();
    return ((check(await sb.rpc("staff_list_reports")) as any[]) ?? []) as MessageReportRow[];
  },

  async openMessageReport(s, reportId) {
    const sb = await supabaseServer();
    const r = check(await sb.rpc("staff_open_report", { p_report: reportId })) as any;
    const msgs = ((r.messages ?? []) as any[]).map(toMessage);
    // Staff have no storage read access to private conversations: show the
    // reported context as text + file metadata only.
    return { reportedId: r.reportedId, participants: r.participants ?? {}, messages: msgs.map((m) => ({ ...m, reactions: [] })) };
  },

  async moderateMessageReport(_s, reportId, action, reason) {
    const sb = await supabaseServer();
    const path = check(await sb.rpc("staff_moderate_report", { p_report: reportId, p_action: action, p_reason: reason })) as string | null;
    if (path) {
      // The sender's file: removed with the service role (staff do not own it).
      await supabaseService().storage.from(BUCKET).remove([path]);
    }
  },
};
