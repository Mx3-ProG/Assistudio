import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HELP_VIDEOS, HELP_ARTICLES, ESSENTIALS } from "./help-videos.ts";

const pub = (p: string) => join(import.meta.dirname, "../../public", p);

test("three essentials, in order, with unique slugs", () => {
  assert.deepEqual(ESSENTIALS.map((v) => v.essential), [1, 2, 3]);
  assert.equal(new Set(HELP_VIDEOS.map((v) => v.slug)).size, HELP_VIDEOS.length);
});

test("every video points at real files and its chapters sit inside its segment", () => {
  for (const v of HELP_VIDEOS) {
    if (!v.src) { assert.ok(v.readMinutes, `${v.slug}: a written guide needs a reading time`); continue; }
    assert.ok(existsSync(pub(v.src)), `${v.slug}: missing ${v.src}`);
    if (v.thumb) assert.ok(existsSync(pub(v.thumb)), `${v.slug}: missing ${v.thumb}`);
    const start = v.start ?? 0;
    assert.ok(v.end === undefined || v.end > start, `${v.slug}: empty segment`);
    for (const c of v.chapters ?? []) assert.ok(c.at >= start && (v.end === undefined || c.at < v.end), `${v.slug}: chapter at ${c.at}s outside the segment`);
  }
});

test("contextual answers only link to existing tutorials, and every text has en + fr", () => {
  const slugs = new Set(HELP_VIDEOS.map((v) => v.slug));
  for (const list of Object.values(HELP_ARTICLES)) for (const a of list) {
    if (a.video) assert.ok(slugs.has(a.video), `unknown tutorial ${a.video}`);
    assert.ok(a.q.en && a.q.fr && a.a.en && a.a.fr);
  }
});
