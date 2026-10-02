"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PanelsTopLeft, Rocket, Star, Target } from "lucide-react";
import { cn } from "@/lib/cn";

const icons = { home: Home, start: Rocket, targets: Target, pages: PanelsTopLeft, favorites: Star } as const;

export function SalesCenterSubnav({ label, items }: {
  label: string;
  items: { key: keyof typeof icons; href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <ul className="flex min-w-max gap-1 rounded-2xl border border-line bg-bg-elevated/70 p-1 shadow-sm">
        {items.map(({ key, href, label: itemLabel }) => {
          const Icon = icons[key];
          const active = key === "home" ? pathname === href : pathname.startsWith(href);
          return <li key={key}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-medium transition",
                active ? "bg-surface text-fg shadow-sm" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className={cn("size-4", active ? "text-accent" : "text-muted")} />
              {itemLabel}
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  );
}
