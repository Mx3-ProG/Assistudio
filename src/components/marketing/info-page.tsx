import { FileWarning } from "lucide-react";
import { Navbar } from "./navbar";

/** Simple institutional page. `placeholder` marks content awaiting legal validation. */
export function InfoPage({ title, body, placeholder, placeholderLabel, children }: {
  title: string; body?: string; placeholder?: string; placeholderLabel?: string; children?: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="display text-[40px] sm:text-[60px]">{title}</h1>
        {body && <p className="mt-6 text-[18px] leading-relaxed text-fg-2">{body}</p>}
        {placeholder && (
          <div className="mt-10 rounded-2xl border border-dashed border-warning/60 bg-warning-soft p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-warning">
              <FileWarning className="size-4" /> {placeholderLabel}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{placeholder}</p>
          </div>
        )}
        {children}
      </main>
    </>
  );
}
