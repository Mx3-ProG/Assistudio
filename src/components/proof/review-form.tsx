"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Camera, CircleCheck, ImagePlus, Square, Star, Upload, Video, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { createReviewUpload, submitReview, type ReviewState } from "@/app/actions/proof";
import { PROOF_LIMITS, mediaKindAccepts, type MediaKind } from "@/lib/proof";
import { pickRecorderMime, normalizeRecordedMime, formatDuration } from "@/lib/messaging/media";
import { buttonClass } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type Clip = { blob: Blob; url: string; width: number | null; height: number | null; durationMs: number | null; poster: Blob | null };

function putFile(url: string, blob: Blob, onProgress: (p: number) => void): Promise<void> {
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

/** Downscale an image (photo, logo, video frame) before upload: lighter pages, no original metadata. */
function toWebp(source: CanvasImageSource, w: number, h: number): Promise<Blob | null> {
  const scale = Math.min(1, PROOF_LIMITS.imageMaxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  c.getContext("2d")?.drawImage(source, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob((b) => r(b), "image/webp", 0.82));
}

async function shrinkImage(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    return await toWebp(bmp, bmp.width, bmp.height);
  } catch {
    return null;
  }
}

/** Size, duration and a poster frame of a video, read locally. */
function inspectVideo(blob: Blob): Promise<Omit<Clip, "blob" | "url">> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(blob);
    let settled = false;
    const done = (poster: Blob | null) => {
      if (settled) return;
      settled = true;
      const d = Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : null;
      resolve({ width: v.videoWidth || null, height: v.videoHeight || null, durationMs: d, poster });
      URL.revokeObjectURL(url);
    };
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.onloadeddata = () => { v.currentTime = Math.min(0.6, (v.duration || 1) / 3); };
    v.onseeked = async () => done(v.videoWidth ? await toWebp(v, v.videoWidth, v.videoHeight) : null);
    v.onerror = () => done(null);
    setTimeout(() => done(null), 8000);
    v.src = url;
  });
}

