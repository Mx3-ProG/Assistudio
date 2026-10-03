import { ArrowUpRight, Code2, ShieldCheck, Users } from "lucide-react";
import type { Dictionary } from "@/i18n/types";

export function TeamSection({ t }: { t: Dictionary }) {
  const team = t.studio.team;
  return (
    <section id="team" className="overflow-hidden border-y border-white/10 bg-[#071020] px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-300">{team.eyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] text-white sm:text-[62px]">{team.title}</h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-white/12 bg-white/[0.06] p-7 sm:p-9">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-blue-400 text-[20px] font-bold text-[#071020]">MD</span>
              <div><h3 className="text-[24px] font-semibold text-white">Mathieu Deffontaines</h3><p className="mt-1 text-[13px] font-medium uppercase tracking-[0.1em] text-blue-300">{team.founderRole}</p></div>
            </div>
            <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-white/72">{team.founderBody}</p>
            <a href="https://cvmd-khaki.vercel.app" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[14px] font-medium text-white transition hover:border-blue-300 hover:bg-white/10">{team.founderLink}<ArrowUpRight className="size-4" /></a>
          </article>

          <article className="rounded-[28px] bg-white p-7 text-[#071020] sm:p-9">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Users className="size-5" /></span><h3 className="text-[24px] font-semibold">{team.collectiveTitle}</h3></div>
            <p className="mt-6 text-[16px] leading-relaxed text-[#536071]">{team.collectiveBody}</p>
            <ul className="mt-7 grid gap-3">
              {team.commitments.map((commitment, index) => <li key={commitment} className="flex items-center gap-3 rounded-2xl bg-[#f4f6fa] px-4 py-3 text-[14px] font-medium"><span className="text-blue-600">{index === 0 ? <Code2 className="size-4" /> : index === 1 ? <ShieldCheck className="size-4" /> : <Users className="size-4" />}</span>{commitment}</li>)}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
