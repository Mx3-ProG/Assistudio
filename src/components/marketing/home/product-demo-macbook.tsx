"use client";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { MacbookFrame } from "@/components/ui/macbook-frame";

export interface ProductDemoLabels {
  video: string;
  play: string;
  pause: string;
  soundOn: string;
  soundOff: string;
  fullscreen: string;
  placeholder: string;
}

/**
 * A recorded tour of the real app, played in a real <video> masked by a
 * MacBook screen. Nothing is downloaded before the device nears the viewport;
 * it autoplays muted only while ≥ 60 % visible (never with reduced motion or
 * Data Saver), pauses when scrolled away, and sound only ever starts on click.
 * Without a `videoSrc`, the screen shows a labelled placeholder — never a fake demo.
 */
export function ProductDemoMacbook({
  videoSrc, webmSrc, posterSrc, autoplay = true, loop = true, hasAudio = false,
  screenRatio = "16 / 10", fit = "cover", labels, annotations = [],
}: {
  videoSrc: string; webmSrc?: string; posterSrc?: string; autoplay?: boolean; loop?: boolean; hasAudio?: boolean;
  screenRatio?: string; fit?: "cover" | "contain"; labels: ProductDemoLabels; annotations?: string[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [shown, setShown] = useState(false);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  // Set when the visitor pauses: scrolling back must not restart the video against their will.
  const userPaused = useRef(false);
  const visible = useRef(false);

  const canAutoplay = () => {
    if (!autoplay || userPaused.current) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !conn?.saveData;
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // Entrance + start fetching a little before the device is on screen.
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setShown(true);
      setLoad(true);
      near.disconnect();
    }, { rootMargin: "300px 0px" });
    // Autoplay while well in view, pause when it leaves.
    const view = new IntersectionObserver(([e]) => {
      visible.current = e.intersectionRatio >= 0.6;
      const v = video.current;
      if (!v || !videoSrc) return;
      if (visible.current && v.paused && canAutoplay()) v.play().catch(() => {});
      else if (!visible.current && !v.paused) v.pause();
    }, { threshold: [0, 0.6] });
    near.observe(el);
    view.observe(el);
    return () => { near.disconnect(); view.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc]);

  // Sources are only rendered once `load` is set: (re)load them, then autoplay if the device is already in view.
  useEffect(() => {
    const v = video.current;
    if (!load || !v || !videoSrc) return;
    v.load();
    if (visible.current && canAutoplay()) v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, videoSrc]);

  // Back from another tab: browsers pause background video — resume the loop if it should be running.
  useEffect(() => {
    const resume = () => {
      const v = video.current;
      if (document.visibilityState === "visible" && v?.paused && visible.current && canAutoplay()) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const sync = () => { v.controls = document.fullscreenElement === v; };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      setLoad(true);
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) { userPaused.current = false; v.play().catch(() => {}); }
  };
  const fullscreen = () => {
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    setLoad(true);
    if (v.requestFullscreen) v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.(); // Safari iOS: native player
  };

  const pill = "grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-10 [&_svg]:size-3.5 sm:[&_svg]:size-4";

  return (
    <div ref={root} className="relative -mx-2 max-w-[1240px] sm:mx-auto">
      <div
        className={cn(
          "relative mx-auto max-w-[940px] transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none",
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-[25px] scale-[0.97] opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100",
        )}
      >
        <MacbookFrame screenRatio={screenRatio} className="demo-parallax">
          {videoSrc ? (
            <>
              <video
                ref={video}
                className={cn("absolute inset-0 size-full", fit === "cover" ? "object-cover object-top" : "object-contain")}
                poster={load && posterSrc ? posterSrc : undefined}
                muted={muted}
                loop={loop}
                playsInline
                preload={load ? "metadata" : "none"}
                aria-label={labels.video}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                // `loop` already restarts it; this only guards browsers that still fire `ended` at the end of a cycle.
                onEnded={(e) => { if (loop) { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}); } }}
                onClick={toggle}
              >
                {load && webmSrc && <source src={webmSrc} type="video/webm" />}
                {load && <source src={videoSrc} type="video/mp4" />}
              </video>
              {!playing && (
                <button type="button" onClick={toggle} aria-label={labels.play}
                  className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/70 sm:size-16">
                  <Play className="ms-0.5 size-6 fill-current sm:size-7" />
                </button>
              )}
              <div className="absolute bottom-1.5 end-1.5 flex gap-1 sm:bottom-3 sm:end-3 sm:gap-2">
                <button type="button" onClick={toggle} aria-label={playing ? labels.pause : labels.play} className={pill}>
                  {playing ? <Pause className="size-4 fill-current" /> : <Play className="ms-0.5 size-4 fill-current" />}
                </button>
                {hasAudio && (
                  <button type="button" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? labels.soundOn : labels.soundOff}
                    className="flex h-8 items-center gap-1 rounded-full bg-black/55 px-2.5 text-[11.5px] sm:gap-1.5 sm:px-3 sm:text-[12.5px] font-medium text-white backdrop-blur-md transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-10">
                    {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
                    <span aria-hidden>{muted ? labels.soundOn : labels.soundOff}</span>
                  </button>
                )}
                <button type="button" onClick={fullscreen} aria-label={labels.fullscreen} className={pill}>
                  <Maximize2 className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(70%_60%_at_50%_40%,#1b2550,#07080b)] p-4 text-center">
              <p className="max-w-xs text-[13px] font-medium text-white/70 sm:text-[15px]">{labels.placeholder}</p>
            </div>
          )}
        </MacbookFrame>
      </div>

      {annotations.length > 0 && (
        <>
          {/* Wide screens: discreet notes beside the device, pointing at it. Never over the screen. */}
          <ul className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden>
            {annotations.slice(0, 3).map((a, i) => (
              <li key={a} className={cn(
                "absolute flex items-center gap-2 transition-opacity delay-500 duration-700",
                shown ? "opacity-100" : "opacity-0",
                i === 0 && "start-0 top-[16%]", i === 1 && "end-0 top-[42%] flex-row-reverse", i === 2 && "start-0 top-[68%]",
              )}>
                <span className="glass max-w-[150px] rounded-2xl px-3.5 py-2 text-[13px] font-medium leading-snug text-fg-2 shadow-soft">{a}</span>
                <span className="h-px w-6 bg-accent/40" />
                <span className="size-1.5 rounded-full bg-accent" />
              </li>
            ))}
          </ul>
          <ul className="mt-10 flex flex-wrap justify-center gap-2 px-2 xl:sr-only">
            {annotations.slice(0, 3).map((a) => (
              <li key={a} className="glass rounded-full px-3 py-1 text-[12.5px] font-medium text-fg-2">{a}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
