import "server-only";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { briefSections, contractCopy, fieldLabel, optionLabel } from "../../content/contracts.ts";
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
  devanagari: join(process.cwd(), "node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2"),
  devanagariBold: join(process.cwd(), "node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2"),
};

async function fontData(path: string): Promise<string> {
  return (await readFile(path)).toString("base64");
}

async function fontsCss(): Promise<string> {
  const [latin, latinBold, arabic, arabicBold, devanagari, devanagariBold] = await Promise.all([
    fontData(fontFiles.latin), fontData(fontFiles.latinBold),
    fontData(fontFiles.arabic), fontData(fontFiles.arabicBold),
    fontData(fontFiles.devanagari), fontData(fontFiles.devanagariBold),
  ]);
  return `
    @font-face{font-family:Noto;src:url(data:font/woff2;base64,${latin}) format('woff2');font-weight:400}
    @font-face{font-family:Noto;src:url(data:font/woff2;base64,${latinBold}) format('woff2');font-weight:700}
    @font-face{font-family:NotoArabic;src:url(data:font/woff2;base64,${arabic}) format('woff2');font-weight:400}
    @font-face{font-family:NotoArabic;src:url(data:font/woff2;base64,${arabicBold}) format('woff2');font-weight:700}
    @font-face{font-family:NotoDevanagari;src:url(data:font/woff2;base64,${devanagari}) format('woff2');font-weight:400}
    @font-face{font-family:NotoDevanagari;src:url(data:font/woff2;base64,${devanagariBold}) format('woff2');font-weight:700}`;
}

