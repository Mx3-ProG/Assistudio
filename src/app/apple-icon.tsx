import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 42, background: "linear-gradient(135deg, #2f5bff 0%, #7a5cff 100%)" }}>
      <svg width="116" height="116" viewBox="0 0 64 64" fill="none">
        <path d="M13 39.5c2.15 2.65 6.18 4.15 11.62 4.15 6.75 0 10.78-2.98 10.78-7.55 0-4.32-2.96-6.2-9.72-7.56-5.14-1.03-6.74-1.88-6.74-3.78 0-1.89 2.13-3.24 5.38-3.24 3.24 0 5.93 1.08 7.55 2.97" stroke="#fff" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>,
    size,
  );
}
