export function DemoBanner({ text }: { text: string }) {
  return (
    <div role="note" className="relative z-[60] flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-[12px] font-semibold text-black">
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-black/70" />
      {text}
    </div>
  );
}
