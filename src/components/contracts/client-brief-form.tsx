"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import type { BriefSection } from "@/content/contracts";
import type { ContractsDictionary } from "@/i18n/dictionaries/contracts.en";
import { saveClientBriefAction } from "@/app/actions/contracts";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/primitives";

type Answers = Record<string, unknown>;

export function ClientBriefForm({ reference, copy, sections, initial }: { reference: string; copy: ContractsDictionary; sections: BriefSection[]; initial: Answers }) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initialRender = useRef(true);
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
      <p className="text-sm text-muted">{pending ? copy.form.saving : savedAt ? copy.form.saved.replace("{time}", new Date(savedAt).toLocaleTimeString()) : copy.form.localDraft}</p>
      <Button type="button" size="sm" onClick={submit} disabled={pending}>{copy.form.submit}</Button>
    </div>
    {sections.map((section, index) => <section key={section.id} className="card p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-accent">{copy.form.step.replace("{n}", String(index + 1).padStart(2, "0")).replace("{total}", String(sections.length))}</p>
      <h2 className="mt-2 text-xl font-semibold">{section.title}</h2>
      <p className="mt-1 text-sm text-muted">{section.description}</p>
      <div className="mt-5 grid gap-5">
        {section.fields.map((field) => {
          const value = answers[field.key];
          if (field.key === "modules.details" && !(Array.isArray(answers["modules.enabled"]) && answers["modules.enabled"].length)) return null;
          return <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium">{copy.fields[field.key] ?? field.key}{field.required ? " *" : ""}</label>
            {field.type === "textarea" ? <textarea className={textareaClass} value={String(value ?? "")} onChange={(e) => set(field.key, e.target.value)} />
              : field.type === "checkboxes" ? <div className="grid gap-2 sm:grid-cols-2">{field.options?.map((option) => <label key={option} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm"><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={() => toggle(field.key, option)} />{copy.options[option] ?? option.replaceAll("_", " ")}</label>)}</div>
              : <input type={field.type} className={inputClass} value={String(value ?? "")} onChange={(e) => set(field.key, e.target.value)} />}
          </div>;
        })}
      </div>
    </section>)}
    <div className="flex justify-end"><Button type="button" size="lg" onClick={submit} disabled={pending}>{copy.form.share}</Button></div>
  </div>;
}
