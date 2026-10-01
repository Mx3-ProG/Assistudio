/**
 * Recording helpers — pure (no DOM access): callers pass the browser's
 * `MediaRecorder.isTypeSupported` so this stays testable.
 */
import { baseMime, kindForMime } from "./policy.ts";

const AUDIO_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/aac"];
const VIDEO_CANDIDATES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

/** The first recorder MIME type the browser supports that the server also accepts. */
export function pickRecorderMime(kind: "audio" | "video", isTypeSupported: (t: string) => boolean): string | null {
  for (const t of kind === "audio" ? AUDIO_CANDIDATES : VIDEO_CANDIDATES) {
    if (kindForMime(t) === kind && isTypeSupported(t)) return t;
  }
  return null;
}

/** Recorders may report "video/webm" for an audio-only stream; force the expected family. */
export function normalizeRecordedMime(kind: "audio" | "video", reported: string, fallback: string): string {
  const base = baseMime(reported || fallback);
  if (kindForMime(base) === kind) return base;
  const swapped = base.replace(/^(audio|video)\//, `${kind}/`);
  return kindForMime(swapped) === kind ? swapped : baseMime(fallback);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const URL_RE = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;

/** Splits text into plain and link segments (rendered as text by React — never HTML). */
export function linkify(text: string): Array<{ type: "text" | "link"; value: string }> {
  const out: Array<{ type: "text" | "link"; value: string }> = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ type: "text", value: text.slice(last, i) });
    out.push({ type: "link", value: m[0] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}
