"use client";
import { useEffect, useRef, useState } from "react";
import { Play, VideoOff, Star } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { formatDate } from "@/lib/money";
import { isPortrait, mediaUrl, type PublicTestimonial } from "@/lib/proof";
import { cn } from "@/lib/cn";
import { DemoBadge, VerifiedBadge } from "./badges";

/** Only one testimonial video plays at a time on a page. */
const PLAY_EVENT = "studio:proof-play";

/**
 * One testimonial. The same data renders as a text card or, when a video
 * exists, as a video card: poster first, the video file is only requested
 * when the visitor presses play. Identity and context come first; the rating
 * is a discreet detail.
 */
export function TestimonialCard({ item, className }: { item: PublicTestimonial; className?: string }) {
  const { t, locale } = useI18n();
  const T = t.pf.testimonials;
  const B = t.pf.badge;
  const context = [item.profession, item.companyName, item.activity].filter(Boolean).join(" · ");

  return (
    <article className={cn("card group/card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      {item.mediaType === "video" && <VideoPlayer item={item} />}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <header className="flex items-start gap-3">
          <Avatar item={item} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15.5px] font-semibold leading-tight">{item.displayName}</p>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{context || (item.type === "client" ? T.client : T.ambassador)}</p>
          </div>
        </header>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.proofType === "demo" && <DemoBadge label={B.example} hint={B.exampleHint} />}
          {item.verified && (
            <VerifiedBadge label={B.verified} hint={fmt(B.verifiedHint, { who: item.type === "client" ? B.verifiedClient : B.verifiedPartner })} />
          )}
          {item.service && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-fg-2">{t.pf.services[item.service]}</span>}
        </div>
        <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-fg-2">
          <p className="whitespace-pre-line">“{item.content}”</p>
        </blockquote>
        {item.recommendation && (
          <div className="mt-4 rounded-2xl bg-surface-2 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{T.hesitate}</p>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{item.recommendation}</p>
          </div>
        )}
        <footer className="mt-4 flex items-center justify-between gap-3 text-[12px] text-muted">
          <time dateTime={item.publishedOn}>{formatDate(item.publishedOn, locale)}</time>
          {item.rating != null && (
            <span className="inline-flex items-center gap-0.5" aria-label={fmt(T.rating, { n: item.rating })} role="img">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} aria-hidden className={cn("size-3", i < item.rating! ? "fill-current text-fg-2" : "text-line-strong")} />
              ))}
            </span>
          )}
        </footer>
      </div>
    </article>
  );
}

function Avatar({ item }: { item: PublicTestimonial }) {
  const [failed, setFailed] = useState(false);
  const src = item.hasPhoto ? mediaUrl(item.id, "photo") : item.hasLogo ? mediaUrl(item.id, "logo") : null;
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL behind a redirect; already resized at upload
      <img src={src} alt="" width={44} height={44} loading="lazy" decoding="async" onError={() => setFailed(true)}
        className={cn("size-11 shrink-0 rounded-full border border-line bg-surface object-cover", !item.hasPhoto && "rounded-xl object-contain p-1")} />
    );
  }
  const initials = item.displayName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-[14px] font-semibold text-accent">
      {initials || "·"}
    </span>
  );
}

function VideoPlayer({ item }: { item: PublicTestimonial }) {
  const { t } = useI18n();
  const T = t.pf.testimonials;
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [posterOk, setPosterOk] = useState(item.hasPoster);
  const ref = useRef<HTMLVideoElement>(null);
  const portrait = isPortrait(item.video);

  // Pause when another testimonial starts.
  useEffect(() => {
    const onOther = (e: Event) => { if ((e as CustomEvent<string>).detail !== item.id) ref.current?.pause(); };
    window.addEventListener(PLAY_EVENT, onOther);
    return () => window.removeEventListener(PLAY_EVENT, onOther);
  }, [item.id]);

  const frame = cn("relative w-full overflow-hidden bg-[#0b0d14]", portrait ? "mx-auto aspect-[9/16] max-h-[520px]" : "aspect-video");

  if (error) {
    return (
      <div className={cn(frame, "grid place-items-center text-white/70")}>
        <p className="flex items-center gap-2 px-6 text-center text-[13px]"><VideoOff className="size-4 shrink-0" aria-hidden />{T.unavailable}</p>
      </div>
    );
  }
  if (playing) {
    return (
      <div className={frame}>
        <video ref={ref} src={mediaUrl(item.id, "video")} controls autoPlay playsInline preload="metadata"
          poster={posterOk ? mediaUrl(item.id, "poster") : undefined}
          onPlay={() => window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: item.id }))}
          onError={() => setError(true)} className="size-full object-contain" />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} aria-label={fmt(T.play, { name: item.displayName })}
      className={cn(frame, "group/play block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft")}>
      {posterOk ? (
        // eslint-disable-next-line @next/next/no-img-element -- see Avatar
        <img src={mediaUrl(item.id, "poster")} alt="" loading="lazy" decoding="async" onError={() => setPosterOk(false)}
          className="size-full object-cover opacity-90 transition duration-500 group-hover/play:scale-[1.02] group-hover/play:opacity-100" />
      ) : (
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_70%_at_30%_20%,var(--accent),transparent)] opacity-50" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" aria-hidden />
      <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#111114] shadow-lift transition duration-300 group-hover/play:scale-105">
        <Play className="ms-0.5 size-6 fill-current" aria-hidden />
      </span>
      {item.video?.durationMs ? (
        <span className="tabular absolute bottom-3 end-3 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] font-medium text-white">
          {Math.floor(item.video.durationMs / 60000)}:{String(Math.round((item.video.durationMs % 60000) / 1000)).padStart(2, "0")}
        </span>
      ) : null}
    </button>
  );
}
