"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/components/providers";
import { MacbookFrame } from "@/components/ui/macbook-frame";
import { cn } from "@/lib/cn";
import { useHelp } from "./help-context";
import { clock } from "@/lib/help/clock";

/**
 * Tutorial player: a real <video> inside the MacBook frame, with its own
 * controls — play/pause, ±10 s, timeline, sound, full screen — and chapters.
 * Plays a segment [start, end] of a recording; remembers where the partner
 * stopped and marks the tutorial done at 90 %.
 */
export function TutorialPlayer({ slug, src, poster, start = 0, end, chapters = [] }: {
  slug: string; src: string; poster?: string; start?: number; end?: number;
  chapters?: { at: number; label: string }[];
}) {
  const { t } = useI18n();
  const P = t.hp.player;
  const { state, saveVideo } = useHelp();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [now, setNow] = useState(start);
  const [stop, setStop] = useState(end ?? 0);
  const lastSave = useRef(0);
  const length = Math.max(0.1, stop - start);

  const persist = useCallback((t: number, force = false) => {
    if (!force && Date.now() - lastSave.current < 3000) return;
    lastSave.current = Date.now();
    saveVideo(slug, (t - start) / length, t);
  }, [saveVideo, slug, start, length]);

  const seek = (t: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(t, start), stop - 0.05);
    setNow(v.currentTime);
  };
  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime >= stop - 0.1 || v.currentTime < start - 0.5) v.currentTime = start;
      v.play().catch(() => {});
    } else v.pause();
  };
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const fullscreen = () => {
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.(); // Safari iOS: native player
  };

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const sync = () => { v.controls = document.fullscreenElement === v; };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Save where the partner stopped when leaving the page.
  useEffect(() => () => { const v = video.current; if (v && v.currentTime > start) persist(v.currentTime, true); }, [persist, start]);

  const onLoaded = () => {
    const v = video.current;
    if (!v) return;
    const stopAt = Math.min(end ?? v.duration, v.duration || Infinity);
    setStop(stopAt);
    const at = state.videos[slug]?.at;
    // Resume where it stopped, unless it was (almost) finished.
    v.currentTime = at && at > start + 2 && at < stopAt - 3 ? at : start;
    setNow(v.currentTime);
  };
  // Metadata may already be loaded before hydration attached onLoadedMetadata.
  useEffect(() => {
    const v = video.current;
    if (v && v.readyState >= 1) queueMicrotask(onLoaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTime = () => {
    const v = video.current;
    if (!v) return;
    // Never play outside the segment.
    if (v.currentTime < start - 0.5) { v.currentTime = start; return; }
    if (v.currentTime >= stop - 0.05 && !v.paused) {
      v.pause();
      persist(stop, true);
      return;
    }
    setNow(v.currentTime);
    if (!v.paused) persist(v.currentTime);
  };

  const round = "grid size-10 shrink-0 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const btn = `${round} text-fg hover:bg-surface-2`;
  const rel = Math.max(0, now - start);
  const activeChapter = chapters.reduce((acc, c, i) => (now >= c.at - 0.25 ? i : acc), -1);

  return (
    <div>
      <MacbookFrame screenRatio="1910 / 1080" className="mx-auto max-w-[920px]">
        <video
          ref={video}
          className="absolute inset-0 size-full object-cover object-top"
          poster={poster}
          preload="metadata"
          playsInline
          muted={muted}
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTime}
          onPlay={() => setPlaying(true)}
          onPause={() => { setPlaying(false); const v = video.current; if (v) persist(v.currentTime, true); }}
          onClick={toggle}
        >
          <source src={src} type="video/mp4" />
        </video>
        {!playing && (
          <button type="button" onClick={toggle} aria-label={P.play}
            className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 sm:size-16">
            <Play className="ms-0.5 size-6 fill-current sm:size-7" />
          </button>
        )}
      </MacbookFrame>

      {/* Controls under the device: big touch targets, readable on phones. */}
      <div className="mx-auto mt-8 flex max-w-[860px] flex-wrap items-center gap-1 rounded-[22px] border border-line bg-bg-elevated px-2 py-1.5 shadow-soft sm:mt-10 sm:flex-nowrap sm:gap-1.5 sm:px-3">
        <button type="button" onClick={toggle} aria-label={playing ? P.pause : P.play} className={`${round} bg-fg text-bg hover:opacity-90`}>
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="ms-0.5 size-4 fill-current" />}
        </button>
        <button type="button" onClick={() => seek(now - 10)} aria-label={P.back10} title={P.back10} className={btn}><RotateCcw className="size-[18px]" /></button>
        <button type="button" onClick={() => seek(now + 10)} aria-label={P.forward10} title={P.forward10} className={btn}><RotateCw className="size-[18px]" /></button>
        <span className="tabular order-last w-full px-2 pb-1 text-[12.5px] text-muted sm:order-none sm:w-auto sm:pb-0">{clock(rel)} / {clock(length)}</span>
        <input type="range" min={0} max={length} step={0.1} value={Math.min(rel, length)} aria-label={P.seek}
          onChange={(e) => seek(start + Number(e.target.value))}
          className="h-10 min-w-0 flex-1 cursor-pointer accent-[var(--accent)]" />
        <button type="button" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? P.unmute : P.mute} title={muted ? P.unmute : P.mute} className={btn}>
          {muted ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
        </button>
        <button type="button" onClick={fullscreen} aria-label={P.fullscreen} title={P.fullscreen} className={btn}><Maximize2 className="size-[18px]" /></button>
      </div>

      {chapters.length > 0 && (
        <nav aria-label={t.hp.videos.chapters} className="mx-auto mt-4 max-w-[860px]">
          <ol className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {chapters.map((c, i) => (
              <li key={c.at} className="shrink-0">
                <button type="button" onClick={() => { seek(c.at); video.current?.play().catch(() => {}); }} aria-current={i === activeChapter ? "true" : undefined}
                  className={cn("inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] transition",
                    i === activeChapter ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface hover:bg-surface-2")}>
                  <span className="tabular text-[12px] text-muted">{clock(c.at - start)}</span>{c.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}

/** "Mark as completed" / "I've read this guide". */
export function MarkDone({ slug, label }: { slug: string; label: string }) {
  const { t } = useI18n();
  const { state, markDone } = useHelp();
  const done = !!state.videos[slug]?.done;
  return (
    <button type="button" onClick={() => markDone(slug)} disabled={done}
      className={cn("inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition", done ? "bg-success-soft text-success" : "border border-line bg-surface-2 hover:bg-surface-3")}>
      {done ? `✓ ${t.hp.videos.completed}` : label}
    </button>
  );
}
