/** Logo mark uses CSS gradients (no SVG <defs> ids that break when a copy is display:none). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span aria-hidden className="grid size-6 place-items-center rounded-[7px] bg-gradient-to-br from-accent to-accent-2">
        <svg viewBox="0 0 24 24" className="size-6">
          <path d="M7.5 15.2c.8 1 2.3 1.6 4.3 1.6 2.5 0 4-1.1 4-2.8 0-1.6-1.1-2.3-3.6-2.8-1.9-.4-2.5-.7-2.5-1.4 0-.7.8-1.2 2-1.2 1.2 0 2.2.4 2.8 1.1" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      </span>
      {/* Same wordmark as the Studio ATS site: STUDIO ▪ ATS. */}
      <span aria-hidden className="inline-flex items-center text-[15px] font-semibold uppercase tracking-[0.18em]">
        Studio<span className="mx-[0.45em] inline-block size-[5px] rounded-[1px] bg-accent" />ATS
      </span>
      <span className="sr-only">Studio ATS</span>
    </span>
  );
}
