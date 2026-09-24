"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";
import { useStored } from "@/lib/hooks/use-stored";

type Theme = "light" | "dark" | "system";

function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === "system") delete root.dataset.theme;
  else root.dataset.theme = next;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const [stored, setStored] = useStored("studio-theme");
  const theme: Theme = stored === "light" || stored === "dark" ? stored : "system";

  function apply(next: Theme) {
    applyTheme(next);
    setStored(next === "system" ? null : next);
  }

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: t.common.themeLight },
    { value: "dark", icon: Moon, label: t.common.themeDark },
    { value: "system", icon: Monitor, label: t.common.themeSystem },
  ];

  return (
    <div role="radiogroup" aria-label={t.common.theme} className={cn("inline-flex rounded-full border border-line bg-surface-2 p-0.5", className)}>
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => apply(value)}
          className={cn("grid size-7 place-items-center rounded-full transition", theme === value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
