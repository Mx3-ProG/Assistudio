"use client";
import { useEffect, useState } from "react";
import {
  Images, Inbox, Users, CalendarDays, Mail, Repeat, Route, BarChart3, Check,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";

const FEATURES = [
  { key: "portfolio", icon: Images },
  { key: "leads", icon: Inbox },
  { key: "contacts", icon: Users },
  { key: "appointments", icon: CalendarDays },
  { key: "emails", icon: Mail },
  { key: "followups", icon: Repeat },
  { key: "journey", icon: Route },
  { key: "analytics", icon: BarChart3 },
] as const;
type Key = (typeof FEATURES)[number]["key"];

/** Interactive, illustrative mockup of the STUDIO product (no real data). */
export function ProductMockup() {
  const { t } = useI18n();
  const [active, setActive] = useState<Key>("leads");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setActive((k) => FEATURES[(FEATURES.findIndex((f) => f.key === k) + 1) % FEATURES.length].key);
    }, 3200);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0" role="tablist">
        {FEATURES.map(({ key, icon: Icon }) => (
          <li key={key}>
            <button
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => { setActive(key); setAuto(false); }}
              className={cn(
                "flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-start text-[14px] font-medium transition",
                active === key ? "bg-surface text-fg shadow-md ring-1 ring-line" : "text-muted hover:text-fg",
              )}
            >
              <Icon className={cn("size-4", active === key && "text-accent")} />
              {t.home.features[key]}
            </button>
          </li>
        ))}
      </ul>

      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-[40px] sm:-inset-6 bg-gradient-to-br from-accent/20 via-transparent to-accent-2/20 blur-2xl" />
        <div className="glass overflow-hidden rounded-[22px] shadow-lift">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ms-3 truncate rounded-md bg-surface-2 px-3 py-1 text-[11px] text-muted">studio · {t.home.features[active]}</span>
          </div>
          <div key={active} className="animate-rise min-h-[320px] p-5 sm:min-h-[380px] sm:p-7">
            <Panel k={active} />
          </div>
        </div>
      </div>
    </div>
  );
}

const bar = "rounded-full bg-surface-3";

function Panel({ k }: { k: Key }) {
  switch (k) {
    case "portfolio":
      return (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-xl" style={{ background: `linear-gradient(${140 + i * 25}deg, var(--accent) ${-40 + i * 8}%, var(--surface-3) 70%)`, opacity: 0.35 + (i % 3) * 0.2 }} />
          ))}
        </div>
      );
    case "leads":
      return (
        <div className="space-y-2.5">
          {["92", "85", "71", "64"].map((score, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
              <div className="grid size-9 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{String.fromCharCode(65 + i)}</div>
              <div className="flex-1 space-y-1.5">
                <div className={cn(bar, "h-2.5")} style={{ width: `${70 - i * 8}%` }} />
                <div className={cn(bar, "h-2")} style={{ width: `${45 - i * 4}%` }} />
              </div>
              <span className="tabular rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">{score}</span>
            </div>
          ))}
        </div>
      );
    case "contacts":
      return (
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="size-8 rounded-full bg-surface-3" />
              <div className={cn(bar, "h-2.5 flex-1")} style={{ maxWidth: `${50 + (i % 3) * 12}%` }} />
              <div className={cn(bar, "h-2.5 w-16")} />
            </div>
          ))}
        </div>
      );
    case "appointments":
      return (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className={cn("aspect-square rounded-lg border border-line", [3, 9, 10, 17, 23].includes(i) ? "bg-accent text-accent-fg" : "bg-surface")}>
              <span className="block p-1 text-[10px] opacity-70">{i + 1}</span>
            </div>
          ))}
        </div>
      );
    case "emails":
      return (
        <div className="mx-auto max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-md">
          <div className="mb-4 flex items-center gap-2 text-[12px] text-muted"><Mail className="size-3.5" /> →</div>
          <div className={cn(bar, "h-3 w-2/3")} />
          <div className="mt-4 space-y-2">
            {[100, 92, 96, 60].map((w, i) => <div key={i} className={cn(bar, "h-2")} style={{ width: `${w}%` }} />)}
          </div>
          <div className="mt-5 h-9 w-32 rounded-full bg-accent" />
        </div>
      );
    case "followups":
      return (
        <ol className="relative ms-3 space-y-5 border-s border-line ps-6">
          {["D+0", "D+2", "D+5", "D+10"].map((d, i) => (
            <li key={d} className="relative">
              <span className={cn("absolute -start-[31px] grid size-4 place-items-center rounded-full", i < 3 ? "bg-accent text-accent-fg" : "bg-surface-3")}>
                {i < 3 && <Check className="size-2.5" />}
              </span>
              <div className="text-[12px] font-semibold text-muted">{d}</div>
              <div className={cn(bar, "mt-2 h-2.5")} style={{ width: `${70 - i * 10}%` }} />
            </li>
          ))}
        </ol>
      );
    case "journey":
      return (
        <div className="flex h-full flex-col justify-center gap-2.5">
          {[100, 62, 38, 22, 12].map((w, i) => (
            <div key={i} className="mx-auto h-10 rounded-xl bg-gradient-to-r from-accent to-accent-2" style={{ width: `${w}%`, opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      );
    case "analytics":
      return (
        <div>
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-3">
                <div className={cn(bar, "h-4 w-12")} />
                <div className={cn(bar, "mt-2 h-2 w-16")} />
              </div>
            ))}
          </div>
          <svg viewBox="0 0 300 120" className="w-full">
            <defs>
              <linearGradient id="mk-a" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity=".35" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 100 C40 90 60 70 90 72 S150 40 180 45 S240 18 300 10 L300 120 L0 120Z" fill="url(#mk-a)" />
            <path d="M0 100 C40 90 60 70 90 72 S150 40 180 45 S240 18 300 10" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          </svg>
        </div>
      );
  }
}
