/**
 * Messaging rules — pure, framework-free, unit-tested.
 *
 * Mirror of the SQL in supabase/migrations/20261002000001_messaging.sql:
 *   canMessage()      ⇔ public.can_message()
 *   MESSAGE_LIMITS    ⇔ public.msg_kind_accepts() / msg_max_size() / send_message()
 *   attachmentPath()  ⇔ the path pattern checked by send_message() and the
 *                       chat-media storage policies.
 * The database is the authority; this module lets the UI explain a refusal
 * before a round trip. Keep both in sync.
 */

export type MessageKind = "text" | "image" | "video" | "audio" | "file" | "system";
export type MediaKind = Exclude<MessageKind, "text" | "system">;
export type ConversationKind = "direct" | "support" | "announcements";
export type Relationship = "sponsor" | "recruit" | "friend";

export type Party = {
  id: string;
  staff: boolean;
  /** true only for an approved, non-deleted affiliate. */
  approvedAffiliate: boolean;
  deleted?: boolean;
};

export function canMessage(a: Party, b: Party, ctx: { blocked: boolean; relationship: Relationship | null }): boolean {
  if (a.id === b.id || a.deleted || b.deleted) return false;
  if (a.staff || b.staff) return true;
  if (ctx.blocked) return false;
  if (!a.approvedAffiliate || !b.approvedAffiliate) return false;
  return ctx.relationship !== null;
}

const MB = 1024 * 1024;

export const MESSAGE_LIMITS = {
  bodyMaxChars: 4000,
  editWindowMs: 15 * 60 * 1000,
  burst: { count: 20, windowMs: 10_000 },
  mediaPerHour: 60,
  maxSize: { image: 10 * MB, audio: 15 * MB, video: 50 * MB, file: 20 * MB } satisfies Record<MediaKind, number>,
  /** Recording caps (the SQL accepts a little more for uploaded files). */
  maxRecordMs: { audio: 5 * 60_000, video: 60_000 },
  maxDurationMs: { audio: 5 * 60_000, video: 3 * 60_000 },
  mime: {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    audio: ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav"],
    file: ["application/pdf"],
  } satisfies Record<MediaKind, string[]>,
} as const;

export const REACTIONS = ["👍", "❤️", "🔥", "🎉", "👏", "😂"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** "audio/webm;codecs=opus" → "audio/webm". */
export function baseMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

export function kindForMime(mime: string): MediaKind | null {
  const m = baseMime(mime);
  for (const kind of ["image", "video", "audio", "file"] as const) {
    if ((MESSAGE_LIMITS.mime[kind] as readonly string[]).includes(m)) return kind;
  }
  return null;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/heic": "heic", "image/heif": "heif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/aac": "aac", "audio/wav": "wav",
  "application/pdf": "pdf",
};

export function extensionForMime(mime: string): string | null {
  return EXT[baseMime(mime)] ?? null;
}

export type AttachmentCheck =
  | { ok: true; kind: MediaKind }
  | { ok: false; error: "unsupported" | "too_large" | "too_long" };

export function checkAttachment(input: { mime: string; size: number; durationMs?: number | null }): AttachmentCheck {
  const kind = kindForMime(input.mime);
  if (!kind) return { ok: false, error: "unsupported" };
  if (input.size <= 0 || input.size > MESSAGE_LIMITS.maxSize[kind]) return { ok: false, error: "too_large" };
  if ((kind === "audio" || kind === "video") && (input.durationMs ?? 0) > MESSAGE_LIMITS.maxDurationMs[kind]) {
    return { ok: false, error: "too_long" };
  }
  return { ok: true, kind };
}

/** Safe path segment (UUIDs in production, readable ids in demo). */
const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

/** {conversation}/{sender}/{random}.{ext} — the only shape send_message accepts. */
export function attachmentPath(conversationId: string, senderId: string, fileId: string, mime: string): string {
  const ext = extensionForMime(mime);
  if (!SEGMENT.test(conversationId) || !SEGMENT.test(senderId)) throw new Error("Invalid id");
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(fileId)) throw new Error("Invalid file id");
  if (!ext) throw new Error("Unsupported type");
  return `${conversationId}/${senderId}/${fileId}.${ext}`;
}

export function isValidAttachmentPath(path: string, conversationId: string, senderId: string): boolean {
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === conversationId && parts[1] === senderId
    && /^[A-Za-z0-9_-]{1,80}\.[a-z0-9]{1,8}$/.test(parts[2]);
}

export function canEdit(message: { senderId: string | null; kind: MessageKind; createdAt: string; deletedAt: string | null }, me: string, now = Date.now()): boolean {
  return message.senderId === me && message.kind === "text" && !message.deletedAt
    && now - new Date(message.createdAt).getTime() <= MESSAGE_LIMITS.editWindowMs;
}

/** Error codes raised by the SQL functions, as `messaging.<code>`. */
export const MESSAGING_ERRORS = [
  "not_allowed", "muted", "rate_limited", "empty", "invalid_attachment", "too_large", "too_long",
  "invalid_kind", "invalid_reply", "edit_window",
] as const;
export type MessagingError = (typeof MESSAGING_ERRORS)[number];

export function messagingErrorCode(message: string | undefined | null): MessagingError | null {
  const m = /messaging\.([a-z_]+)/.exec(message ?? "");
  return m && (MESSAGING_ERRORS as readonly string[]).includes(m[1]) ? (m[1] as MessagingError) : null;
}
