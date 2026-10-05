import { cn } from "@/lib/cn";

/**
 * A space-grey MacBook drawn in CSS: aluminium edge, thin black bezel, camera,
 * hinge and base. Purely a frame — `children` fill the screen, which masks them
 * (overflow hidden) at `screenRatio`. Proportions are percentages of the width,
 * so it scales without distortion from phones to large screens.
 */
export function MacbookFrame({ screenRatio = "16 / 10", className, screenClassName, children }: {
  screenRatio?: string; className?: string; screenClassName?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="mx-auto w-[94%] rounded-t-[clamp(12px,2.2vw,24px)] bg-gradient-to-b from-[#4a4b51] via-[#2b2c31] to-[#1c1d21] p-[0.45%] shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] sm:w-[86%]">
        <div className="relative rounded-t-[clamp(10px,2vw,21px)] bg-[#09090b] px-[1.5%] pb-[2%] pt-[2.4%]">
          <span className="absolute left-1/2 top-[0.9%] size-[clamp(3px,0.45vw,5px)] -translate-x-1/2 rounded-full bg-[#1f2a36] ring-1 ring-white/5" aria-hidden />
          <div className={cn("relative overflow-hidden rounded-[clamp(2px,0.35vw,4px)] bg-black", screenClassName)} style={{ aspectRatio: screenRatio }}>
            {children}
          </div>
        </div>
      </div>
      <div className="relative mx-auto h-[clamp(10px,1.7vw,19px)] w-full rounded-b-[clamp(10px,1.8vw,20px)] rounded-t-[2px] bg-gradient-to-b from-[#5a5b61] via-[#36373c] to-[#1e1f23] shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset]">
        <span className="absolute left-1/2 top-0 h-[42%] w-[13%] -translate-x-1/2 rounded-b-[clamp(4px,0.8vw,9px)] bg-gradient-to-b from-[#1d1e22] to-[#2c2d32]" aria-hidden />
      </div>
      <div className="pointer-events-none absolute inset-x-[6%] -bottom-[clamp(16px,3vw,36px)] h-[clamp(16px,3vw,36px)] rounded-[50%] bg-black/25 blur-2xl dark:bg-black/60" aria-hidden />
    </div>
  );
}
