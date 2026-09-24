import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-2",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};
export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function Stat({ label, value, hint, tone, className }: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode; tone?: "success" | "accent" | "warning"; className?: string }) {
  const color = tone === "success" ? "text-success" : tone === "accent" ? "text-accent" : tone === "warning" ? "text-warning" : "text-fg";
  return (
    <div className={cn("card p-4 sm:p-5", className)}>
      <div className={cn("tabular text-[26px] font-semibold leading-none tracking-[-0.03em] sm:text-[30px]", color)}>{value}</div>
      <div className="mt-2 text-[13px] text-muted">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-muted/80">{hint}</div>}
    </div>
  );
}

export function Progress({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, action }: { icon?: React.ReactNode; title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">{icon}</div>}
      <p className="max-w-sm text-[15px] text-muted">{title}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" }) {
  return (
    <p className={cn("rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed", tone === "warning" ? "bg-warning-soft text-fg-2" : "bg-surface-2 text-muted")}>
      {children}
    </p>
  );
}

export function Field({ label, hint, children, className }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-fg-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft";
export const textareaClass =
  "min-h-24 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-fg placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft";
