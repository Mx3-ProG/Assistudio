"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, ImagePlus, Megaphone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { fmt } from "@/i18n/format";
import { baseMime, canEdit, checkAttachment, type Reaction } from "@/lib/messaging/policy";
import type { ChatMessage, ConversationView } from "@/lib/messaging/types";
import {
  blockProfile, createUpload, deleteMessage, editMessage, fetchMessage, fetchMessages, markRead, react, reportMessage, sendMessage,
} from "@/app/actions/messaging";
import { MessageBubble, type LocalMessage } from "./message-bubble";
import { Composer } from "./composer";
import type { Recording } from "./use-recorder";
import { useHydrated } from "./use-hydrated";

/** PUT with progress (fetch has no upload progress). */
function upload(url: string, blob: Blob, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", blob.type);
    x.setRequestHeader("x-upsert", "false");
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(String(x.status))));
    x.onerror = () => reject(new Error("network"));
    x.send(blob);
  });
}

function imageSize(blob: Blob): Promise<{ width: number; height: number } | null> {
  if (!blob.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const u = URL.createObjectURL(blob);
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(u); };
    img.onerror = () => { resolve(null); URL.revokeObjectURL(u); };
    img.src = u;
  });
}

const rowToMessage = (r: Record<string, unknown>): ChatMessage => ({
  id: r.id as string, conversationId: r.conversation_id as string, senderId: (r.sender_id as string) ?? null, kind: r.kind as ChatMessage["kind"],
  body: (r.body as string) ?? null, attachment: null, durationMs: null, width: null, height: null, replyTo: (r.reply_to as string) ?? null,
  clientId: (r.client_id as string) ?? null, createdAt: r.created_at as string, editedAt: (r.edited_at as string) ?? null,
  deletedAt: (r.deleted_at as string) ?? null, reactions: [],
});