function shell(locale: Locale, title: string, body: string, watermark?: string): string {
  const dir = localeMeta[locale].dir;
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><style>
    ${"__FONTS__"}
    @page{size:A4;margin:16mm 15mm 17mm}*{box-sizing:border-box}body{margin:0;color:#171717;font-family:${dir === "rtl" ? "NotoArabic,Noto" : "Noto,NotoArabic"},NotoDevanagari,sans-serif;font-size:10.5px;line-height:1.55}
    header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #d8d8d4;padding-bottom:10px;margin-bottom:22px}header strong{font-size:13px;letter-spacing:.18em}header span{color:#777}
    h1{font-size:25px;line-height:1.2;margin:0 0 7px}h2{font-size:15px;margin:22px 0 8px;break-after:avoid}h3{font-size:11px;margin:13px 0 4px}p{margin:3px 0 8px}.muted{color:#777}.box{border:1px solid #d8d8d4;border-radius:8px;padding:12px;margin:10px 0;break-inside:avoid}.answer{white-space:pre-wrap;color:#303030;unicode-bidi:plaintext;text-align:start}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}.price{font-size:26px;font-weight:700}.terms{padding-inline-start:20px}.terms li{margin:0 0 8px}.hash{font-family:monospace;font-size:8px;overflow-wrap:anywhere}.page-break{break-before:page}.watermark{position:fixed;inset:45% 0 auto;transform:rotate(-24deg);font-size:46px;text-align:center;color:rgba(160,0,0,.12);font-weight:700;z-index:-1}
    footer{position:fixed;bottom:-10mm;inset-inline:0;color:#888;font-size:8px;border-top:1px solid #ddd;padding-top:4px}
  </style><title>${esc(title)}</title></head><body>${watermark ? `<div class="watermark">${esc(watermark)}</div>` : ""}<header><strong>STUDIO / ATS</strong><span>${esc(title)}</span></header>${body}<footer>${esc(title)} - ${new Date().toISOString().slice(0, 10)}</footer></body></html>`;
}

const shown = (value: unknown, locale: Locale) => {
  const P = contractCopy(locale).pdf;
  return Array.isArray(value) ? value.map((x) => optionLabel(String(x), locale)).join(", ") : typeof value === "boolean" ? (value ? P.yes : P.no) : String(value ?? "");
};

export function briefHtml(dossier: CommercialDossier, draft = false): string {
  const P = contractCopy(dossier.locale).pdf;
  const body = [`<h1>${esc(P.briefTitle)}</h1><p class="muted">${esc(dossier.ref)} - ${esc(P.revision.replace("{n}", String(dossier.currentRevision)))}</p>`];
  for (const section of briefSections(dossier.locale)) {
    body.push(`<section><h2>${esc(section.title)}</h2><div class="box">`);
    for (const field of section.fields) {
      const value = dossier.answers[field.key];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) continue;
      body.push(`<h3>${esc(fieldLabel(field, dossier.locale))}</h3><p class="answer">${esc(shown(value, dossier.locale))}</p>`);
    }
    body.push("</div></section>");
  }
  return shell(dossier.locale, P.briefDocTitle, body.join(""), draft ? P.draftWatermark : undefined);
}

export function quoteHtml(dossier: CommercialDossier, clauses: string[], draft = false): string {
  const offer = dossier.offerSnapshot;
  if (!offer) throw new Error("offer_not_locked");
  const legal = (offer as unknown as { legalIdentity?: Record<string, string> }).legalIdentity ?? {};
  const P = contractCopy(dossier.locale).pdf;
  const money = new Intl.NumberFormat(localeMeta[dossier.locale].intl, { style: "currency", currency: offer.currency }).format(offer.totalCents / 100);
  const body = `
    <h1>${esc(P.quoteTitle)}</h1>
    <p class="muted">${esc(dossier.ref)} - ${esc(P.validUntil)} ${esc(dossier.validUntil)}</p>
    <div class="grid box"><div><strong>${esc(P.customer)}</strong><p>${esc(dossier.clientCompany || dossier.clientName)}</p><p>${esc(dossier.clientName)}</p><p>${esc(dossier.clientEmail)}</p></div><div><strong>Studio ATS</strong><p>${esc(legal.legalName)}</p><p>${esc(legal.address)}</p><p>${esc(legal.registration)}</p><p>${esc(legal.representative)}</p></div></div>
    <h2>${esc(P.offerScope)}</h2>
    <div class="box"><p><strong>${esc(offer.name)}</strong></p><p class="price">${esc(money)}</p><p>${esc(offer.interval === "one_time" ? P.oneTime : P.annual)}</p>${offer.promoCode ? `<p>Code ${esc(offer.promoCode)} - ${esc(Math.round((offer.discountRate ?? 0) * 100))}%</p>` : ""}</div>
    <div class="box"><h3>${esc(P.agreedScope)}</h3><p class="answer">${esc(dossier.adminScope)}</p></div>
    <h2>${esc(P.terms)}</h2>
    <ol class="terms">${clauses.map((clause) => `<li>${esc(clause)}</li>`).join("")}</ol>
    <div class="box"><strong>${esc(P.effect)}</strong><p>${esc(P.effectBody)}</p></div>`;
  return shell(dossier.locale, P.quoteDocTitle, body, draft ? P.draftWatermark : undefined);
}

export function proofHtml(dossier: CommercialDossier, acceptances: DossierAcceptance[]): string {
  const P = contractCopy(dossier.locale).pdf;
  const body = `<h1>${esc(P.evidenceTitle)}</h1>
    <p>${esc(dossier.ref)}</p><div class="box"><h3>${esc(P.manifest)}</h3><p class="hash">${esc(dossier.manifestSha256)}</p></div>
    ${acceptances.map((a) => `<div class="box"><h2>${a.party === "client" ? esc(P.customer) : "Studio ATS"}</h2><p><strong>${esc(a.signerName)}</strong> - ${esc(a.signerTitle)}</p><p>${esc(a.signerEmail)}</p><p>${esc(a.acceptedAt)}</p><p>${esc(a.otpVerified ? P.otpVerified : P.otpNotApplicable)}</p><p class="hash">${esc(a.manifestSha256)}</p></div>`).join("")}
    <p class="muted">${esc(P.evidenceNote)}</p>`;
  return shell(dossier.locale, P.evidenceDocTitle, body);
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
