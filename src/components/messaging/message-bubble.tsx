"use client";
import { useEffect, useRef, useState } from "react";
import { CornerUpLeft, FileText, Flag, Loader2, Pause, Pencil, Play, SmilePlus, Trash2, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";
import { formatBytes, formatDuration, linkify } from "@/lib/messaging/media";
import { REACTIONS, type Reaction } from "@/lib/messaging/policy";
import type { ChatMessage, Participants } from "@/lib/messaging/types";
import { useHydrated } from "./use-hydrated";

export type LocalMessage = ChatMessage & {
  /** Optimistic state while uploading / sending. */
  pending?: { progress: number | null; error?: string | null; localUrl?: string | null };
};

const time = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function MessageBubble({
  m, mine, showSender, participants, replyTarget, canReact, canReply, canEdit, canReport,
  onReply, onEdit, onDelete, onReport, onReact, onRetry,
}: {
  m: LocalMessage;
  mine: boolean;
  showSender: boolean;
  participants: Participants;
  replyTarget: ChatMessage | null;
  canReact: boolean;
  canReply: boolean;
  canEdit: boolean;
  canReport: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onReact: (emoji: Reaction) => void;
  onRetry?: () => void;
}) {
  const { t, locale } = useI18n();
  const M = t.msg;
  const [picker, setPicker] = useState(false);
  /** Touch screens: actions show after tapping the bubble. */
  const [selected, setSelected] = useState(false);
  const hydrated = useHydrated();
  const sender = m.senderId ? participants[m.senderId] : null;
  const name = sender?.name || M.unknown;
  const url = m.pending?.localUrl ?? m.attachment?.url ?? null;
  const deleted = !!m.deletedAt;

  return (
    <div className={cn("group flex w-full flex-col", mine ? "items-end" : "items-start")}>
      {showSender && !mine && (
        <span className="mb-1 flex items-center gap-1.5 px-1 text-[12px] font-medium text-fg-2">
          {name}
          {sender?.staff && <span className="rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">{M.staffBadge}</span>}
        </span>
      )}
      <div className={cn("relative flex max-w-[min(85%,560px)] items-end gap-1.5", mine && "flex-row-reverse")}>
        <div
          onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button,audio,video")) setSelected((v) => !v); }}
          className={cn(
            "min-w-0 overflow-hidden rounded-[20px] text-[15px] leading-snug shadow-sm",
            deleted ? "border border-dashed border-line bg-transparent text-muted italic"
              : mine ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg",
            m.kind === "text" || deleted ? "px-3.5 py-2" : "p-1",
            mine ? "rounded-ee-md" : "rounded-es-md",
            m.pending && !m.pending.error && "opacity-80",
          )}
        >
          {replyTarget && !deleted && (
            <div className={cn("mb-1.5 rounded-xl border-s-2 px-2.5 py-1 text-[12.5px]", mine ? "border-accent-fg/60 bg-black/10" : "border-accent bg-surface",
              m.kind !== "text" && "mx-1 mt-1")}>
              <span className="font-medium">{participants[replyTarget.senderId ?? ""]?.name || M.unknown}</span>
              <p className="line-clamp-1 opacity-80">{replyTarget.deletedAt ? M.preview.deleted : replyTarget.body || M.preview[replyTarget.kind]}</p>
            </div>
          )}
          {deleted ? M.deleted : (
            <>
              {m.kind === "image" && url && <ImageAttachment url={url} alt={m.attachment?.name ?? M.preview.image} w={m.width} h={m.height} />}
              {m.kind === "video" && url && (
                <video src={url} controls playsInline preload="metadata" className="max-h-[360px] w-full max-w-[320px] rounded-2xl bg-black" />
              )}
              {m.kind === "audio" && <AudioPlayer url={url} durationMs={m.durationMs} mine={mine} />}
              {m.kind === "file" && (
                <a href={url ?? undefined} target="_blank" rel="noopener noreferrer"
                  className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", mine ? "bg-black/10" : "bg-surface")}>
                  <FileText className="size-6 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{m.attachment?.name ?? M.preview.file}</span>
                    <span className="text-[12px] opacity-75">{m.attachment ? formatBytes(m.attachment.size) : ""}</span>
                  </span>
                </a>
              )}
              {m.body && (
                <p className={cn("whitespace-pre-wrap break-words", m.kind !== "text" && "px-2.5 pb-1.5 pt-1.5")}>
                  {linkify(m.body).map((p, i) => p.type === "link"
                    ? <a key={i} href={p.value} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">{p.value}</a>
                    : <span key={i}>{p.value}</span>)}
                </p>
              )}
            </>
          )}
          {m.pending && !m.pending.error && m.pending.progress !== null && m.kind !== "text" && (
            <div className="absolute inset-x-3 bottom-2 h-1 overflow-hidden rounded-full bg-black/30">
              <div className="h-full bg-white transition-[width]" style={{ width: `${Math.round((m.pending.progress ?? 0) * 100)}%` }} />
            </div>
          )}
        </div>

        {!deleted && !m.pending && (
          <div className={cn("shrink-0 items-center gap-0.5 self-center transition sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
            selected ? "flex" : "hidden")}>
            {canReact && (
              <div className="relative">
                <IconBtn label={M.actions.react} onClick={() => setPicker((v) => !v)}><SmilePlus className="size-4" /></IconBtn>
                {picker && (
                  <div className={cn("absolute bottom-9 z-20 flex gap-0.5 rounded-full border border-line bg-surface p-1 shadow-lg", mine ? "end-0" : "start-0")}>
                    {REACTIONS.map((e) => (
                      <button key={e} type="button" onClick={() => { onReact(e); setPicker(false); }}
                        className="grid size-8 place-items-center rounded-full text-[18px] transition hover:scale-110 hover:bg-surface-2">{e}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canReply && <IconBtn label={M.actions.reply} onClick={onReply}><CornerUpLeft className="size-4" /></IconBtn>}
            {canEdit && <IconBtn label={M.actions.edit} onClick={onEdit}><Pencil className="size-4" /></IconBtn>}
            {mine && <IconBtn label={M.actions.delete} onClick={onDelete}><Trash2 className="size-4" /></IconBtn>}
            {canReport && <IconBtn label={M.actions.report} onClick={onReport}><Flag className="size-4" /></IconBtn>}
          </div>
        )}
      </div>

      {m.reactions.length > 0 && !deleted && (
        <div className={cn("-mt-1 flex flex-wrap gap-1 px-2", mine ? "justify-end" : "justify-start")}>
          {m.reactions.map((r) => (
            <button key={r.emoji} type="button" onClick={() => canReact && onReact(r.emoji)}
              className={cn("flex h-6 items-center gap-1 rounded-full border px-1.5 text-[12px] shadow-sm",
                r.mine ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-fg-2")}>
              <span className="text-[13px]">{r.emoji}</span>{r.count}
            </button>
          ))}
        </div>
      )}

      <span className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-muted">
        {m.pending?.error ? (
          <button type="button" onClick={onRetry} className="font-medium text-danger underline">{m.pending.error}</button>
        ) : m.pending ? <Loader2 className="size-3 animate-spin" /> : (
          <>{hydrated ? time(m.createdAt, locale) : "\u00a0"}{m.editedAt && !deleted && <> · {M.edited}</>}</>
        )}
      </span>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg">
      {children}
    </button>
  );
}

function ImageAttachment({ url, alt, w, h }: { url: string; alt: string; w: number | null; h: number | null }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not optimisable */}
        <img src={url} alt={alt} width={w ?? undefined} height={h ?? undefined} loading="lazy"
          className="max-h-[360px] w-auto max-w-full object-cover" style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined} />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setOpen(false)}>
          <button type="button" aria-label={t.common.close} className="absolute end-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img src={url} alt={alt} className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </>
  );
}

const SPEEDS = [1, 1.5, 2] as const;

function AudioPlayer({ url, durationMs, mine }: { url: string | null; durationMs: number | null; mine: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState((durationMs ?? 0) / 1000);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => { if (ref.current) ref.current.playbackRate = speed; }, [speed]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play(); else a.pause();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    a.currentTime = ratio * dur;
  };

  return (
    <div className="flex w-[240px] max-w-full items-center gap-2.5 px-2 py-1.5">
      {url && (
        <audio ref={ref} src={url} preload="metadata"
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPos(0); }}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { if (Number.isFinite(e.currentTarget.duration)) setDur(e.currentTarget.duration); }} />
      )}
      <button type="button" onClick={toggle} disabled={!url} aria-label={playing ? "Pause" : "Play"}
        className={cn("grid size-9 shrink-0 place-items-center rounded-full", mine ? "bg-accent-fg text-accent" : "bg-accent text-accent-fg")}>
        {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("h-1.5 cursor-pointer overflow-hidden rounded-full", mine ? "bg-accent-fg/30" : "bg-line-strong")} onClick={seek}>
          <div className={cn("h-full rounded-full", mine ? "bg-accent-fg" : "bg-accent")} style={{ width: dur ? `${(pos / dur) * 100}%` : "0%" }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums opacity-80">
          <span>{formatDuration((playing || pos ? pos : dur) * 1000)}</span>
          <button type="button" title={t.msg.actions.speed} onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
            className="rounded-full px-1.5 font-semibold hover:bg-black/10">{speed}×</button>
        </div>
      </div>
    </div>
  );
}