export function Thread({ view, me, myName, realtime, backHref }: {
  view: ConversationView;
  me: string;
  myName: string;
  realtime: boolean;
  backHref: string;
}) {
  const { t, locale } = useI18n();
  const M = t.msg;
  const router = useRouter();
  const hydrated = useHydrated();
  const [messages, setMessages] = useState<LocalMessage[]>(view.messages);
  const participants = view.participants;
  const [hasMore, setHasMore] = useState(view.hasMore);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [reporting, setReporting] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const retries = useRef(new Map<string, () => void>());
  const typingChannel = useRef<ReturnType<ReturnType<typeof supabaseBrowser>["channel"]> | null>(null);
  const lastTyping = useRef(0);
  const conv = view.id;
  const known = useRef(new Set(view.messages.map((m) => m.id)));
  useEffect(() => { known.current = new Set(messages.map((m) => m.id)); }, [messages]);

  const errText = useCallback((code: string) => (M.errors as Record<string, string>)[code] ?? M.errors.generic, [M.errors]);
  const flash = useCallback((m: string) => setError(m), []);
  useEffect(() => { if (!error) return; const id = setTimeout(() => setError(null), 5000); return () => clearTimeout(id); }, [error]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(id); }, [notice]);

  // Merge by id, then by clientId (optimistic rows), keep chronological order.
  const merge = useCallback((incoming: ChatMessage[]) => {
    setMessages((prev) => {
      const next = [...prev];
      for (const m of incoming) {
        const i = next.findIndex((x) => x.id === m.id || (!!m.clientId && x.clientId === m.clientId));
        if (i >= 0) {
          const local = next[i].pending?.localUrl;
          next[i] = { ...m, attachment: m.attachment && !m.attachment.url && local ? { ...m.attachment, url: local } : m.attachment };
        } else next.push(m);
      }
      return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, []);

  const read = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Marks the thread read (which also revalidates the conversation list and
   * unread badges). Incoming messages only count as read while the tab is
   * visible; `force` is for the user's own sends.
   */
  const scheduleRead = useCallback((force = false) => {
    if (read.current) clearTimeout(read.current);
    read.current = setTimeout(() => { if (force || document.visibilityState === "visible") void markRead(conv); }, 800);
  }, [conv]);
  useEffect(() => {
    scheduleRead();
    const onVisible = () => { if (document.visibilityState === "visible") scheduleRead(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [scheduleRead]);

  // ------------------------------------------------------------ live updates
  useEffect(() => {
    if (!realtime) {
      // Demo mode: no Realtime — poll the latest page.
      const id = setInterval(async () => {
        const r = await fetchMessages(conv, {});
        if (!r.ok) return;
        const fresh = r.data.some((m) => m.senderId !== me && !known.current.has(m.id));
        merge(r.data);
        if (fresh) scheduleRead();
      }, 3000);
      return () => clearInterval(id);
    }
    const sb = supabaseBrowser();
    const hydrate = async (messageId: string) => {
      const r = await fetchMessage(messageId);
      if (r.ok && r.data) merge([r.data]);
    };
    const ch = sb.channel(`messages:${conv}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conv}` }, (p) => {
        const row = p.new as Record<string, unknown>;
        if (!row?.id) return;
        if (row.sender_id && !participants[row.sender_id as string]) router.refresh();
        if (row.kind === "text" || row.deleted_at) merge([rowToMessage(row)]); else void hydrate(row.id as string);
        if (p.eventType === "INSERT" && row.sender_id !== me) { setTyping(null); scheduleRead(); }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, (p) => {
        const mid = ((p.new as { message_id?: string })?.message_id ?? (p.old as { message_id?: string })?.message_id);
        if (mid) setMessages((prev) => { if (prev.some((m) => m.id === mid)) void hydrate(mid); return prev; });
      })
      .subscribe();
    let typingCh: ReturnType<typeof sb.channel> | null = null;
    void sb.realtime.setAuth().then(() => {
      typingCh = sb.channel(`conv:${conv}`, { config: { private: true, broadcast: { self: false } } })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.id !== me) setTyping((payload?.name as string) || M.unknown);
        })
        .subscribe();
      typingChannel.current = typingCh;
    });
    return () => { void sb.removeChannel(ch); if (typingCh) void sb.removeChannel(typingCh); typingChannel.current = null; };
    // participants is read for a refresh hint only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv, realtime, me, merge, scheduleRead, M.unknown]);

  useEffect(() => { if (!typing) return; const id = setTimeout(() => setTyping(null), 4000); return () => clearTimeout(id); }, [typing]);

  const onTyping = () => {
    const now = Date.now();
    if (!typingChannel.current || now - lastTyping.current < 2500) return;
    lastTyping.current = now;
    void typingChannel.current.send({ type: "broadcast", event: "typing", payload: { id: me, name: myName } });
  };

  // ------------------------------------------------------------ scrolling
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);
  // Media grow after load: keep the view pinned to the bottom while sticking.
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !list.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { if (stick.current) el.scrollTop = el.scrollHeight; });
    ro.observe(list.current);
    return () => ro.disconnect();
  }, []);
  const onScroll = () => {
    const el = scroller.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };
  const loadOlder = async () => {
    const first = messages.find((m) => !m.pending);
    if (!first) return;
    const el = scroller.current;
    const before = el ? el.scrollHeight - el.scrollTop : 0;
    const r = await fetchMessages(conv, { before: first.createdAt });
    if (!r.ok) return flash(errText(r.error));
    stick.current = false;
    setHasMore(r.data.length >= 50);
    merge(r.data);
    requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - before; });
  };

  // ------------------------------------------------------------ sending
  const sendText = async (body: string) => {
    if (editing) {
      const target = editing;
      setEditing(null);
      setMessages((prev) => prev.map((m) => (m.id === target.id ? { ...m, body, editedAt: new Date().toISOString() } : m)));
      const r = await editMessage(target.id, body);
      if (!r.ok) flash(errText(r.error));
      return;
    }
    const clientId = crypto.randomUUID();
    const reply = replyTo?.id ?? null;
    setReplyTo(null);
    stick.current = true;
    const optimistic: LocalMessage = {
      id: `local-${clientId}`, conversationId: conv, senderId: me, kind: "text", body, attachment: null, durationMs: null, width: null,
      height: null, replyTo: reply, clientId, createdAt: new Date().toISOString(), editedAt: null, deletedAt: null, reactions: [],
      pending: { progress: null },
    };
    setMessages((prev) => [...prev, optimistic]);
    const attempt = async () => {
      setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, pending: { progress: null } } : m)));
      const r = await sendMessage({ conversationId: conv, kind: "text", body, replyTo: reply, clientId });
      if (r.ok) { retries.current.delete(clientId); merge([r.data]); scheduleRead(true); }
      else {
        setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, pending: { progress: null, error: errText(r.error) } } : m)));
      }
    };
    retries.current.set(clientId, attempt);
    await attempt();
  };

  const sendBlob = async (blob: Blob, name: string | null, durationMs: number | null) => {
    const type = baseMime(blob.type);
    const check = checkAttachment({ mime: type, size: blob.size, durationMs });
    if (!check.ok) return flash(errText(check.error));
    const file = blob.type === type ? blob : new Blob([blob], { type });
    const clientId = crypto.randomUUID();
    const localUrl = URL.createObjectURL(file);
    const reply = replyTo?.id ?? null;
    setReplyTo(null);
    stick.current = true;
    const dims = await imageSize(file);
    setMessages((prev) => [...prev, {
      id: `local-${clientId}`, conversationId: conv, senderId: me, kind: check.kind, body: null,
      attachment: { path: "", mime: type, size: file.size, name, url: localUrl }, durationMs, width: dims?.width ?? null, height: dims?.height ?? null,
      replyTo: reply, clientId, createdAt: new Date().toISOString(), editedAt: null, deletedAt: null, reactions: [],
      pending: { progress: 0, localUrl },
    }]);
    const setPending = (p: LocalMessage["pending"]) =>
      setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, pending: p } : m)));
    const attempt = async () => {
      setPending({ progress: 0, localUrl });
      const target = await createUpload(conv, type);
      if (!target.ok) return setPending({ progress: null, localUrl, error: errText(target.error) });
      try {
        await upload(target.data.uploadUrl, file, (p) => setPending({ progress: p, localUrl }));
      } catch {
        return setPending({ progress: null, localUrl, error: M.errors.upload });
      }
      const r = await sendMessage({
        conversationId: conv, kind: check.kind, attachmentPath: target.data.path, attachmentMime: type, attachmentSize: file.size,
        attachmentName: name, durationMs, width: dims?.width ?? null, height: dims?.height ?? null, replyTo: reply, clientId,
      });
      if (!r.ok) return setPending({ progress: null, localUrl, error: errText(r.error) });
      retries.current.delete(clientId);
      merge([r.data]);
      scheduleRead(true);
    };
    retries.current.set(clientId, attempt);
    await attempt();
  };

  const onFiles = (files: File[]) => { for (const f of files.slice(0, 10)) void sendBlob(f, f.name.slice(0, 200), null); };
  const onRecorded = (r: Recording) => void sendBlob(r.blob, null, r.durationMs);

  const onReact = async (m: ChatMessage, emoji: Reaction) => {
    setMessages((prev) => prev.map((x) => {
      if (x.id !== m.id) return x;
      const has = x.reactions.find((r) => r.emoji === emoji);
      const reactions = has
        ? x.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + (r.mine ? -1 : 1), mine: !r.mine } : r)).filter((r) => r.count > 0)
        : [...x.reactions, { emoji, count: 1, mine: true }];
      return { ...x, reactions };
    }));
    const r = await react(m.id, emoji);
    if (!r.ok) flash(errText(r.error));
  };

  const onDelete = async (m: ChatMessage) => {
    if (!window.confirm(M.actions.confirmDelete)) return;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deletedAt: new Date().toISOString(), body: null, attachment: null } : x)));
    const r = await deleteMessage(m.id);
    if (!r.ok) flash(errText(r.error));
  };

  // ------------------------------------------------------------ rendering
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }), [locale]);
  const multi = view.kind !== "direct";
  const peerStaff = view.peerId ? participants[view.peerId]?.staff : false;

  const title = view.kind === "announcements" ? M.announcements
    : view.kind === "support" ? (view.peerName ?? (view.peerId ? M.unknown : M.support))
    : view.peerName ?? M.unknown;
  const subtitle = view.kind === "announcements" ? M.announcementsHint
    : view.kind === "support" ? (view.peerId ? M.admin.kind.support : M.supportHint)
    : view.relationship ? M.relationship[view.relationship] : peerStaff ? M.staffBadge : null;
  const Icon = view.kind === "announcements" ? Megaphone : view.kind === "support" ? ShieldCheck : null;

  const disabled = view.canSend ? null : view.kind === "announcements" ? M.composer.readOnly : M.composer.cannotSend;

  const block = async () => {
    if (!view.peerId || !window.confirm(fmt(M.contacts.confirmBlock, { name: title }))) return;
    const r = await blockProfile(view.peerId);
    if (!r.ok) return flash(errText(r.error));
    router.push(backHref);
    router.refresh();
  };

  return (
    <section
      className="relative flex h-full min-h-0 flex-col"
      onDragEnter={(e) => { if (view.canSend && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDrag(true); } }}
      onDragOver={(e) => { if (view.canSend && e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false); }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (view.canSend) onFiles([...e.dataTransfer.files]); }}
    >
      <header className="flex items-center gap-3 border-b border-line bg-surface px-3 py-3 sm:px-4">
        <Link href={backHref} className="grid size-9 place-items-center rounded-full hover:bg-surface-2 lg:hidden" aria-label={M.back}>
          <ArrowLeft className="flip-rtl size-5" />
        </Link>
        <Avatar name={title} icon={Icon ? <Icon className="size-5" /> : null} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">{title}</h2>
          <p className="truncate text-[12px] text-muted">{typing ? fmt(M.typing, { name: typing }) : subtitle}</p>
        </div>
        {view.kind === "direct" && view.peerId && !peerStaff && (
          <button type="button" onClick={block} title={M.contacts.block} aria-label={M.contacts.block}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"><Ban className="size-4" /></button>
        )}
      </header>

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg px-3 py-4 sm:px-5">
        {!realtime && <p className="mx-auto mb-3 max-w-md rounded-full bg-warning-soft px-3 py-1 text-center text-[11px] text-warning">{M.demoPolling}</p>}
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button type="button" onClick={loadOlder} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium hover:bg-surface-2">{M.loadOlder}</button>
          </div>
        )}
        {messages.length === 0 && <p className="mt-16 text-center text-[14px] text-muted">{M.emptyThread}</p>}
        <ol ref={list} className="flex flex-col gap-2.5">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            const mine = m.senderId === me;
            return (
              <li key={m.clientId ?? m.id} className="flex flex-col">
                {newDay && hydrated && <span className="my-2 self-center rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium capitalize text-muted">{dayFmt.format(new Date(m.createdAt))}</span>}
                <MessageBubble
                  m={m}
                  mine={mine}
                  showSender={multi && (newDay || prev?.senderId !== m.senderId)}
                  participants={participants}
                  replyTarget={m.replyTo ? byId.get(m.replyTo) ?? null : null}
                  canReact
                  canReply={view.canSend}
                  canEdit={canEdit(m, me)}
                  canReport={!mine && !!m.senderId && !participants[m.senderId]?.staff}
                  onReply={() => { setEditing(null); setReplyTo(m); }}
                  onEdit={() => { setReplyTo(null); setEditing(m); }}
                  onDelete={() => onDelete(m)}
                  onReport={() => setReporting(m)}
                  onReact={(e) => onReact(m, e)}
                  onRetry={() => m.clientId && retries.current.get(m.clientId)?.()}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {error && <p role="alert" className="border-t border-line bg-danger-soft px-4 py-2 text-[13px] text-danger">{error}</p>}
      {notice && <p role="status" className="border-t border-line bg-success-soft px-4 py-2 text-[13px] text-success">{notice}</p>}
      <Composer
        disabledReason={disabled}
        replyName={replyTo ? (replyTo.senderId === me ? M.you : participants[replyTo.senderId ?? ""]?.name || M.unknown) : null}
        editing={editing && editing.body ? { id: editing.id, body: editing.body } : null}
        onCancelContext={() => { setReplyTo(null); setEditing(null); }}
        onSend={sendText}
        onFiles={onFiles}
        onRecorded={onRecorded}
        onTyping={onTyping}
        onError={flash}
      />

      {drag && (
        <div className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-3xl border-2 border-dashed border-accent bg-accent-soft/80 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-accent"><ImagePlus className="size-5" />{M.composer.dropHere}</span>
        </div>
      )}
      {reporting && (
        <ReportDialog
          onClose={() => setReporting(null)}
          onSubmit={async (reason) => {
            const r = await reportMessage(reporting.id, reason);
            setReporting(null);
            if (r.ok) setNotice(M.report.done); else flash(errText(r.error));
          }}
        />
      )}
    </section>
  );
}

export function Avatar({ name, icon, className }: { name: string; icon?: React.ReactNode; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[14px] font-semibold text-accent-fg", className)}>
      {icon ?? initials}
    </span>
  );
}

function ReportDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const { t } = useI18n();
  const R = t.msg.report;
  const [reason, setReason] = useState("");
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form className="w-full max-w-md rounded-3xl border border-line bg-surface p-5 shadow-lg" onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (reason.trim()) onSubmit(reason.trim()); }}>
        <h3 id="report-title" className="text-[17px] font-semibold">{R.title}</h3>
        <p className="mt-1 text-[13px] text-muted">{R.hint}</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} required autoFocus placeholder={R.placeholder}
          className="mt-4 min-h-24 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-full px-4 text-sm font-medium hover:bg-surface-2">{t.common.cancel}</button>
          <button type="submit" className="h-10 rounded-full bg-danger px-4 text-sm font-medium text-white disabled:opacity-50" disabled={!reason.trim()}>{R.submit}</button>
        </div>
      </form>
    </div>
  );
}
