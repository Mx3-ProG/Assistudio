"use client";
import { useState } from "react";
import { Mail, MessageCircle, Briefcase as Linkedin, Camera as Instagram, Phone, ShieldQuestion, Image as ImageIcon, PlayCircle, Presentation, Download } from "lucide-react";
import { useI18n } from "@/components/providers";
import { CopyButton } from "@/components/ui/copy-button";
import { buttonClass } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";
import type { SalesAsset, AssetType } from "@/content/sales-kit";
import { cn } from "@/lib/cn";

const SECTIONS: { type: AssetType; icon: typeof Mail }[] = [
  { type: "email", icon: Mail }, { type: "whatsapp", icon: MessageCircle }, { type: "linkedin", icon: Linkedin },
  { type: "instagram", icon: Instagram }, { type: "cold_call", icon: Phone }, { type: "objection", icon: ShieldQuestion },
  { type: "visual", icon: ImageIcon }, { type: "video", icon: PlayCircle }, { type: "presentation", icon: Presentation },
];

export function SalesKit({ assets, link }: { assets: SalesAsset[]; link: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState<AssetType>("email");
  const list = assets.filter((a) => a.type === active);
  // Personal link is injected so copied messages are ready to send.
  const withLink = (s: string) => s.replace(/\[(your link|votre lien)\]/gi, link);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {SECTIONS.map(({ type, icon: Icon }) => {
          const count = assets.filter((a) => a.type === type).length;
          return (
            <button key={type} onClick={() => setActive(type)} aria-pressed={active === type}
              className={cn("flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-[14px] transition",
                active === type ? "bg-surface font-medium shadow-sm ring-1 ring-line" : "text-fg-2 hover:bg-surface-2")}>
              <Icon className={cn("size-4", active === type ? "text-accent" : "text-muted")} />
              <span className="flex-1 text-start">{t.dash.salesKit.sections[type]}</span>
              {count > 0 && <span className="tabular text-[12px] text-muted">{count}</span>}
            </button>
          );
        })}
      </nav>
      <div className="grid content-start gap-4">
        {["email", "whatsapp", "linkedin", "instagram", "cold_call"].includes(active) && <Notice>{t.dash.salesKit.personalise}</Notice>}
        {list.length === 0 && <div className="card p-10 text-center text-[14px] text-muted">{t.dash.salesKit.assetSoon}</div>}
        {list.map((a) => (
          <article key={a.id} className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[16px] font-semibold">{a.title}</h3>
              {a.body ? <CopyButton track="sales_script_copied" value={withLink(a.body)} /> : a.filePath ? (
                <a href={a.filePath} download className={buttonClass("secondary", "sm")}><Download className="size-4" />{t.common.download}</a>
              ) : null}
            </div>
            {a.body && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-fg-2">{withLink(a.body)}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
