import { Navbar } from "./navbar";
import type { LegalBlock, LegalDocument as LegalDocumentData } from "@/content/legal";
import type { Locale } from "@/i18n/config";

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "list") {
    return (
      <ul className="mt-4 list-disc space-y-2 ps-5 text-[15px] leading-7 text-fg-2 marker:text-accent">
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  if (block.type === "definitions") {
    return (
      <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface/40">
        {block.items.map((item) => (
          <div key={item.term} className="grid gap-1 px-4 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-5 sm:px-5">
            <dt className="text-[13px] font-semibold text-fg">{item.term}</dt>
            <dd className="text-[14px] leading-6 text-fg-2">{item.definition}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (block.type === "notice") {
    return <p className="mt-5 rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-[14px] font-medium leading-6 text-fg">{block.text}</p>;
  }
  return <p className="mt-4 text-[15px] leading-7 text-fg-2">{block.text}</p>;
}

export function LegalDocument({ document, locale }: { document: LegalDocumentData; locale: Locale }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Document juridique</p>
          <h1 className="display mt-3 text-[40px] leading-[1.05] sm:text-[60px]">{document.title}</h1>
          <p className="mt-5 text-[17px] leading-7 text-fg-2">{document.intro}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] uppercase tracking-[0.1em] text-muted">
            <span>Version {document.version}</span>
            <span>Dernière mise à jour : {document.updatedAt}</span>
          </div>
          {locale !== "fr" && (
            <p className="mt-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] leading-6 text-fg-2">
              La version française ci-dessous est la version contractuelle de référence. Une traduction informative pourra être proposée ultérieurement.
            </p>
          )}
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <nav aria-label="Sommaire" className="rounded-2xl border border-line bg-surface/50 p-4 lg:sticky lg:top-24">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Sommaire</p>
            <ol className="mt-3 space-y-0.5">
              {document.sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="grid grid-cols-[1.8rem_1fr] rounded-lg px-2 py-2 text-[12px] leading-5 text-fg-2 transition hover:bg-accent-soft hover:text-fg">
                    <span className="font-mono text-muted">{String(index + 1).padStart(2, "0")}</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article lang="fr" className="min-w-0">
            {document.sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-line py-9 first:border-t-0 first:pt-0">
                <h2 className="flex items-start gap-3 text-[22px] font-semibold leading-tight text-fg sm:text-[26px]">
                  <span aria-hidden="true" className="mt-1 font-mono text-[12px] font-medium text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <span>{section.title}</span>
                </h2>
                {section.blocks.map((block, blockIndex) => <Block key={`${section.id}-${blockIndex}`} block={block} />)}
              </section>
            ))}
          </article>
        </div>
      </main>
    </>
  );
}

