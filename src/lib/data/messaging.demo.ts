import "server-only";
import { randomUUID } from "node:crypto";
import {
  MESSAGE_LIMITS, REACTIONS, attachmentPath, baseMime, canEdit, canMessage, checkAttachment, isValidAttachmentPath, kindForMime,
  type ConversationKind, type Party, type Relationship,
} from "@/lib/messaging/policy";
import type {
  ChatMessage, Contacts, ConversationSummary, LastMessagePreview, MessageReportRow, Participants,
} from "@/lib/messaging/types";
import type { MessagingRepo } from "./repo";
import type { AffiliateStatus, Role, Session } from "./types";

/**
 * DEMO messaging — development only, in memory, fake data flagged as such.
 * Same rules as the SQL (via src/lib/messaging/policy.ts). No Realtime: the
 * UI polls in demo mode. Uploaded files live in memory, capped, and are served
 * by the dev-only route /api/demo-media.
 */

export interface DemoPeople {
  users: { userId: string; role: Role; fullName: string; displayName: string | null; affiliateId: string | null }[];
  affiliates: { id: string; userId: string; code: string; slug: string | null; status: AffiliateStatus; sponsorId: string | null }[];
}

interface Conv { id: string; kind: ConversationKind; directKey: string | null; subjectId: string | null; createdAt: string; lastMessageAt: string | null }
interface Member { conversationId: string; profileId: string; lastReadAt: string | null }
interface Msg {
  id: string; conversationId: string; senderId: string | null; kind: ChatMessage["kind"]; body: string | null;
  attachmentPath: string | null; attachmentMime: string | null; attachmentSize: number | null; attachmentName: string | null;
  durationMs: number | null; width: number | null; height: number | null; replyTo: string | null; clientId: string | null;
  createdAt: string; editedAt: string | null; deletedAt: string | null;
}
interface Friendship { id: string; requesterId: string; addresseeId: string; status: "pending" | "accepted" | "declined"; createdAt: string; respondedAt: string | null }
interface Report { id: string; messageId: string; reporterId: string; reason: string; status: MessageReportRow["status"]; createdAt: string; reviewedAt: string | null }
interface MsgStore {
  v: number;
  convs: Conv[]; members: Member[]; messages: Msg[]; friendships: Friendship[];
  blocks: { blockerId: string; blockedId: string }[];
  reactions: { messageId: string; profileId: string; emoji: string }[];
  reports: Report[];
  muted: Record<string, string>;
  media: Map<string, { mime: string; data: Buffer }>;
}

const STORE_VERSION = 1;
const MEDIA_BUDGET = 100 * 1024 * 1024;
const PAGE = 50;
const g = globalThis as unknown as { __studioDemoMessaging?: MsgStore };
const iso = (t = Date.now()) => new Date(t).toISOString();
const uid = () => randomUUID();
const fail = (code: string): never => { throw new Error(`messaging.${code}`); };

/** Bytes of an uploaded demo file (dev-only route). */
export function demoMedia(path: string) {
  return g.__studioDemoMessaging?.media.get(path) ?? null;
}

/** Stores a demo upload if the caller announced it (createAttachmentUpload) and it fits. */
export function putDemoMedia(path: string, mime: string, data: Buffer): boolean {
  const st = g.__studioDemoMessaging;
  if (!st || !st.media.has(path) || st.media.get(path)!.data.length > 0) return false;
  const kind = kindForMime(mime);
  if (!kind || data.length > MESSAGE_LIMITS.maxSize[kind]) return false;
  const used = [...st.media.values()].reduce((a, x) => a + x.data.length, 0);
  if (used + data.length > MEDIA_BUDGET) return false;
  st.media.set(path, { mime: baseMime(mime), data });
  return true;
}

