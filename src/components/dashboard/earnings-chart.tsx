"use client";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers";
import { formatMoney, formatDate } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { EarningsPoint } from "@/lib/data/types";

const RANGES = ["7d", "30d", "90d", "1y", "all"] as const;
type R = (typeof RANGES)[number];
const DAYS: Record<R, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: 0 };

/** Cumulative validated earnings. Pending money is never plotted as earned. */
export function EarningsChart({ points }: { points: EarningsPoint[] }) {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<R>("1y");
  const [hover, setHover] = useState<number | null>(null);

  const series = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const first = points.length ? new Date(points[0].date) : today;
    const start = range === "all" ? first : new Date(today.getTime() - DAYS[range] * 86_400_000);
    const n = Math.max(2, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1);
    let acc = points.filter((p) => new Date(p.date) < start).reduce((a, p) => a + p.cents, 0);
    const byDay = new Map<string, number>();
    for (const p of points) byDay.set(p.date, (byDay.get(p.date) ?? 0) + p.cents);
    const out: EarningsPoint[] = [];
    for (let i = 0; i < n; i++) {
      const key = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
      acc += byDay.get(key) ?? 0;
      out.push({ date: key, cents: acc });
    }
    return out;
  }, [points, range]);

  const W = 640, H = 200, P = 6;
  const max = Math.max(...series.map((s) => s.cents), 1);
  const x = (i: number) => P + (i / (series.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P - 10);
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s.cents).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1)} ${H} L${x(0)} ${H} Z`;
  const cur = hover !== null ? series[hover] : series[series.length - 1];

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">{t.dash.earningsTitle}</h2>
          <p className="tabular mt-1 text-[28px] font-semibold tracking-[-0.03em]">{formatMoney(cur.cents, locale)}</p>
          <p className="text-[12px] text-muted">{hover !== null ? formatDate(cur.date, locale) : t.dash.earningsHint}</p>
        </div>
        <div className="inline-flex rounded-full bg-surface-2 p-0.5" role="tablist">
          {RANGES.map((r) => (
            <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)}
              className={cn("h-7 rounded-full px-2.5 text-[12px] font-medium transition sm:px-3", range === r ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>
              {t.dash.ranges[r]}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 h-44 w-full touch-none sm:h-52"
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, i)));
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={t.dash.earningsTitle}
      >
        <defs>
          <linearGradient id="earn-a" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#earn-a)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="var(--line-strong)" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(series[hover].cents)} r="4" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
    </div>
  );
}
