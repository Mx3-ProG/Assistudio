"use client";
import { Mail, Download } from "lucide-react";
import { useI18n } from "@/components/providers";
import { CopyButton } from "@/components/ui/copy-button";
import { buttonClass } from "@/components/ui/button";

const Brand = {
  whatsapp: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2 1-2.3.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" /></svg>),
  linkedin: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm7 0h3.8v1.5h.1c.5-1 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6v5.4h-4v-4.8c0-1.2 0-2.6-1.6-2.6s-1.9 1.3-1.9 2.5v4.9H10v-11Z" /></svg>),
  x: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M17.5 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.4l4.4 5.9L17.5 3Zm-1.1 16.2h1.7L7.7 4.7H5.9l10.5 14.5Z" /></svg>),
  facebook: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.4V21h3.1Z" /></svg>),
};

export function SharePanel({ url, qrDataUrl }: { url: string; qrDataUrl: string }) {
  const { t } = useI18n();
  const msg = `${t.dash.link.shareMessage} ${url}`;
  const e = encodeURIComponent;
  const shares = [
    { key: "WhatsApp", href: `https://wa.me/?text=${e(msg)}`, icon: Brand.whatsapp },
    { key: "Email", href: `mailto:?subject=${e("STUDIO")}&body=${e(msg)}`, icon: (p: React.SVGProps<SVGSVGElement>) => <Mail {...(p as object)} /> },
    { key: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, icon: Brand.linkedin },
    { key: "X", href: `https://x.com/intent/post?text=${e(t.dash.link.shareMessage)}&url=${e(url)}`, icon: Brand.x },
    { key: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`, icon: Brand.facebook },
  ];

  return (
    <div className="card relative overflow-hidden p-5 sm:p-8">
      <div className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">{t.dash.link.title}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={url} onFocus={(ev) => ev.currentTarget.select()} aria-label={t.dash.link.title}
              className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-4 font-mono text-[14px] outline-none sm:text-[15px]" />
            <CopyButton value={url} variant="accent" size="lg" />
          </div>
          <p className="mt-6 text-[13px] font-medium text-muted">{t.dash.link.share}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {shares.map(({ key, href, icon: Icon }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
                <Icon className="size-4" /> {key}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          <img src={qrDataUrl} alt={t.dash.link.qr} width={168} height={168} className="rounded-2xl bg-white p-2.5 shadow-md" />
          <a href={qrDataUrl} download="studio-qr.png" className={buttonClass("ghost", "sm")}>
            <Download className="size-4" /> {t.dash.link.downloadQr}
          </a>
        </div>
      </div>
    </div>
  );
}