export function ReviewForm({ mode, token, defaults, locale, blocked }: {
  mode: "ambassador" | "client"; token?: string; locale: string;
  /** Rendered instead of the form (e.g. a review already awaiting moderation). */
  blocked?: React.ReactNode;
  defaults: { name?: string; company?: string | null };
}) {
  const { t } = useI18n();
  const F = t.pf.form;
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);
  const [videoStep, setVideoStep] = useState<"choose" | "recording" | "skipped">("choose");
  const [images, setImages] = useState<{ photo: Blob | null; logo: Blob | null }>({ photo: null, logo: null });
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);

  const pickVideo = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!mediaKindAccepts("video", file.type)) return setError(F.errors.unsupported);
    if (file.size > PROOF_LIMITS.videoMaxBytes) return setError(F.errors.too_large);
    const meta = await inspectVideo(file);
    setClip({ blob: file, url: URL.createObjectURL(file), ...meta });
  };

  const pickImage = async (kind: "photo" | "logo", file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!mediaKindAccepts(kind, file.type) || file.size > PROOF_LIMITS.imageMaxBytes) return setError(F.errors.unsupported);
    const small = await shrinkImage(file);
    if (!small) return setError(F.errors.unsupported);
    setImages((x) => ({ ...x, [kind]: small }));
  };

  async function upload(kind: MediaKind, blob: Blob, share: [number, number]) {
    const target = await createReviewUpload({ kind, mime: blob.type, size: blob.size, token: token ?? null });
    if ("error" in target) throw new Error(target.error);
    await putFile(target.uploadUrl, blob, (p) => setProgress(Math.round((share[0] + p * share[1]) * 100)));
    return target.path;
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (fd.get("consent") !== "on") return setError(F.errors.consent_required);
    try {
      const jobs: [MediaKind, Blob][] = [];
      if (clip) { jobs.push(["video", clip.blob]); if (clip.poster) jobs.push(["poster", clip.poster]); }
      if (images.photo) jobs.push(["photo", images.photo]);
      if (images.logo) jobs.push(["logo", images.logo]);
      const total = jobs.reduce((a, [, b]) => a + b.size, 0) || 1;
      let done = 0;
      if (jobs.length) setProgress(0);
      for (const [kind, blob] of jobs) {
        const path = await upload(kind, blob, [done / total, blob.size / total]);
        done += blob.size;
        fd.set(`${kind}Path`, path);
        if (kind === "video" && clip) {
          fd.set("videoMime", blob.type);
          if (clip.width) fd.set("videoWidth", String(clip.width));
          if (clip.height) fd.set("videoHeight", String(clip.height));
          if (clip.durationMs) fd.set("videoDurationMs", String(clip.durationMs));
        }
      }
    } catch (err) {
      setProgress(null);
      const code = err instanceof Error ? err.message : "upload";
      return setError((F.errors as Record<string, string>)[code] ?? F.errors.upload);
    }
    setProgress(null);
    startTransition(() => action(fd));
  };

  if (state.ok) {
    return (
      <div className="card flex items-start gap-3 p-6">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <p className="text-[15px] leading-relaxed">{fmt(F.done, { ref: state.ref ?? "" })}</p>
      </div>
    );
  }

  if (blocked) return <>{blocked}</>;
  const busy = pending || progress !== null;
  const shownError = error ?? (state.error ? ((F.errors as Record<string, string>)[state.error] ?? F.errors.generic) : null);

  return (
    <form ref={form} onSubmit={onSubmit} className="grid gap-6" noValidate>
      {token && <input type="hidden" name="token" value={token} />}
      <input type="hidden" name="locale" value={locale} />

      <fieldset>
        <legend className="text-[15px] font-semibold">{F.q1} <span className="font-normal text-muted">· {F.optional}</span></legend>
        <div className="mt-3 flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-xl p-1.5 transition hover:bg-surface-2 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent-soft">
              <input type="radio" name="rating" value={n} className="sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <Star aria-hidden className={cn("size-7 transition", n <= rating ? "fill-[#f5b301] text-[#f5b301]" : "text-line-strong")} />
              <span className="sr-only">{fmt(F.star, { n })}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-[15px] font-semibold">{F.q2}</span>
        <textarea name="content" required minLength={PROOF_LIMITS.contentMin} maxLength={PROOF_LIMITS.contentMax} rows={4}
          placeholder={F.q2Placeholder} className={cn(textareaClass, "mt-2")} />
      </label>

      <label className="block">
        <span className="text-[15px] font-semibold">{F.q3} <span className="font-normal text-muted">· {F.optional}</span></span>
        <textarea name="recommendation" maxLength={PROOF_LIMITS.recommendationMax} rows={2} className={cn(textareaClass, "mt-2")} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">{F.name}</span>
          <input name="authorName" required minLength={2} maxLength={80} defaultValue={defaults.name ?? ""} autoComplete="name" className={cn(inputClass, "mt-1.5")} />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-fg-2">{F.nameDisplay}</span>
          <select name="authorDisplay" defaultValue="first_name" className={cn(inputClass, "mt-1.5")}>
            {(["first_name", "full", "initials"] as const).map((m) => <option key={m} value={m}>{F.display[m]}</option>)}
          </select>
        </label>
        {mode === "ambassador" ? (
          <label className="block sm:col-span-2">
            <span className="text-[13px] font-medium text-fg-2">{F.profession} <span className="text-muted">· {F.optional}</span></span>
            <input name="profession" maxLength={80} placeholder={F.professionPlaceholder} className={cn(inputClass, "mt-1.5")} />
          </label>
        ) : (
          <>
            <label className="block">
              <span className="text-[13px] font-medium text-fg-2">{F.company} <span className="text-muted">· {F.optional}</span></span>
              <input name="companyName" maxLength={120} defaultValue={defaults.company ?? ""} autoComplete="organization" className={cn(inputClass, "mt-1.5")} />
            </label>
            <label className="block">
              <span className="text-[13px] font-medium text-fg-2">{F.activity} <span className="text-muted">· {F.optional}</span></span>
              <input name="activity" maxLength={120} className={cn(inputClass, "mt-1.5")} />
            </label>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------ optional video */}
      <section className="rounded-[22px] border border-line bg-surface-2/50 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><Video className="size-4 text-accent" aria-hidden />{F.videoTitle} <span className="font-normal text-muted">· {F.optional}</span></p>
        <p className="mt-1 text-[13px] text-muted">{F.videoHint}</p>
        {clip ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
            <video src={clip.url} controls playsInline preload="metadata" className="max-h-72 w-full rounded-2xl bg-black object-contain sm:w-64" />
            <button type="button" onClick={() => setClip(null)} className={buttonClass("ghost", "md")}><X className="size-4" />{F.retake}</button>
          </div>
        ) : videoStep === "recording" ? (
          <Recorder onDone={async (blob) => { const meta = await inspectVideo(blob); setClip({ blob, url: URL.createObjectURL(blob), ...meta }); setVideoStep("choose"); }}
            onCancel={(msg) => { setVideoStep("choose"); if (msg) setError(msg); }} />
        ) : videoStep === "skipped" ? (
          <button type="button" onClick={() => setVideoStep("choose")} className="mt-3 text-[13px] font-medium text-accent hover:underline">{F.videoTitle}</button>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <label className={cn(buttonClass("secondary", "md"), "cursor-pointer")}>
              <Upload className="size-4" />{F.upload}
              <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => pickVideo(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={() => setVideoStep("recording")} className={buttonClass("secondary", "md")}><Camera className="size-4" />{F.record}</button>
            <button type="button" onClick={() => setVideoStep("skipped")} className={buttonClass("ghost", "md")}>{F.skip}</button>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ optional photo / logo */}
      <section>
        <p className="text-[13px] font-medium text-fg-2">{F.imagesTitle} <span className="text-muted">· {F.optional}</span></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(mode === "client" ? (["photo", "logo"] as const) : (["photo"] as const)).map((k) => images[k] ? (
            <span key={k} className="inline-flex h-9 items-center gap-2 rounded-full bg-success-soft px-3 text-[13px] font-medium text-success">
              <CircleCheck className="size-4" />{k === "photo" ? F.photo : F.logo}
              <button type="button" onClick={() => setImages((x) => ({ ...x, [k]: null }))} aria-label={F.remove}><X className="size-3.5" /></button>
            </span>
          ) : (
            <label key={k} className={cn(buttonClass("ghost", "md"), "cursor-pointer border border-line")}>
              <ImagePlus className="size-4" />{k === "photo" ? F.photo : F.logo}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickImage(k, e.target.files?.[0])} />
            </label>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ consent (mandatory) */}
      <label className="flex items-start gap-3 rounded-[18px] border border-line bg-surface p-4">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
        <span>
          <span className="block text-[14.5px] font-medium leading-snug">{F.consent}</span>
          <span className="mt-1 block text-[12.5px] text-muted">{mode === "client" ? F.consentNoteClient : F.consentNote}</span>
        </span>
      </label>

      {shownError && <p role="alert" className="text-[13.5px] text-danger">{shownError}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} className={buttonClass("accent", "lg")}>
          {progress !== null ? fmt(F.uploading, { pct: progress }) : pending ? F.sending : F.submit}
        </button>
      </div>
    </form>
  );
}

/** In-browser recording (MediaRecorder), capped at PROOF_LIMITS.recordMaxMs. Portrait-friendly. */
function Recorder({ onDone, onCancel }: { onDone: (b: Blob) => void; onCancel: (error?: string) => void }) {
  const { t } = useI18n();
  const F = t.pf.form;
  const preview = useRef<HTMLVideoElement>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    (async () => {
      if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) return onCancel(F.recordUnsupported);
      const mime = pickRecorderMime("video", (x) => MediaRecorder.isTypeSupported(x));
      if (!mime) return onCancel(F.recordUnsupported);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } } });
      } catch {
        return onCancel(F.recordDenied);
      }
      if (cancelled) { stream.getTracks().forEach((x) => x.stop()); return; }
      if (preview.current) { preview.current.srcObject = stream; void preview.current.play().catch(() => {}); }
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 96_000 });
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => {
        stream?.getTracks().forEach((x) => x.stop());
        if (chunks.length) onDone(new Blob(chunks, { type: normalizeRecordedMime("video", r.mimeType, mime) }));
      };
      rec.current = r;
      const started = Date.now();
      r.start(500);
      timer = setInterval(() => {
        const ms = Date.now() - started;
        setElapsed(ms);
        if (ms >= PROOF_LIMITS.recordMaxMs && r.state !== "inactive") r.stop();
      }, 250);
    })();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (rec.current && rec.current.state !== "inactive") { rec.current.onstop = null; rec.current.stop(); }
      stream?.getTracks().forEach((x) => x.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once per mount
  }, []);

  return (
    <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row">
      <video ref={preview} muted playsInline className="aspect-[9/16] w-40 rounded-2xl bg-black object-cover" />
      <div className="grid gap-2">
        <p className="tabular flex items-center gap-2 text-[14px] font-medium"><span className="animate-pulse-dot size-2 rounded-full bg-danger" />{fmt(F.recording, { time: formatDuration(elapsed) })}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => rec.current?.state === "recording" && rec.current.stop()} className={buttonClass("primary", "md")}><Square className="size-3.5 fill-current" />{F.stop}</button>
          <button type="button" onClick={() => onCancel()} className={buttonClass("ghost", "md")}>{F.retake}</button>
        </div>
      </div>
    </div>
  );
}
