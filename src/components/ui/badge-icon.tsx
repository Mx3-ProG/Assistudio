import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Red count on a navigation item: same look everywhere (header icons, sidebar, admin tabs). */
export function RedCount({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span className={cn("tabular grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10.5px] font-semibold leading-none text-white", className)}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Header icon with a red dot + count when something is waiting. */
export function BadgeIcon({ href, icon: Icon, count, label, className }: {
  href: string; icon: LucideIcon; count: number; label: string; className?: string;
}) {
  return (
    <Link href={href} aria-label={count > 0 ? `${label} (${count})` : label} title={label}
      className={cn("relative grid size-9 place-items-center rounded-full hover:bg-surface-2", className)}>
      <Icon className="size-[18px]" />
      <RedCount n={count} className="absolute -end-0.5 -top-0.5 ring-2 ring-bg" />
    </Link>
  );
}
