"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MESSAGE_LIMITS } from "@/lib/messaging/policy";
import { normalizeRecordedMime, pickRecorderMime } from "@/lib/messaging/media";

export type RecorderError = "denied" | "unsupported";
export type Recording = { blob: Blob; kind: "audio" | "video"; durationMs: number };

/**
 * Voice / video message recorder (MediaRecorder). Stops by itself at the
 * per-kind cap; `stop(true)` resolves with the recording, `stop(false)` discards.
 */
export function useRecorder(onDone: (r: Recording) => void) {
  const [kind, setKind] = useState<"audio" | "video" | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const keep = useRef(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    rec.current?.stream.getTracks().forEach((t) => t.stop());
    rec.current = null;
    setStream(null);
    setKind(null);
    setElapsed(0);
  }, []);

  const stop = useCallback((send: boolean) => {
    keep.current = send;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    else cleanup();
  }, [cleanup]);

  const start = useCallback(async (k: "audio" | "video"): Promise<RecorderError | null> => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unsupported";
    const mime = pickRecorderMime(k, (t) => MediaRecorder.isTypeSupported(t));
    if (!mime) return "unsupported";
    let s: MediaStream;
    try {
      s = await navigator.mediaDevices.getUserMedia(k === "audio"
        ? { audio: { echoCancellation: true, noiseSuppression: true } }
        : { audio: true, video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } } });
    } catch {
      return "denied";
    }
    const r = new MediaRecorder(s, { mimeType: mime, audioBitsPerSecond: 64_000, videoBitsPerSecond: k === "video" ? 1_000_000 : undefined });
    chunks.current = [];
    keep.current = true;
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = () => {
      const durationMs = Date.now() - started.current;
      if (keep.current && chunks.current.length) {
        const type = normalizeRecordedMime(k, r.mimeType, mime);
        doneRef.current({ blob: new Blob(chunks.current, { type }), kind: k, durationMs });
      }
      cleanup();
    };
    rec.current = r;
    started.current = Date.now();
    r.start(250);
    setStream(s);
    setKind(k);
    timer.current = setInterval(() => {
      const ms = Date.now() - started.current;
      setElapsed(ms);
      if (ms >= MESSAGE_LIMITS.maxRecordMs[k]) stop(true);
    }, 200);
    return null;
  }, [cleanup, stop]);

  useEffect(() => () => { keep.current = false; rec.current?.stop(); }, []);

  return { kind, elapsed, stream, start, stop };
}
