import type { ConversationKind, MessageKind, Reaction, Relationship } from "./policy";

export interface LastMessagePreview {
  kind: MessageKind;
  body: string | null;
  senderId: string | null;
  deleted: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  kind: ConversationKind;
  lastMessageAt: string | null;
  pinned: boolean;
  /** Direct only. */
  peerId: string | null;
  peerName: string | null;
  relationship: Relationship | null;
  canSend: boolean;
  unread: number;
  lastMessage: LastMessagePreview | null;
}

export interface ChatAttachment {
  path: string;
  mime: string;
  size: number;
  name: string | null;
  /** Short-lived signed URL (null once the file is gone). */
  url: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  kind: MessageKind;
  body: string | null;
  attachment: ChatAttachment | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  replyTo: string | null;
  clientId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  reactions: { emoji: Reaction; count: number; mine: boolean }[];
}

export type Participants = Record<string, { name: string | null; staff: boolean }>;

export interface ConversationView {
  id: string;
  kind: ConversationKind;
  /** Direct: the other person. Support: the member (seen by staff). */
  peerId: string | null;
  peerName: string | null;
  relationship: Relationship | null;
  canSend: boolean;
  participants: Participants;
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface Contact {
  profileId: string;
  name: string | null;
  canMessage: boolean;
}

export interface FriendRequest {
  id: string;
  profileId: string;
  name: string | null;
  createdAt: string;
}

export interface Contacts {
  canUseDirect: boolean;
  sponsor: Contact | null;
  recruits: Contact[];
  friends: Contact[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  blocked: { profileId: string; name: string | null }[];
}

export type FriendRequestResult = "sent" | "accepted" | "already" | "not_found" | "self" | "not_allowed";

export interface SendMessageInput {
  conversationId: string;
  kind: Exclude<MessageKind, "system">;
  body?: string | null;
  attachmentPath?: string | null;
  attachmentMime?: string | null;
  attachmentSize?: number | null;
  attachmentName?: string | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
  replyTo?: string | null;
  clientId?: string | null;
}

export interface UploadTarget {
  path: string;
  /** PUT the file body here. */
  uploadUrl: string;
}

export interface SupportInboxRow {
  id: string;
  subjectId: string;
  subjectName: string | null;
  subjectStatus: string | null;
  lastMessageAt: string | null;
  lastMessage: LastMessagePreview | null;
  unread: number;
}

export interface MessageReportRow {
  id: string;
  status: "open" | "reviewing" | "dismissed" | "actioned";
  reason: string;
  createdAt: string;
  reporterName: string | null;
  senderId: string | null;
  senderName: string | null;
  conversationKind: ConversationKind;
  reviewedAt: string | null;
}

export interface OpenedReport {
  reportedId: string;
  participants: Participants;
  messages: ChatMessage[];
}

export type ModerationAction = "dismiss" | "delete_message" | "mute_sender";
