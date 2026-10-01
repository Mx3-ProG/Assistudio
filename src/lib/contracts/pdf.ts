import "server-only";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { briefSections, fieldLabel } from "../../content/contracts.ts";
import { localeMeta, type Locale } from "../../i18n/config.ts";
import type { CommercialDossier, DossierAcceptance } from "../data/types.ts";

const esc = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const fontFiles = {
  latin: join(process.cwd(), "node_modules/@fontsource/noto-sans/files/noto-sans-latin-ext-400-normal.woff2"),
  latinBold: join(process.cwd(), "node_modules/@fontsource/noto-sans/files/noto-sans-latin-ext-700-normal.woff2"),
  arabic: join(process.cwd(), "node_modules/@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff2"),
  arabicBold: join(process.cwd(), "node_modules/@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-700-normal.woff2"),
};

async function fontData(path: string): Promise<string> {
  return (await readFile(path)).toString("base64");
}

async function fontsCss(): Promise<string> {
  const [latin, latinBold, arabic, arabicBold] = await Promise.all([
    fontData(fontFiles.latin), fontData(fontFiles.latinBold),
    fontData(fontFiles.arabic), fontData(fontFiles.arabicBold),
  ]);
  return `
    @font-face{font-family:Noto;src:url(data:font/woff2;base64,${latin}) format('woff2');font-weight:400}
    @font-face{font-family:Noto;src:url(data:font/woff2;base64,${latinBold}) format('woff2');font-weight:700}
    @font-face{font-family:NotoArabic;src:url(data:font/woff2;base64,${arabic}) format('woff2');font-weight:400}
    @font-face{font-family:NotoArabic;src:url(data:font/woff2;base64,${arabicBold}) format('woff2');font-weight:700}`;
}

