"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, SendHorizontal, Video, X, Trash2 } from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";
import { fmt } from "@/i18n/format";
import { formatDuration } from "@/lib/messaging/media";
import { MESSAGE_LIMITS } from "@/lib/messaging/policy";
import { useRecorder, type Recording } from "./use-recorder";

const ACCEPT = [...MESSAGE_LIMITS.mime.image, ...MESSAGE_LIMITS.mime.video, ...MESSAGE_LIMITS.mime.audio, ...MESSAGE_LIMITS.mime.file].join(",");

export function Composer({
  disabledReason, replyName, editing, onCancelContext, onSend, onFiles, onRecorded, onTyping, onError,
}: {
  /** When set, the composer is replaced by this notice. */
  disabledReason: string | null;
  replyName: string | null;
  editing: { id: string; body: string } | null;
  onCancelContext: () => void;
  onSend: (text: string) => void;
  onFiles: (files: File[]) => void;
  onRecorded: (r: Recording) => void;
  onTyping: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const C = t.msg.composer;
  const [text, setText] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const recorder = useRecorder(onRecorded);

  // Entering edit mode loads the message; leaving it clears the box.
  const [editKey, setEditKey] = useState<string | null>(null);
  const nextKey = editing ? editing.id : null;
  if (nextKey !== editKey) {
    setEditKey(nextKey);
    setText(editing ? editing.body : "");
  }
  useEffect(() => { if (editing || replyName) area.current?.focus(); }, [editing, replyName]);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  useEffect(() => {
    if (preview.current) preview.current.srcObject = recorder.kind === "video" ? recorder.stream : null;
  }, [recorder.kind, recorder.stream]);

  if (disabledReason) {
    return <p className="border-t border-line bg-surface px-4 py-4 text-center text-[13px] text-muted">{disabledReason}</p>;
  }

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    if (v.length > MESSAGE_LIMITS.bodyMaxChars) return onError(t.msg.errors.empty);
    onSend(v);
    setText("");
  };

  const record = async (k: "audio" | "video") => {
    const err = await recorder.start(k);
    if (err) onError(err === "denied" ? (k === "audio" ? C.micDenied : C.camDenied) : C.unsupportedRecorder);
  };

  if (recorder.kind) {
    const max = MESSAGE_LIMITS.maxRecordMs[recorder.kind];
    return (
      <div className="border-t border-line bg-surface px-3 py-3 sm:px-4">
        {recorder.kind === "video" && (
          <div className="mb-3 flex justify-center">
            <video ref={preview} autoPlay muted playsInline className="size-48 rounded-full bg-black object-cover [transform:scaleX(-1)]" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => recorder.stop(false)} aria-label={C.cancel} title={C.cancel}
            className="grid size-10 place-items-center rounded-full text-danger hover:bg-danger-soft"><Trash2 className="size-5" /></button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-surface-2 px-4 py-2.5">
            <span className="size-2.5 animate-pulse rounded-full bg-danger" />
            <span className="text-[14px] font-medium">{C.recording}</span>
            <span className="ms-auto text-[13px] tabular-nums text-muted">{formatDuration(recorder.elapsed)} / {formatDuration(max)}</span>
          </div>
          <button type="button" onClick={() => recorder.stop(true)} aria-label={C.stop} title={C.stop}
            className="grid size-11 place-items-center rounded-full bg-accent text-accent-fg shadow-sm"><SendHorizontal className="flip-rtl size-5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-line bg-surface px-3 pb-3 pt-2 sm:px-4">
      {(replyName || editing) && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px]">
          <span className="min-w-0 flex-1 truncate text-fg-2">{editing ? C.editing : fmt(C.replyingTo, { name: replyName ?? "" })}</span>
          <button type="button" onClick={onCancelContext} aria-label={C.cancel} className="grid size-6 place-items-center rounded-full hover:bg-surface-3"><X className="size-3.5" /></button>
        </div>
      )}
      <div className="flex items-end gap-1.5">
        {!editing && (
          <>
            <input ref={file} type="file" multiple accept={ACCEPT} className="hidden"
              onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) onFiles(f); }} />
            <ToolBtn label={C.attach} onClick={() => file.current?.click()}><Paperclip className="size-5" /></ToolBtn>
            <ToolBtn label={C.video} onClick={() => record("video")} className="max-sm:hidden"><Video className="size-5" /></ToolBtn>
          </>
        )}
        <textarea
          ref={area}
          rows={1}
          value={text}
          maxLength={MESSAGE_LIMITS.bodyMaxChars}
          placeholder={C.placeholder}
          aria-label={C.placeholder}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
            if (e.key === "Escape" && (editing || replyName)) onCancelContext();
          }}
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.length && !editing) { e.preventDefault(); onFiles(files); }
          }}
          className="max-h-[180px] min-h-11 flex-1 resize-none rounded-[22px] border border-line bg-surface-2 px-4 py-2.5 text-[15px] leading-snug outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent-soft"
        />
        {text.trim() || editing ? (
          <button type="button" onClick={submit} aria-label={C.send} title={C.send}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg shadow-sm transition active:scale-95 disabled:opacity-50"
            disabled={!text.trim()}>
            <SendHorizontal className="flip-rtl size-5" />
          </button>
        ) : (
          <>
            <ToolBtn label={C.video} onClick={() => record("video")} className="sm:hidden"><Video className="size-5" /></ToolBtn>
            <button type="button" onClick={() => record("audio")} aria-label={C.voice} title={C.voice}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg shadow-sm transition active:scale-95">
              <Mic className="size-5" />
            </button>
          </>
        )}
      </div>
      <p className="mt-1.5 hidden px-2 text-[11px] text-muted sm:block">{C.hint}</p>
    </div>
  );
}

function ToolBtn({ label, onClick, children, className }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={cn("grid size-11 shrink-0 place-items-center rounded-full text-fg-2 transition hover:bg-surface-2 hover:text-fg", className)}>
      {children}
    </button>
  );
}
