import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@fontsource/noto-sans/files/*.woff2",
      "./node_modules/@fontsource/noto-sans/files/noto-sans-latin-{400,700}-normal.woff",
      "./node_modules/@fontsource/noto-naskh-arabic/files/*.woff2",
      "./node_modules/@fontsource/noto-sans-devanagari/files/*.woff2",
      "./node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff",
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
};

export default nextConfig;
