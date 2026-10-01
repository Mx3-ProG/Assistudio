/**
 * Installs the Studio ATS emails into Supabase Auth (sign-in codes, invitation,
 * security notices) through the Supabase Management API — no copy-paste in the
 * dashboard.
 *
 *   npm run supabase:emails                      # dry run: what would be sent
 *   npm run supabase:emails -- --write           # writes supabase/templates/*.html (preview)
 *   SUPABASE_ACCESS_TOKEN=sbp_… npm run supabase:emails -- --push
 *   SUPABASE_ACCESS_TOKEN=sbp_… RESEND_API_KEY=re_… npm run supabase:emails -- --push --smtp
 *
 * --push only touches the email fields (subjects, templates, OTP length 6 and
 * expiry 300 s); --smtp also sets Custom SMTP to Resend (lifts the built-in
 * mailer's few-emails-per-hour limit). Security notices are sent in a second
 * request so an older Supabase that lacks them cannot block the main update.
 *
 * Env: SUPABASE_ACCESS_TOKEN (supabase.com → Account → Access Tokens),
 * SUPABASE_PROJECT_REF (default: supabase/.temp/project-ref), APP_URL,
 * RESEND_API_KEY + EMAIL_FROM for --smtp.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { authConfigPatch, authTemplates, notificationConfigPatch, notificationTemplates } from "../src/lib/email/supabase-templates.ts";

const args = new Set(process.argv.slice(2));
const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://atonservice.org").replace(/\/$/, "");
const safeAppUrl = /localhost|127\.0\.0\.1/.test(appUrl) ? "https://atonservice.org" : appUrl;

if (args.has("--write")) {
  mkdirSync("supabase/templates", { recursive: true });
  const all = { ...authTemplates(safeAppUrl), ...notificationTemplates() };
  const index: string[] = [];
  for (const [key, t] of Object.entries(all)) {
    writeFileSync(`supabase/templates/${key}.html`, t.html);
    index.push(`| ${t.label} | \`${key}.html\` | ${t.subject} |`);
  }
  writeFileSync("supabase/templates/README.md", [
    "# Supabase Auth emails (generated — do not edit by hand)",
    "",
    "Source: `src/lib/email/supabase-templates.ts`. Regenerate with `npm run supabase:emails -- --write`,",
    "install with `npm run supabase:emails -- --push` (see `scripts/supabase-email-templates.ts`).",
    "",
    "| Supabase template | File | Subject |",
    "| --- | --- | --- |",
    ...index,
    "",
  ].join("\n"));
  console.log(`Wrote ${Object.keys(all).length} templates to supabase/templates/ (links → ${safeAppUrl}).`);
}

const projectRef = process.env.SUPABASE_PROJECT_REF
  ?? (existsSync("supabase/.temp/project-ref") ? readFileSync("supabase/.temp/project-ref", "utf8").trim() : "");

const main = authConfigPatch(safeAppUrl);
if (args.has("--smtp")) {
  const key = process.env.RESEND_API_KEY ?? "";
  if (!key.startsWith("re_")) {
    console.error("--smtp needs RESEND_API_KEY (re_…).");
    process.exit(1);
  }
  const from = process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ?? process.env.EMAIL_FROM ?? "contact@atonservice.org";
  Object.assign(main, {
    smtp_host: "smtp.resend.com", smtp_port: "465", smtp_user: "resend", smtp_pass: key,
    smtp_admin_email: from, smtp_sender_name: "Studio ATS",
  });
}
const notices = notificationConfigPatch();

if (!args.has("--push")) {
  if (!args.has("--write")) {
    const shown = Object.keys(main).map((k) => (k === "smtp_pass" ? `${k} (hidden)` : k));
    console.log(`Dry run for project "${projectRef || "?"}" — would PATCH ${shown.length} auth fields:\n  ${shown.join("\n  ")}`);
    console.log(`…then ${Object.keys(notices).length} security-notice fields. Re-run with --push (and SUPABASE_ACCESS_TOKEN) to apply.`);
  }
  process.exit(0);
}

const token = process.env.SUPABASE_ACCESS_TOKEN ?? "";
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is missing (create one at https://supabase.com/dashboard/account/tokens).");
  process.exit(1);
}
if (!/^[a-z0-9]{20}$/.test(projectRef)) {
  console.error("SUPABASE_PROJECT_REF is missing or invalid (Project Settings → General → Reference ID).");
  process.exit(1);
}

async function patch(body: Record<string, unknown>) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : (await res.text()).slice(0, 500) };
}

const r1 = await patch(main);
if (!r1.ok) {
  console.error(`✗ Auth emails not installed (HTTP ${r1.status}): ${r1.text}`);
  process.exit(1);
}
console.log(`✓ Installed in project ${projectRef}: 6 auth emails (codes, invite, recovery, email change), OTP 6 digits / 5 minutes${args.has("--smtp") ? ", Custom SMTP via Resend" : ""}.`);

const r2 = await patch(notices);
console.log(r2.ok
  ? "✓ Security notices installed and enabled (7)."
  : `! Security notices skipped (HTTP ${r2.status}) — your Supabase may not support them yet: ${r2.text}`);
