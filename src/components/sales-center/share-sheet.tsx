"use client";
import { useEffect, useState } from "react";
import { Mail, MessageCircle, QrCode, Share2, Download } from "lucide-react";
import QRCode from "qrcode";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { trackUsage } from "@/app/actions/sales-center";
import { TrackedCopy } from "./tracked-copy";

/** Every share is an explicit action of the affiliate — nothing is ever posted automatically. */
export function ShareSheet({ url, pageId, title }: { url: string; pageId?: string; title?: string }) {
  const { t } = useI18n();
  const P = t.sc.pages;
  const [qr, setQr] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after mount
  useEffect(() => setCanShare(typeof navigator !== "undefined" && !!navigator.share), []);
  const text = `${P.shareText} ${url}`;
  const e = encodeURIComponent;
  const log = () => void trackUsage("page_share", { pageId });
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <TrackedCopy value={url} label={P.copyLink} variant="accent" size="md" />
        {canShare && (
          <button type="button" className={buttonClass("secondary", "md")}
            onClick={() => { log(); navigator.share({ title: title ?? "STUDIO", text: P.shareText, url }).catch(() => undefined); }}>
            <Share2 className="size-4" />{P.nativeShare}
          </button>
        )}
        <a onClick={log} href={`https://wa.me/?text=${e(text)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}><MessageCircle className="size-4" />WhatsApp</a>
        <a onClick={log} href={`mailto:?subject=${e(title ?? "STUDIO")}&body=${e(text)}`} className={buttonClass("secondary", "md")}><Mail className="size-4" />Email</a>
        <a onClick={log} href={`https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>LinkedIn</a>
        <button type="button" className={buttonClass("secondary", "md")}
          onClick={async () => setQr(qr ? null : await QRCode.toDataURL(url, { margin: 1, width: 320 }))}>
          <QrCode className="size-4" />{P.qr}
        </button>
      </div>
      {qr && (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          <img src={qr} alt={P.qr} width={144} height={144} className="rounded-xl bg-white p-2" />
          <a href={qr} download="studio-page-qr.png" className={buttonClass("ghost", "sm")}><Download className="size-4" />{t.common.download}</a>
        </div>
      )}
      <p className="text-[12px] text-muted">{P.shareNote}</p>
    </div>
  );
}
