/**
 * The recorded tour of the real partner space, played inside the home's
 * MacBook (#demo). Default: the files in /public/demo/. To change the video,
 * replace those files, or point the env vars at other ones (e.g. a CDN).
 *
 * Current video: 1910×1080 screen recording with sound, 2 min, H.264 + AAC,
 * remuxed with `ffmpeg -i in.mp4 -c copy -movflags +faststart` so playback
 * starts before the whole file is downloaded. A new recording should keep the
 * same ratio (or update `screenRatio`), be faststart, and come with a poster
 * (a representative frame, WebP, same ratio).
 */
const src = (v: string | undefined) => (v && /^(https:\/\/|\/)/.test(v) ? v : "");

export const partnerDemo = {
  /** H.264 MP4 — plays everywhere, including Safari iOS. Empty = no video yet. */
  videoSrc: src(process.env.PARTNER_DEMO_VIDEO) || "/demo/partner-space.mp4",
  /** Optional lighter WebM, offered first to browsers that support it. */
  webmSrc: src(process.env.PARTNER_DEMO_VIDEO_WEBM),
  /** Image shown before the video loads (and when autoplay is refused). */
  posterSrc: src(process.env.PARTNER_DEMO_POSTER) || "/demo/partner-space-poster.webp",
  /** The video has sound: shows the "Turn sound on" button. Sound never starts by itself. */
  hasAudio: process.env.PARTNER_DEMO_AUDIO !== "false",
  autoplay: true,
  /** Restarts at the end of every cycle, indefinitely. */
  loop: true,
  /** Inner ratio of the MacBook screen — match the recording to avoid cropping. */
  screenRatio: "1910 / 1080",
  fit: "cover" as "cover" | "contain",
};

export type PartnerDemoConfig = typeof partnerDemo;
