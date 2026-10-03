"use client";
import { useRef, useState } from "react";
import { PlayCircle, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/analytics/client";

/**
 * "Watch a demo": opens the Studio demo (STUDIO_DEMO_URL) in a native dialog.
 * A video file plays in <video>; anything else is an embeddable player
 * (YouTube /embed/, Vimeo, Loom…). Nothing is mounted until the dialog opens,
 * so the page makes no third-party request on load.
 */
export function DemoButton({ url, label, closeLabel }: { url: string; label: string; closeLabel: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(url);
  const open = () => {
    track("studio_demo_click", { placement: "demo" });
    setOpened(true);
    ref.current?.showModal();
  };
  return (
    <>
      <button type="button" onClick={open} className={buttonClass("secondary", "lg")}>
        <PlayCircle className="size-4" />{label}
      </button>
      <dialog ref={ref} aria-label={label} onClose={() => setOpened(false)}
        className="m-auto w-[min(960px,calc(100vw-32px))] overflow-hidden rounded-[24px] bg-black p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm">
        <form method="dialog" className="absolute end-3 top-3 z-10">
          <button className="grid size-9 place-items-center rounded-full bg-white/15 hover:bg-white/25" aria-label={closeLabel}><X className="size-4" /></button>
        </form>
        <div className="aspect-video w-full">
          {opened && (isFile
            ? <video src={url} controls playsInline autoPlay className="size-full" />
            : <DemoFrame url={url} title={label} />)}
        </div>
      </dialog>
    </>
  );
}

function DemoFrame({ url, title }: { url: string; title: string }) {
  return (
    <iframe
      src={url} title={title} loading="lazy" className="size-full"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
