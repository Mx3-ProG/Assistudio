/**
 * Email rendering — pure (unit-tested). One sober layout for every template:
 * lots of white space, a single column, one optional call to action, readable
 * on mobile, light/dark friendly, plain-text alternative always included.
 * Information first, decoration last.
 */
import { copyFor, type TemplateId } from "./copy.ts";
import { localeMeta, isLocale } from "../../i18n/config.ts";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

type Params = Record<string, unknown>;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function intlLocale(locale: string) {
  return isLocale(locale) ? localeMeta[locale].intl : "en-GB";
}

function money(cents: unknown, currency: unknown, locale: string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency", currency: typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : "EUR",
    maximumFractionDigits: n % 100 === 0 ? 0 : 2,
  }).format(n / 100);
}

function date(v: unknown, locale: string) {
  if (typeof v !== "string" || Number.isNaN(Date.parse(v))) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(new Date(v));
}

const WHO: Record<string, string> = { en: "A prospect", fr: "Un prospect" };
/** Help request labels (staff.help_request). Emails are en/fr; other locales use English. */
const HELP_LABELS: Record<string, Record<string, string>> = {
  en: {
    commission: "Commission", payout: "Payout", contract: "Contract / dossier", prospect: "Prospect", sale: "Sale",
    account: "Account", technical: "Technical issue", training: "Training / how to sell", other: "Other",
    low: "Low", normal: "Normal", high: "Urgent",
  },
  fr: {
    commission: "Commission", payout: "Paiement", contract: "Contrat / dossier", prospect: "Prospect", sale: "Vente",
    account: "Compte", technical: "Problème technique", training: "Formation / comment vendre", other: "Autre",
    low: "Faible", normal: "Normale", high: "Urgent",
  },
};
const ON: Record<string, string> = { en: " for {d}", fr: " pour le {d}" };

const METHOD: Record<string, Record<string, string>> = {
  en: { manual: "Bank transfer by Studio ATS", stripe_connect: "Stripe Connect (connected account)" },
  fr: { manual: "Virement bancaire par Studio ATS", stripe_connect: "Stripe Connect (compte connecté)" },
};

/** Template placeholders, formatted for the recipient's locale. */
export function placeholders(params: Params, locale: string): Record<string, string> {
  const who = [params.company, params.profession].filter((x) => typeof x === "string" && x.trim()).join(" · ");
  const when = typeof params.appointment_at === "string" ? (ON[locale] ?? ON.en).replace("{d}", date(params.appointment_at, locale)) : "";
  const custom = Object.fromEntries(Object.entries(params)
    .filter(([, value]) => typeof value === "string" || typeof value === "number")
    .map(([key, value]) => [key, String(value)]));
  // Any `<name>_cents` amount is also available formatted as `{name}`.
  const amounts = Object.fromEntries(Object.entries(params)
    .filter(([key, value]) => key.endsWith("_cents") && (typeof value === "number" || typeof value === "string"))
    .map(([key, value]) => [key.slice(0, -6), money(value, params.currency, locale)]));
  const labels = HELP_LABELS[locale] ?? HELP_LABELS.en;
  return {
    ...custom,
    ...amounts,
    category_label: labels[String(params.category ?? "")] ?? String(params.category ?? ""),
    urgency_label: labels[String(params.urgency ?? "")] ?? String(params.urgency ?? ""),
    code: String(params.code ?? ""),
    sale_ref: String(params.sale_ref ?? ""),
    payout_ref: String(params.payout_ref ?? ""),
    customer_ref: String(params.customer_ref ?? ""),
    product: String(params.product ?? "Studio ATS"),
    gross: money(params.gross_cents, params.currency, locale),
    commission: money(params.commission_cents, params.currency, locale),
    amount: money(params.amount_cents, params.currency, locale),
    available_on: date(params.available_on, locale),
    requested_on: date(params.requested_at, locale),
    method_label: (METHOD[locale] ?? METHOD.en)[String(params.method ?? "manual")] ?? String(params.method ?? ""),
    ends_on: date(params.ends_on, locale),
    who: who || WHO[locale] || WHO.en,
    when,
  };
}

const fill = (tpl: string, values: Record<string, string>, escape: boolean) =>
  tpl.replace(/\{(\w+)\}/g, (_m, k: string) => (k in values ? (escape ? esc(values[k]) : values[k]) : ""));

export interface ShellParts {
  lang: string;
  dir: "ltr" | "rtl";
  /** Plain text (escaped here). */
  subject: string;
  preheader: string;
  /** Already-safe HTML (escaped by the caller, or template variables like {{ .Token }}). */
  titleHtml: string;
  paragraphsHtml: string[];
  highlightHtml?: string | null;
  /** `url` may be a template variable ({{ .ConfirmationURL }}); it is escaped like any attribute. */
  cta?: { url: string; label: string } | null;
  footnote?: string | null;
  signature: string;
  footer: string;
}