export function createDemoMessaging(people: () => DemoPeople, audit: (s: Session, action: string, entityId: string, reason: string | null) => void): MessagingRepo {
  const isStaff = (p: string) => { const u = people().users.find((x) => x.userId === p); return u?.role === "super_admin" || u?.role === "admin"; };
  const affOf = (p: string) => people().affiliates.find((a) => a.userId === p) ?? null;
  const nameOf = (p: string | null) => {
    const u = p ? people().users.find((x) => x.userId === p) : null;
    return u ? (u.displayName || u.fullName || null) : null;
  };
  const party = (p: string): Party => ({ id: p, staff: isStaff(p), approvedAffiliate: affOf(p)?.status === "approved", deleted: !people().users.some((u) => u.userId === p) });
  const blocked = (a: string, b: string) => db().blocks.some((x) => (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a));
  const relationship = (a: string, b: string): Relationship | null => {
    const fa = affOf(a), fb = affOf(b);
    if (fa && fb && fa.sponsorId === fb.id) return "sponsor";
    if (fa && fb && fb.sponsorId === fa.id) return "recruit";
    const f = db().friendships.find((x) => x.status === "accepted" && [x.requesterId, x.addresseeId].includes(a) && [x.requesterId, x.addresseeId].includes(b));
    return f ? "friend" : null;
  };
  const allowed = (a: string, b: string) => canMessage(party(a), party(b), { blocked: blocked(a, b), relationship: relationship(a, b) });

  function db(): MsgStore {
    if (g.__studioDemoMessaging?.v !== STORE_VERSION) g.__studioDemoMessaging = seed();
    return g.__studioDemoMessaging;
  }

  function seed(): MsgStore {
    const st: MsgStore = { v: STORE_VERSION, convs: [], members: [], messages: [], friendships: [], blocks: [], reactions: [], reports: [], muted: {}, media: new Map() };
    const t = (minAgo: number) => iso(Date.now() - minAgo * 60_000);
    const add = (conversationId: string, senderId: string, body: string, minAgo: number) => {
      const createdAt = t(minAgo);
      st.messages.push({ id: uid(), conversationId, senderId, kind: "text", body, attachmentPath: null, attachmentMime: null, attachmentSize: null,
        attachmentName: null, durationMs: null, width: null, height: null, replyTo: null, clientId: null, createdAt, editedAt: null, deletedAt: null });
      const c = st.convs.find((x) => x.id === conversationId)!;
      if (!c.lastMessageAt || c.lastMessageAt < createdAt) c.lastMessageAt = createdAt;
    };
    const ann: Conv = { id: uid(), kind: "announcements", directKey: null, subjectId: null, createdAt: t(9000), lastMessageAt: null };
    const sup: Conv = { id: uid(), kind: "support", directKey: null, subjectId: "usr_mathieu", createdAt: t(3000), lastMessageAt: null };
    const dm: Conv = { id: uid(), kind: "direct", directKey: ["usr_alex", "usr_mathieu"].sort().join(":"), subjectId: null, createdAt: t(2000), lastMessageAt: null };
    st.convs.push(ann, sup, dm);
    st.members.push({ conversationId: dm.id, profileId: "usr_mathieu", lastReadAt: t(500) }, { conversationId: dm.id, profileId: "usr_alex", lastReadAt: t(1) });
    st.members.push({ conversationId: sup.id, profileId: "usr_mathieu", lastReadAt: t(2) });
    add(ann.id, "usr_admin", "[Demo] Welcome to Studio ATS messaging. Announcements from the team appear here.", 4000);
    add(sup.id, "usr_mathieu", "[Demo] Hi, when is the next payout run?", 2900);
    add(sup.id, "usr_admin", "[Demo] Payouts are created after the validation period — check Payouts for the schedule.", 2800);
    add(dm.id, "usr_alex", "[Demo] Thanks for the sales kit tips yesterday!", 1900);
    add(dm.id, "usr_mathieu", "[Demo] Anytime — the architects script works well.", 1800);
    add(dm.id, "usr_alex", "[Demo] Signed my second client this morning.", 60);
    st.friendships.push({ id: uid(), requesterId: "usr_marc", addresseeId: "usr_mathieu", status: "pending", createdAt: t(300), respondedAt: null });
    return st;
  }

  const conv = (id: string) => db().convs.find((c) => c.id === id) ?? null;
  const member = (c: string, p: string) => db().members.find((m) => m.conversationId === c && m.profileId === p) ?? null;
  const canAccess = (s: Session, c: Conv | null): c is Conv => {
    if (!c) return false;
    if (c.kind === "direct") return !!member(c.id, s.userId);
    if (c.kind === "support") return c.subjectId === s.userId || isStaff(s.userId);
    return isStaff(s.userId) || affOf(s.userId)?.status === "approved";
  };
  const otherMember = (c: Conv, me: string) => db().members.find((m) => m.conversationId === c.id && m.profileId !== me)?.profileId ?? null;
  const markRead = (c: string, p: string, at = iso()) => {
    const m = member(c, p);
    if (m) m.lastReadAt = at; else db().members.push({ conversationId: c, profileId: p, lastReadAt: at });
  };

  const toMessage = (m: Msg, me: string): ChatMessage => {
    const counts = new Map<string, { count: number; mine: boolean }>();
    for (const r of db().reactions.filter((x) => x.messageId === m.id)) {
      const e = counts.get(r.emoji) ?? { count: 0, mine: false };
      e.count += 1;
      if (r.profileId === me) e.mine = true;
      counts.set(r.emoji, e);
    }
    return {
      id: m.id, conversationId: m.conversationId, senderId: m.senderId, kind: m.kind, body: m.body,
      attachment: m.attachmentPath ? { path: m.attachmentPath, mime: m.attachmentMime ?? "", size: m.attachmentSize ?? 0, name: m.attachmentName,
        url: `/api/demo-media/${m.attachmentPath}` } : null,
      durationMs: m.durationMs, width: m.width, height: m.height, replyTo: m.replyTo, clientId: m.clientId,
      createdAt: m.createdAt, editedAt: m.editedAt, deletedAt: m.deletedAt,
      reactions: [...counts.entries()].map(([emoji, v]) => ({ emoji: emoji as ChatMessage["reactions"][number]["emoji"], ...v })),
    };
  };
  const preview = (c: string): LastMessagePreview | null => {
    const m = db().messages.filter((x) => x.conversationId === c).at(-1);
    return m ? { kind: m.kind, body: m.body?.slice(0, 140) ?? null, senderId: m.senderId, deleted: !!m.deletedAt, createdAt: m.createdAt } : null;
  };
  const participants = (c: Conv): Participants => {
    const ids = new Set<string>([...db().messages.filter((m) => m.conversationId === c.id && m.senderId).map((m) => m.senderId!),
      ...db().members.filter((m) => m.conversationId === c.id).map((m) => m.profileId), ...(c.subjectId ? [c.subjectId] : [])]);
    return Object.fromEntries([...ids].map((p) => [p, { name: nameOf(p), staff: isStaff(p) }]));
  };
  const sorted = (c: string) => db().messages.filter((m) => m.conversationId === c).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const summaries = (s: Session): ConversationSummary[] => {
    const me = s.userId;
    const created = "1970-01-01T00:00:00.000Z";
    return db().convs.filter((c) => (c.kind === "direct" && member(c.id, me)) || (c.kind === "support" && c.subjectId === me) || (c.kind === "announcements" && canAccess(s, c)))
      .map((c) => {
        const peer = c.kind === "direct" ? otherMember(c, me) : null;
        const read = member(c.id, me)?.lastReadAt ?? created;
        return {
          id: c.id, kind: c.kind, lastMessageAt: c.lastMessageAt, pinned: c.kind === "announcements",
          peerId: peer, peerName: nameOf(peer), relationship: peer ? relationship(me, peer) : null,
          canSend: c.kind === "direct" ? !!peer && allowed(me, peer) : c.kind === "support" || isStaff(me),
          unread: db().messages.filter((m) => m.conversationId === c.id && !m.deletedAt && m.senderId !== me && m.createdAt > read).length,
          lastMessage: preview(c.id),
        };
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
  };
  const mustStaff = (s: Session) => { if (!isStaff(s.userId)) fail("not_allowed"); };
  const unfriend = (a: string, b: string) => {
    const st = db();
    st.friendships = st.friendships.filter((f) => !([f.requesterId, f.addresseeId].includes(a) && [f.requesterId, f.addresseeId].includes(b)));
  };
  const contact = (me: string, p: string) => ({ profileId: p, name: nameOf(p), canMessage: allowed(me, p) });

  return {
    async listConversations(s) { return summaries(s); },
    async getUnreadMessageCount(s) { return summaries(s).reduce((a, c) => a + c.unread, 0); },

    async getConversation(s, id) {
      const c = conv(id);
      if (!canAccess(s, c)) return null;
      const all = sorted(id);
      const sum = summaries(s).find((x) => x.id === id);
      const peerId = c.kind === "direct" ? otherMember(c, s.userId) : c.kind === "support" && isStaff(s.userId) ? c.subjectId : null;
      return {
        id, kind: c.kind, peerId, peerName: nameOf(peerId), relationship: sum?.relationship ?? null,
        canSend: c.kind === "support" ? true : c.kind === "announcements" ? isStaff(s.userId) : !!sum?.canSend,
        participants: participants(c), hasMore: all.length > PAGE,
        messages: all.slice(-PAGE).map((m) => toMessage(m, s.userId)),
      };
    },

    async listMessages(s, id, page) {
      if (!canAccess(s, conv(id))) fail("not_allowed");
      const all = sorted(id);
      const list = page.before ? all.filter((m) => m.createdAt < page.before!).slice(-PAGE)
        : page.after ? all.filter((m) => m.createdAt > page.after!).slice(0, PAGE) : all.slice(-PAGE);
      return list.map((m) => toMessage(m, s.userId));
    },

    async getMessage(s, id) {
      const m = db().messages.find((x) => x.id === id);
      return m && canAccess(s, conv(m.conversationId)) ? toMessage(m, s.userId) : null;
    },

    async openDirectConversation(s, other) {
      if (!allowed(s.userId, other)) fail("not_allowed");
      const key = [s.userId, other].sort().join(":");
      let c = db().convs.find((x) => x.directKey === key);
      if (!c) {
        c = { id: uid(), kind: "direct", directKey: key, subjectId: null, createdAt: iso(), lastMessageAt: null };
        db().convs.push(c);
      }
      for (const p of [s.userId, other]) if (!member(c.id, p)) db().members.push({ conversationId: c.id, profileId: p, lastReadAt: null });
      return c.id;
    },

    async openSupportConversation(s, profileId) {
      const subj = profileId ?? s.userId;
      if (subj !== s.userId && !isStaff(s.userId)) fail("not_allowed");
      let c = db().convs.find((x) => x.kind === "support" && x.subjectId === subj);
      if (!c) {
        c = { id: uid(), kind: "support", directKey: null, subjectId: subj, createdAt: iso(), lastMessageAt: null };
        db().convs.push(c);
      }
      return c.id;
    },

    async getAnnouncementsConversationId() {
      return db().convs.find((c) => c.kind === "announcements")?.id ?? null;
    },

    async sendMessage(s, i) {
      const me = s.userId;
      if (i.clientId) {
        const prev = db().messages.find((m) => m.senderId === me && m.clientId === i.clientId);
        if (prev) return toMessage(prev, me);
      }
      const c = conv(i.conversationId);
      if (!canAccess(s, c)) return fail("not_allowed");
      if (c.kind === "announcements" && !isStaff(me)) fail("not_allowed");
      if (c.kind === "direct") { const o = otherMember(c, me); if (!o || !allowed(me, o)) fail("not_allowed"); }
      if (c.kind !== "support" && db().muted[me] && db().muted[me] > iso()) fail("muted");
      const recent = db().messages.filter((m) => m.senderId === me && m.createdAt > iso(Date.now() - MESSAGE_LIMITS.burst.windowMs)).length;
      if (recent >= MESSAGE_LIMITS.burst.count) fail("rate_limited");
      const body = i.body?.trim() || null;
      if (body && body.length > MESSAGE_LIMITS.bodyMaxChars) fail("empty");
      let mime: string | null = null, size: number | null = null;
      if (i.kind === "text") {
        if (!body) fail("empty");
      } else {
        const path = i.attachmentPath ?? "";
        if (!isValidAttachmentPath(path, c.id, me)) fail("invalid_attachment");
        const file = db().media.get(path);
        if (!file || !file.data.length) fail("invalid_attachment");
        mime = file!.mime; size = file!.data.length;
        const chk = checkAttachment({ mime, size, durationMs: i.durationMs });
        if (!chk.ok) fail(chk.error === "unsupported" ? "invalid_attachment" : chk.error);
        if (chk.ok && chk.kind !== i.kind) fail("invalid_attachment");
      }
      if (i.replyTo && !db().messages.some((m) => m.id === i.replyTo && m.conversationId === c.id)) fail("invalid_reply");
      const m: Msg = {
        id: uid(), conversationId: c.id, senderId: me, kind: i.kind, body,
        attachmentPath: i.kind === "text" ? null : i.attachmentPath!, attachmentMime: mime, attachmentSize: size,
        attachmentName: i.kind === "text" ? null : i.attachmentName?.slice(0, 200) ?? null,
        durationMs: i.durationMs ?? null, width: i.width ?? null, height: i.height ?? null, replyTo: i.replyTo ?? null,
        clientId: i.clientId ?? null, createdAt: iso(), editedAt: null, deletedAt: null,
      };
      db().messages.push(m);
      c.lastMessageAt = m.createdAt;
      markRead(c.id, me, m.createdAt);
      return toMessage(m, me);
    },

    async markConversationRead(s, id) {
      if (!canAccess(s, conv(id))) fail("not_allowed");
      markRead(id, s.userId);
    },

    async editMessage(s, id, body) {
      const m = db().messages.find((x) => x.id === id);
      if (!m || !canEdit(m, s.userId)) return fail("not_allowed");
      if (!body.trim()) fail("empty");
      m.body = body.trim(); m.editedAt = iso();
    },

    async deleteMessage(s, id) {
      const m = db().messages.find((x) => x.id === id);
      if (!m || m.senderId !== s.userId) return fail("not_allowed");
      if (m.attachmentPath) db().media.delete(m.attachmentPath);
      Object.assign(m, { deletedAt: iso(), body: null, attachmentPath: null, attachmentMime: null, attachmentSize: null, attachmentName: null });
    },

    async reactToMessage(s, id, emoji) {
      const m = db().messages.find((x) => x.id === id && !x.deletedAt);
      if (!m || !canAccess(s, conv(m.conversationId)) || !(REACTIONS as readonly string[]).includes(emoji)) return fail("not_allowed");
      const i = db().reactions.findIndex((r) => r.messageId === id && r.profileId === s.userId && r.emoji === emoji);
      if (i >= 0) db().reactions.splice(i, 1); else db().reactions.push({ messageId: id, profileId: s.userId, emoji });
    },

    async createAttachmentUpload(s, id, mime) {
      if (!canAccess(s, conv(id)) || !kindForMime(mime)) fail("invalid_attachment");
      const path = attachmentPath(id, s.userId, randomUUID().replaceAll("-", ""), mime);
      db().media.set(path, { mime: baseMime(mime), data: Buffer.alloc(0) });
      return { path, uploadUrl: `/api/demo-media/${path}` };
    },

    async listContacts(s): Promise<Contacts> {
      const me = s.userId;
      const mine = affOf(me);
      const sponsor = mine?.sponsorId ? people().affiliates.find((a) => a.id === mine.sponsorId) : null;
      const fr = db().friendships;
      return {
        canUseDirect: isStaff(me) || mine?.status === "approved",
        sponsor: sponsor ? contact(me, sponsor.userId) : null,
        recruits: mine ? people().affiliates.filter((a) => a.sponsorId === mine.id).map((a) => contact(me, a.userId)) : [],
        friends: fr.filter((f) => f.status === "accepted" && [f.requesterId, f.addresseeId].includes(me))
          .map((f) => contact(me, f.requesterId === me ? f.addresseeId : f.requesterId)),
        incoming: fr.filter((f) => f.status === "pending" && f.addresseeId === me && !blocked(me, f.requesterId))
          .map((f) => ({ id: f.id, profileId: f.requesterId, name: nameOf(f.requesterId), createdAt: f.createdAt })),
        outgoing: fr.filter((f) => f.status === "pending" && f.requesterId === me)
          .map((f) => ({ id: f.id, profileId: f.addresseeId, name: nameOf(f.addresseeId), createdAt: f.createdAt })),
        blocked: db().blocks.filter((b) => b.blockerId === me).map((b) => ({ profileId: b.blockedId, name: nameOf(b.blockedId) })),
      };
    },

    async requestFriend(s, code) {
      const me = s.userId;
      if (affOf(me)?.status !== "approved") return "not_allowed";
      const v = code.trim().toLowerCase();
      const target = people().affiliates.find((a) => a.status === "approved" && (a.code.toLowerCase() === v || a.slug?.toLowerCase() === v));
      if (!target) return "not_found";
      if (target.userId === me) return "self";
      if (blocked(me, target.userId)) return "sent";
      const f = db().friendships.find((x) => [x.requesterId, x.addresseeId].includes(me) && [x.requesterId, x.addresseeId].includes(target.userId));
      if (f?.status === "accepted") return "already";
      if (f && f.status === "pending" && f.addresseeId === me) { f.status = "accepted"; f.respondedAt = iso(); return "accepted"; }
      if (f) Object.assign(f, { requesterId: me, addresseeId: target.userId, status: "pending", createdAt: iso(), respondedAt: null });
      else db().friendships.push({ id: uid(), requesterId: me, addresseeId: target.userId, status: "pending", createdAt: iso(), respondedAt: null });
      return "sent";
    },

    async respondFriend(s, id, accept) {
      const f = db().friendships.find((x) => x.id === id && x.addresseeId === s.userId && x.status === "pending");
      if (!f) return fail("not_allowed");
      f.status = accept ? "accepted" : "declined"; f.respondedAt = iso();
    },

    async removeFriend(s, other) {
      unfriend(s.userId, other);
    },

    async blockProfile(s, other) {
      if (other === s.userId || isStaff(other)) fail("not_allowed");
      if (!db().blocks.some((b) => b.blockerId === s.userId && b.blockedId === other)) db().blocks.push({ blockerId: s.userId, blockedId: other });
      unfriend(s.userId, other);
    },

    async unblockProfile(s, other) {
      const st = db();
      st.blocks = st.blocks.filter((b) => !(b.blockerId === s.userId && b.blockedId === other));
    },

    async reportMessage(s, id, reason) {
      const m = db().messages.find((x) => x.id === id);
      if (!m || !canAccess(s, conv(m.conversationId)) || m.senderId === s.userId) return fail("not_allowed");
      if (!db().reports.some((r) => r.messageId === id && r.reporterId === s.userId)) {
        db().reports.push({ id: uid(), messageId: id, reporterId: s.userId, reason: reason.slice(0, 1000), status: "open", createdAt: iso(), reviewedAt: null });
      }
    },

    async listSupportInbox(s) {
      mustStaff(s);
      return db().convs.filter((c) => c.kind === "support" && c.lastMessageAt)
        .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
        .map((c) => {
          const read = member(c.id, s.userId)?.lastReadAt ?? "";
          return {
            id: c.id, subjectId: c.subjectId!, subjectName: nameOf(c.subjectId), subjectStatus: affOf(c.subjectId!)?.status ?? null,
            lastMessageAt: c.lastMessageAt, lastMessage: preview(c.id),
            unread: db().messages.filter((m) => m.conversationId === c.id && !m.deletedAt && m.senderId === c.subjectId && m.createdAt > read).length,
          };
        });
    },

    async listMessageReports(s) {
      mustStaff(s);
      return db().reports.map((r): MessageReportRow => {
        const m = db().messages.find((x) => x.id === r.messageId)!;
        return {
          id: r.id, status: r.status, reason: r.reason, createdAt: r.createdAt, reporterName: nameOf(r.reporterId),
          senderId: m.senderId, senderName: nameOf(m.senderId), conversationKind: conv(m.conversationId)!.kind, reviewedAt: r.reviewedAt,
        };
      }).sort((a, b) => Number(["open", "reviewing"].includes(b.status)) - Number(["open", "reviewing"].includes(a.status)) || b.createdAt.localeCompare(a.createdAt));
    },

    async openMessageReport(s, id) {
      mustStaff(s);
      const r = db().reports.find((x) => x.id === id);
      if (!r) return fail("not_allowed");
      const m = db().messages.find((x) => x.id === r.messageId)!;
      audit(s, "message_report.open", id, r.reason);
      if (r.status === "open") r.status = "reviewing";
      const all = sorted(m.conversationId);
      const i = all.findIndex((x) => x.id === m.id);
      const ctx = all.slice(Math.max(0, i - 20), i + 21);
      const c = conv(m.conversationId)!;
      return { reportedId: m.id, participants: participants(c), messages: ctx.map((x) => ({ ...toMessage(x, s.userId), attachment: x.attachmentPath ? { ...toMessage(x, s.userId).attachment!, url: null } : null })) };
    },

    async moderateMessageReport(s, id, action, reason) {
      mustStaff(s);
      const r = db().reports.find((x) => x.id === id);
      if (!r) return fail("not_allowed");
      const m = db().messages.find((x) => x.id === r.messageId)!;
      if (action === "dismiss") { r.status = "dismissed"; }
      else if (action === "delete_message") {
        if (m.attachmentPath) db().media.delete(m.attachmentPath);
        Object.assign(m, { deletedAt: iso(), body: null, attachmentPath: null, attachmentMime: null, attachmentSize: null, attachmentName: null });
        for (const x of db().reports) if (x.messageId === m.id && ["open", "reviewing"].includes(x.status)) { x.status = "actioned"; x.reviewedAt = iso(); }
      } else {
        if (!m.senderId || isStaff(m.senderId)) fail("not_allowed");
        db().muted[m.senderId!] = iso(Date.now() + 7 * 86_400_000);
        r.status = "actioned";
      }
      r.reviewedAt = iso();
      audit(s, `message_report.${action}`, id, reason);
    },
  };
}
