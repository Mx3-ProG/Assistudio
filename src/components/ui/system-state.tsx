"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, House, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/marketing/logo";
import { buttonClass } from "@/components/ui/button";

export function SystemState({
  code,
  eyebrow,
  title,
  body,
  locale,
  homeLabel,
  backLabel,
  retryLabel,
  onRetry,
}: {
  code: string;
  eyebrow: string;
  title: string;
  body: string;
  locale: string;
  homeLabel: string;
  backLabel?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();

  return (
    <main className="relative isolate grid min-h-dvh overflow-hidden bg-bg px-4 py-5 sm:px-6 sm:py-7">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-14rem] size-[32rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[-15rem] right-[-12rem] size-[36rem] rounded-full bg-accent-2/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(var(--fg)_1px,transparent_1px),linear-gradient(90deg,var(--fg)_1px,transparent_1px)] [background-size:52px_52px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href={`/${locale}`} aria-label="Studio ATS">
            <Logo />
          </Link>
          <span className="rounded-full border border-line bg-surface/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted shadow-sm backdrop-blur">
            {eyebrow}
          </span>
        </header>

        <section className="flex flex-1 items-center py-10 sm:py-16">
          <div className="card relative grid w-full overflow-hidden p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
            <div className="relative z-10 flex flex-col justify-center py-4 lg:py-10">
              <p className="font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
              <h1 className="display mt-5 max-w-2xl text-[clamp(2.7rem,7vw,5.8rem)] text-gradient">{title}</h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted sm:text-base">{body}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                {onRetry && retryLabel ? (
                  <button type="button" onClick={onRetry} className={buttonClass("accent", "lg")}>
                    <RefreshCw className="size-4" />
                    {retryLabel}
                  </button>
                ) : null}
                <Link href={`/${locale}`} className={buttonClass(onRetry ? "secondary" : "accent", "lg")}>
                  <House className="size-4" />
                  {homeLabel}
                </Link>
                {backLabel ? (
                  <button type="button" onClick={() => router.back()} className={buttonClass("ghost", "lg")}>
                    <ArrowLeft className="flip-rtl size-4" />
                    {backLabel}
                  </button>
                ) : null}
              </div>
            </div>

            <div aria-hidden className="relative mt-10 grid min-h-72 place-items-center lg:mt-0 lg:min-h-[28rem]">
              <span className="absolute select-none font-mono text-[clamp(9rem,25vw,19rem)] font-semibold leading-none tracking-[-0.12em] text-fg/[0.035]">
                {code}
              </span>
              <div className="relative grid size-48 place-items-center rounded-[2.75rem] border border-line bg-surface/70 shadow-[0_40px_100px_-45px_var(--accent)] backdrop-blur-xl sm:size-60">
                <div className="absolute inset-5 rounded-[2rem] border border-accent/10" />
                <Image src="/brand/studio-mark.png" alt="" width={176} height={176} priority className="relative size-36 object-contain drop-shadow-[0_20px_35px_rgba(47,91,255,0.3)] sm:size-44" />
              </div>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-line pt-5 text-[12px] text-muted">
          <span>Studio ATS</span>
          <span className="font-mono">{code}</span>
        </footer>
      </div>
    </main>
  );
}