function shell(locale: Locale, title: string, body: string, watermark?: string): string {
  const dir = localeMeta[locale].dir;
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><style>
    ${"__FONTS__"}
    @page{size:A4;margin:16mm 15mm 17mm}*{box-sizing:border-box}body{margin:0;color:#171717;font-family:${dir === "rtl" ? "NotoArabic,Noto" : "Noto,NotoArabic"},sans-serif;font-size:10.5px;line-height:1.55}
    header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #d8d8d4;padding-bottom:10px;margin-bottom:22px}header strong{font-size:13px;letter-spacing:.18em}header span{color:#777}
    h1{font-size:25px;line-height:1.2;margin:0 0 7px}h2{font-size:15px;margin:22px 0 8px;break-after:avoid}h3{font-size:11px;margin:13px 0 4px}p{margin:3px 0 8px}.muted{color:#777}.box{border:1px solid #d8d8d4;border-radius:8px;padding:12px;margin:10px 0;break-inside:avoid}.answer{white-space:pre-wrap;color:#303030;unicode-bidi:plaintext;text-align:start}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}.price{font-size:26px;font-weight:700}.terms{padding-inline-start:20px}.terms li{margin:0 0 8px}.hash{font-family:monospace;font-size:8px;overflow-wrap:anywhere}.page-break{break-before:page}.watermark{position:fixed;inset:45% 0 auto;transform:rotate(-24deg);font-size:46px;text-align:center;color:rgba(160,0,0,.12);font-weight:700;z-index:-1}
    footer{position:fixed;bottom:-10mm;inset-inline:0;color:#888;font-size:8px;border-top:1px solid #ddd;padding-top:4px}
  </style><title>${esc(title)}</title></head><body>${watermark ? `<div class="watermark">${esc(watermark)}</div>` : ""}<header><strong>STUDIO / ATS</strong><span>${esc(title)}</span></header>${body}<footer>${esc(title)} - ${new Date().toISOString().slice(0, 10)}</footer></body></html>`;
}

const shown = (value: unknown) => Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "");

export function briefHtml(dossier: CommercialDossier, draft = false): string {
  const body = [`<h1>${dossier.locale === "fr" ? "Cahier des charges" : "Project brief"}</h1><p class="muted">${esc(dossier.ref)} - révision ${dossier.currentRevision}</p>`];
  for (const section of briefSections(dossier.locale)) {
    body.push(`<section><h2>${esc(section.title)}</h2><div class="box">`);
    for (const field of section.fields) {
      const value = dossier.answers[field.key];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) continue;
      body.push(`<h3>${esc(fieldLabel(field, dossier.locale))}</h3><p class="answer">${esc(shown(value))}</p>`);
    }
    body.push("</div></section>");
  }
  return shell(dossier.locale, dossier.locale === "fr" ? "Cahier des charges Studio ATS" : "Studio ATS project brief", body.join(""), draft ? "BROUILLON - NON CONTRACTUEL" : undefined);
}

export function quoteHtml(dossier: CommercialDossier, clauses: string[], draft = false): string {
  const offer = dossier.offerSnapshot;
  if (!offer) throw new Error("offer_not_locked");
  const legal = (offer as unknown as { legalIdentity?: Record<string, string> }).legalIdentity ?? {};
  const money = new Intl.NumberFormat(localeMeta[dossier.locale].intl, { style: "currency", currency: offer.currency }).format(offer.totalCents / 100);
  const body = `
    <h1>${dossier.locale === "fr" ? "Devis / contrat" : "Quote / agreement"}</h1>
    <p class="muted">${esc(dossier.ref)} - ${dossier.locale === "fr" ? "valide jusqu'au" : "valid until"} ${esc(dossier.validUntil)}</p>
    <div class="grid box"><div><strong>${dossier.locale === "fr" ? "Client" : "Customer"}</strong><p>${esc(dossier.clientCompany || dossier.clientName)}</p><p>${esc(dossier.clientName)}</p><p>${esc(dossier.clientEmail)}</p></div><div><strong>Studio ATS</strong><p>${esc(legal.legalName)}</p><p>${esc(legal.address)}</p><p>${esc(legal.registration)}</p><p>${esc(legal.representative)}</p></div></div>
    <h2>${dossier.locale === "fr" ? "Offre et périmètre" : "Offer and scope"}</h2>
    <div class="box"><p><strong>${esc(offer.name)}</strong></p><p class="price">${esc(money)}</p><p>${offer.interval === "one_time" ? (dossier.locale === "fr" ? "Paiement unique" : "One-time payment") : (dossier.locale === "fr" ? "Facturation annuelle" : "Annual billing")}</p>${offer.promoCode ? `<p>Code ${esc(offer.promoCode)} - ${esc(Math.round((offer.discountRate ?? 0) * 100))}%</p>` : ""}</div>
    <div class="box"><h3>${dossier.locale === "fr" ? "Périmètre retenu" : "Agreed scope"}</h3><p class="answer">${esc(dossier.adminScope)}</p></div>
    <h2>${dossier.locale === "fr" ? "Conditions contractuelles" : "Contractual terms"}</h2>
    <ol class="terms">${clauses.map((clause) => `<li>${esc(clause)}</li>`).join("")}</ol>
    <div class="box"><strong>${dossier.locale === "fr" ? "Portée" : "Effect"}</strong><p>${dossier.locale === "fr" ? "Le devis, les conditions ci-dessus et le cahier des charges verrouillé constituent l'accord. La commande devient ferme après la double acceptation et la réception du premier paiement." : "This quote, the terms above and the locked project brief form the agreement. The order becomes binding after dual acceptance and receipt of the first payment."}</p></div>`;
  return shell(dossier.locale, dossier.locale === "fr" ? "Devis Studio ATS" : "Studio ATS quote", body, draft ? "BROUILLON - NON CONTRACTUEL" : undefined);
}

export function proofHtml(dossier: CommercialDossier, acceptances: DossierAcceptance[]): string {
  const body = `<h1>${dossier.locale === "fr" ? "Dossier de preuve" : "Evidence record"}</h1>
    <p>${esc(dossier.ref)}</p><div class="box"><h3>SHA-256 manifest</h3><p class="hash">${esc(dossier.manifestSha256)}</p></div>
    ${acceptances.map((a) => `<div class="box"><h2>${a.party === "client" ? "Client" : "Studio ATS"}</h2><p><strong>${esc(a.signerName)}</strong> - ${esc(a.signerTitle)}</p><p>${esc(a.signerEmail)}</p><p>${esc(a.acceptedAt)}</p><p>OTP: ${a.otpVerified ? "verified" : "not applicable"}</p><p class="hash">${esc(a.manifestSha256)}</p></div>`).join("")}
    <p class="muted">${dossier.locale === "fr" ? "Ce relevé documente une acceptation électronique interne. Il ne constitue pas une signature électronique qualifiée." : "This record documents an internal electronic acceptance. It is not a qualified electronic signature."}</p>`;
  return shell(dossier.locale, dossier.locale === "fr" ? "Preuve d'acceptation" : "Acceptance evidence", body);
}

async function executablePath(): Promise<string> {
  const configured = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (configured) return configured;
  const local = process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "/usr/bin/google-chrome";
  try { await access(local, constants.X_OK); return local; } catch { return chromium.executablePath(); }
}

export async function renderPdf(html: string): Promise<Buffer> {
  const css = await fontsCss();
  const browser = await puppeteer.launch({
    args: process.platform === "darwin" ? ["--no-sandbox", "--disable-setuid-sandbox"] : chromium.args,
    executablePath: await executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html.replace("__FONTS__", css), { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const bytes = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    return Buffer.from(bytes);
  } finally {
    await browser.close();
  }
}
