import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../i18n/config.ts";
import { answerText, briefSections, contractsCopy, fieldLabel, optionLabel } from "./contracts.ts";

test("the project brief is fully labelled in every locale", () => {
  for (const locale of locales) {
    const t = contractsCopy(locale);
    for (const section of briefSections(locale)) {
      assert.ok(section.title && section.description, `${locale}/${section.id} title + description`);
      for (const field of section.fields) {
        assert.ok(t.fields[field.key], `${locale}: field ${field.key} has a label`);
        for (const option of field.options ?? []) assert.ok(t.options[option], `${locale}: option ${option} has a label`);
      }
    }
  }
});

test("non-English locales do not silently reuse English labels", () => {
  const en = contractsCopy("en");
  for (const locale of locales.filter((l) => l !== "en")) {
    const t = contractsCopy(locale);
    assert.notEqual(t.pdf.briefTitle, en.pdf.briefTitle, locale);
    assert.notEqual(t.client.accept, en.client.accept, locale);
    assert.notEqual(t.statuses.awaiting_payment, en.statuses.awaiting_payment, locale);
  }
});

test("answers are rendered with localised option labels", () => {
  const field = briefSections("de").flatMap((s) => s.fields).find((f) => f.key === "visual.mode")!;
  assert.equal(fieldLabel(field, "de"), "Darstellungspräferenz");
  assert.equal(answerText(field, ["light", "studio_choice"], "de"), "Hell, Nach Wahl des Studios");
  assert.equal(optionLabel("unknown_key", "fr"), "unknown key");
});
