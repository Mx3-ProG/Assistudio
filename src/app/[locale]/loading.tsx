import { BrandLoader } from "@/components/ui/brand-loader";

export default function Loading() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-bg px-4 py-5 sm:px-6 sm:py-7">
      <div aria-hidden="true" className="mx-auto max-w-6xl animate-pulse">
        <div className="flex items-center justify-between border-b border-line pb-5">
          <div className="h-7 w-36 rounded-lg bg-surface-3" />
          <div className="flex gap-3">
            <div className="hidden h-9 w-20 rounded-full bg-surface-2 sm:block" />
            <div className="size-9 rounded-full bg-surface-3" />
          </div>
        </div>
        <div className="grid gap-5 pt-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded-xl bg-surface-3" />
            <div className="h-4 w-full max-w-xl rounded-lg bg-surface-2" />
            <div className="h-4 w-4/5 max-w-lg rounded-lg bg-surface-2" />
            <div className="mt-7 h-64 rounded-[var(--radius)] border border-line bg-surface shadow-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="h-36 rounded-[var(--radius)] border border-line bg-surface shadow-sm" />
            <div className="h-36 rounded-[var(--radius)] border border-line bg-surface shadow-sm" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 grid place-items-center bg-bg/78 backdrop-blur-[6px]">
        <BrandLoader />
      </div>
    </main>
  );
}