/**
 * The one email layout (site emails and Supabase Auth emails): white card on
 * a warm grey background, "STUDIO ATS" wordmark, single column, optional code
 * block and button, dark-mode friendly.
 */
export function emailShell(p: ShellParts): string {
  return `<!doctype html>
<html lang="${p.lang}" dir="${p.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(p.subject)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .bg { background: #0f0f10 !important; }
    .card { background: #17171a !important; }
    .fg { color: #f2f2f3 !important; }
    .muted { color: #a1a1aa !important; }
    .btn { background: #f2f2f3 !important; color: #0f0f10 !important; }
    .rule { border-color: #2a2a2e !important; }
  }
  @media (max-width: 600px) { .pad { padding: 32px 24px !important; } }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f6f6f4;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(p.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:#f6f6f4;">
  <tr><td align="center" style="padding:40px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="max-width:560px;background:#ffffff;border-radius:16px;">
      <tr><td class="pad" style="padding:48px 48px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <p class="fg" style="margin:0 0 40px;font-size:13px;letter-spacing:0.28em;font-weight:600;text-transform:uppercase;color:#111111;">Studio ATS</p>
        <h1 class="fg" style="margin:0 0 24px;font-size:24px;line-height:1.3;font-weight:600;color:#111111;">${p.titleHtml}</h1>
        ${p.paragraphsHtml.map((x) => `<p class="fg" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111111;">${x}</p>`).join("\n        ")}
        ${p.highlightHtml ? `<p class="fg" style="margin:28px 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;line-height:1.2;letter-spacing:0.18em;font-weight:600;color:#111111;">${p.highlightHtml}</p>` : ""}
        ${p.cta ? `<p style="margin:32px 0 8px;"><a class="btn" href="${esc(p.cta.url)}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#111111;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${esc(p.cta.label)}</a></p>` : ""}
        ${p.footnote ? `<p class="muted" style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b;">${esc(p.footnote)}</p>` : ""}
        <p class="fg" style="margin:40px 0 0;font-size:15px;color:#111111;">${esc(p.signature)}</p>
      </td></tr>
      <tr><td class="rule" style="border-top:1px solid #ececea;padding:20px 48px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <p class="muted" style="margin:0;font-size:12px;line-height:1.6;color:#8a8a8a;">${esc(p.footer)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function renderEmail(template: TemplateId, params: Params, opts: { locale: string; appUrl: string }): RenderedEmail {
  const locale = isLocale(opts.locale) ? opts.locale : "en";
  const copy = copyFor(locale);
  const t = copy.templates[template];
  if (!t) throw new Error(`unknown email template ${template}`);
  const v = placeholders(params, locale);
  const dir = isLocale(locale) ? localeMeta[locale].dir : "ltr";

  const subject = fill(t.subject, v, false);
  const title = fill(t.title, v, true);
  // Newlines become line breaks; a paragraph that resolves to nothing is dropped.
  const kept = t.paragraphs.filter((p) => fill(p, v, false).trim() !== "");
  const paragraphs = kept.map((p) => fill(p, v, true).replace(/\n/g, "<br>"));
  const highlight = t.highlight ? fill(t.highlight, v, true) : null;
  const footnote = t.footnote === "pendingNote" ? copy.common.pendingNote : t.footnote;
  const ctaPath = t.cta ? fill(t.cta.path, v, false) : null;
  const ctaUrl = ctaPath ? (/^https?:\/\//.test(ctaPath) ? ctaPath : `${opts.appUrl}/${locale}${ctaPath}`) : null;

  const html = emailShell({
    lang: locale, dir, subject, preheader: fill(t.preheader, v, false), titleHtml: title, paragraphsHtml: paragraphs,
    highlightHtml: highlight, cta: ctaUrl ? { url: ctaUrl, label: t.cta!.label } : null, footnote: footnote ?? null,
    signature: copy.common.signature, footer: copy.common.footer,
  });

  const text = [
    "Studio ATS",
    "",
    fill(t.title, v, false),
    "",
    ...kept.map((p) => fill(p, v, false)),
    ...(t.highlight ? ["", fill(t.highlight, v, false)] : []),
    ...(ctaUrl ? ["", `${t.cta!.label}: ${ctaUrl}`] : []),
    ...(footnote ? ["", footnote] : []),
    "",
    copy.common.signature,
    "",
    copy.common.footer,
  ].join("\n");

  return { subject, html, text };
}
