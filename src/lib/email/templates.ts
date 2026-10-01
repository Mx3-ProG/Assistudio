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
const ON: Record<string, string> = { en: " for {d}", fr: " pour le {d}" };

/** Template placeholders, formatted for the recipient's locale. */
export function placeholders(params: Params, locale: string): Record<string, string> {
  const who = [params.company, params.profession].filter((x) => typeof x === "string" && x.trim()).join(" · ");
  const when = typeof params.appointment_at === "string" ? (ON[locale] ?? ON.en).replace("{d}", date(params.appointment_at, locale)) : "";
  return {
    code: String(params.code ?? ""),
    sale_ref: String(params.sale_ref ?? ""),
    payout_ref: String(params.payout_ref ?? ""),
    customer_ref: String(params.customer_ref ?? ""),
    product: String(params.product ?? "Studio ATS"),
    gross: money(params.gross_cents, params.currency, locale),
    commission: money(params.commission_cents, params.currency, locale),
    amount: money(params.amount_cents, params.currency, locale),
    available_on: date(params.available_on, locale),
    ends_on: date(params.ends_on, locale),
    who: who || WHO[locale] || WHO.en,
    when,
  };
}

const fill = (tpl: string, values: Record<string, string>, escape: boolean) =>
  tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? (escape ? esc(values[k]) : values[k]) : m));

export function renderEmail(template: TemplateId, params: Params, opts: { locale: string; appUrl: string }): RenderedEmail {
  const locale = isLocale(opts.locale) ? opts.locale : "en";
  const copy = copyFor(locale);
  const t = copy.templates[template];
  if (!t) throw new Error(`unknown email template ${template}`);
  const v = placeholders(params, locale);
  const dir = isLocale(locale) ? localeMeta[locale].dir : "ltr";

  const subject = fill(t.subject, v, false);
  const title = fill(t.title, v, true);
  const paragraphs = t.paragraphs.map((p) => fill(p, v, true));
  const highlight = t.highlight ? fill(t.highlight, v, true) : null;
  const footnote = t.footnote === "pendingNote" ? copy.common.pendingNote : t.footnote;
  const ctaUrl = t.cta ? `${opts.appUrl}/${locale}${t.cta.path}` : null;

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
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
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(fill(t.preheader, v, false))}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:#f6f6f4;">
  <tr><td align="center" style="padding:40px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="max-width:560px;background:#ffffff;border-radius:16px;">
      <tr><td class="pad" style="padding:48px 48px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <p class="fg" style="margin:0 0 40px;font-size:13px;letter-spacing:0.28em;font-weight:600;text-transform:uppercase;color:#111111;">Studio ATS</p>
        <h1 class="fg" style="margin:0 0 24px;font-size:24px;line-height:1.3;font-weight:600;color:#111111;">${title}</h1>
        ${paragraphs.map((p) => `<p class="fg" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#111111;">${p}</p>`).join("\n        ")}
        ${highlight ? `<p class="fg" style="margin:28px 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;line-height:1.2;letter-spacing:0.18em;font-weight:600;color:#111111;">${highlight}</p>` : ""}
        ${ctaUrl ? `<p style="margin:32px 0 8px;"><a class="btn" href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#111111;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${esc(t.cta!.label)}</a></p>` : ""}
        ${footnote ? `<p class="muted" style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b;">${esc(footnote)}</p>` : ""}
        <p class="fg" style="margin:40px 0 0;font-size:15px;color:#111111;">${esc(copy.common.signature)}</p>
      </td></tr>
      <tr><td class="rule" style="border-top:1px solid #ececea;padding:20px 48px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <p class="muted" style="margin:0;font-size:12px;line-height:1.6;color:#8a8a8a;">${esc(copy.common.footer)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    "Studio ATS",
    "",
    fill(t.title, v, false),
    "",
    ...t.paragraphs.map((p) => fill(p, v, false)),
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
