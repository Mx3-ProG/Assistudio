"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { briefSections, contractCopy, fieldLabel, optionLabel } from "@/content/contracts";
import { fmt } from "@/i18n/format";
import { saveClientBriefAction } from "@/app/actions/contracts";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/primitives";

type Answers = Record<string, unknown>;

export function ClientBriefForm({ reference, locale, initial }: { reference: string; locale: Locale; initial: Answers }) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initialRender = useRef(true);
  const C = contractCopy(locale).form;
  useEffect(() => {
    window.localStorage.setItem(`studio-dossier:${reference}`, JSON.stringify(answers));
    if (initialRender.current) { initialRender.current = false; return; }
    const timer = window.setTimeout(() => startTransition(async () => {
      const result = await saveClientBriefAction(reference, JSON.stringify(answers), false);
      setSavedAt(result.savedAt);
    }), 1200);
    return () => window.clearTimeout(timer);
  }, [answers, reference]);

  const set = (key: string, value: unknown) => setAnswers((old) => ({ ...old, [key]: value }));
  const toggle = (key: string, option: string) => {
    const current = Array.isArray(answers[key]) ? answers[key] as string[] : [];
    set(key, current.includes(option) ? current.filter((x) => x !== option) : [...current, option]);
  };
  const submit = () => startTransition(async () => {
    await saveClientBriefAction(reference, JSON.stringify(answers), true);
    window.localStorage.removeItem(`studio-dossier:${reference}`);
    window.location.reload();
  });

  return <div className="space-y-6">
    <div className="sticky top-3 z-20 flex items-center justify-between rounded-2xl border border-line bg-bg-elevated/95 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-sm text-muted">{pending ? C.saving : savedAt ? fmt(C.saved, { time: new Date(savedAt).toLocaleTimeString(locale) }) : C.localDraft}</p>
      <Button type="button" size="sm" onClick={submit} disabled={pending}>{C.submit}</Button>
    </div>
    {briefSections(locale).map((section, index) => <section key={section.id} className="card p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-accent">{String(index + 1).padStart(2, "0")} / {briefSections(locale).length}</p>
      <h2 className="mt-2 text-xl font-semibold">{section.title}</h2>
      <div className="mt-5 grid gap-5">
        {section.fields.map((field) => {
          const value = answers[field.key];
          if (field.key === "modules.details" && !(Array.isArray(answers["modules.enabled"]) && answers["modules.enabled"].length)) return null;
          return <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium">{fieldLabel(field, locale)}{field.required ? " *" : ""}</label>
            {field.type === "textarea" ? <textarea className={textareaClass} value={String(value ?? "")} onChange={(e) => set(field.key, e.target.value)} />
              : field.type === "checkboxes" ? <div className="grid gap-2 sm:grid-cols-2">{field.options?.map((option) => <label key={option} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm"><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={() => toggle(field.key, option)} />{optionLabel(option, locale)}</label>)}</div>
              : <input type={field.type} className={inputClass} value={String(value ?? "")} onChange={(e) => set(field.key, e.target.value)} />}
          </div>;
        })}
      </div>
    </section>)}
    <div className="flex justify-end"><Button type="button" size="lg" onClick={submit} disabled={pending}>{C.share}</Button></div>
  </div>;
}
