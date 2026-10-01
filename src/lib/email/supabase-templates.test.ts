import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_VARIABLES, authConfigPatch, authTemplates, notificationConfigPatch, notificationTemplates,
} from "./supabase-templates.ts";

const APP = "https://atonservice.org";
const all = () => [...Object.values(authTemplates(APP)), ...Object.values(notificationTemplates())];

test("sign-up, sign-in and reauthentication emails show the code, not a link", () => {
  const t = authTemplates(APP);
  for (const key of ["confirmation", "magic_link", "reauthentication"] as const) {
    assert.ok(t[key].html.includes("{{ .Token }}"), `${key} shows {{ .Token }}`);
    assert.ok(t[key].subject.includes("{{ .Token }}"), `${key} subject carries the code`);
    assert.ok(!t[key].html.includes("{{ .ConfirmationURL }}"), `${key} has no link`);
    assert.match(t[key].html, /5 minutes|sensible/);
  }
});

test("invite and recovery send people to the code login; email change uses the confirmation link", () => {
  const t = authTemplates(APP);
  assert.ok(t.invite.html.includes(`href="${APP}/fr/login"`));
  assert.ok(t.recovery.html.includes(`href="${APP}/fr/login"`));
  assert.ok(t.email_change.html.includes('href="{{ .ConfirmationURL }}"'));
});

test("only known Supabase variables are used, and every email has the Studio ATS layout", () => {
  for (const tpl of all()) {
    const vars = (tpl.html + tpl.subject).match(/\{\{[^}]*\}\}/g) ?? [];
    for (const v of vars) assert.ok(ALLOWED_VARIABLES.includes(v), `${tpl.label}: unexpected ${v}`);
    assert.ok(tpl.html.startsWith("<!doctype html>"), tpl.label);
    assert.match(tpl.html, />Studio ATS</);
    assert.match(tpl.html, /contact@atonservice\.org/);
  }
});

test("Management API payloads use Supabase's field names", () => {
  const a = authConfigPatch(APP);
  assert.equal(a.mailer_otp_length, 6);
  assert.equal(a.mailer_otp_exp, 300);
  for (const key of ["confirmation", "magic_link", "reauthentication", "invite", "recovery", "email_change"]) {
    assert.equal(typeof a[`mailer_subjects_${key}`], "string");
    assert.equal(typeof a[`mailer_templates_${key}_content`], "string");
  }
  const n = notificationConfigPatch();
  assert.equal(n.mailer_notifications_password_changed_enabled, true);
  assert.equal(typeof n.mailer_templates_password_changed_notification_content, "string");
});
