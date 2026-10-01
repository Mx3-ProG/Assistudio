"use client";

import { useActionState } from "react";
import { saveSalesContent, type SalesAdminState } from "@/app/actions/admin-sales-center";
import { CONTENT_KINDS, type SalesContent } from "@/lib/sales/content";
import { locales } from "@/i18n/config";
import { inputClass, textareaClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

export function SalesContentEditor({ content }: { content?: SalesContent }) {
  const [state, action, pending] = useActionState<SalesAdminState, FormData>(saveSalesContent, {});
  return (
    <form action={action} className="card grid gap-3 p-5">
      {content && <input type="hidden" name="id" value={content.id} />}
      <h2 className="font-semibold">{content ? `Edit draft · ${content.key} v${content.version}` : "New draft"}</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <select name="kind" defaultValue={content?.kind ?? CONTENT_KINDS[0]} className={inputClass}>
          {CONTENT_KINDS.map((kind) => <option key={kind}>{kind}</option>)}
        </select>
        <input name="key" required placeholder="stable-key" defaultValue={content?.key} className={inputClass} />
        <select name="locale" defaultValue={content?.locale ?? locales[0]} className={inputClass}>
          {locales.map((locale) => <option key={locale}>{locale}</option>)}
        </select>
        <input name="sort" type="number" defaultValue={content?.sort ?? 100} className={inputClass} />
      </div>
      <input name="title" required placeholder="Title" defaultValue={content?.title} className={inputClass} />
      <input name="summary" placeholder="Summary" defaultValue={content?.summary ?? ""} className={inputClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="targetKey" placeholder="Target (optional)" defaultValue={content?.targetKey ?? ""} className={inputClass} />
        <input name="channel" placeholder="Channel (optional)" defaultValue={content?.channel ?? ""} className={inputClass} />
        <input name="stage" placeholder="Stage (optional)" defaultValue={content?.stage ?? ""} className={inputClass} />
      </div>
      <input name="tags" placeholder="tag, tag" defaultValue={content?.tags.join(", ") ?? ""} className={inputClass} />
      <textarea name="body" required rows={8} defaultValue={JSON.stringify(content?.body ?? { text: "" }, null, 2)} className={`${textareaClass} font-mono text-[12px]`} />
      {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
      {state.ok && <p className="text-[13px] text-success">Saved</p>}
      <button disabled={pending} className={buttonClass("accent", "md", "justify-self-start")}>
        {content ? "Save changes" : "Save draft"}
      </button>
    </form>
  );
}
