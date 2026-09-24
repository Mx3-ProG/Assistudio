"use client";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  function change(next: Locale) {
    const parts = pathname.split("/");
    parts[1] = next;
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
    router.push(parts.join("/") || `/${next}`);
  }

  return (
    <label className={cn("relative inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface-2 ps-2.5 pe-2 text-[13px] text-fg-2", className)}>
      <Globe className="size-3.5 text-muted" aria-hidden />
      <span className="sr-only">{t.common.language}</span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value as Locale)}
        className="appearance-none bg-transparent pe-1 font-medium outline-none"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeMeta[l].label}
          </option>
        ))}
      </select>
    </label>
  );
}
