import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDuration, linkify, normalizeRecordedMime, pickRecorderMime } from "./media.ts";

test("picks a recorder type the browser and the server both accept", () => {
  const chrome = (t: string) => t.startsWith("audio/webm") || t.startsWith("video/webm");
  const safari = (t: string) => t === "audio/mp4" || t === "video/mp4";
  assert.equal(pickRecorderMime("audio", chrome), "audio/webm;codecs=opus");
  assert.equal(pickRecorderMime("audio", safari), "audio/mp4");
  assert.equal(pickRecorderMime("video", safari), "video/mp4");
  assert.equal(pickRecorderMime("audio", () => false), null);
});

test("an audio recording reported as video/webm is stored as audio/webm", () => {
  assert.equal(normalizeRecordedMime("audio", "video/webm", "audio/webm"), "audio/webm");
  assert.equal(normalizeRecordedMime("audio", "", "audio/mp4"), "audio/mp4");
});

test("durations read m:ss", () => {
  assert.equal(formatDuration(4200), "0:04");
  assert.equal(formatDuration(125_000), "2:05");
});

test("links are split out, trailing punctuation excluded", () => {
  assert.deepEqual(linkify("see https://studio-ats.com/pricing. ok"), [
    { type: "text", value: "see " },
    { type: "link", value: "https://studio-ats.com/pricing" },
    { type: "text", value: ". ok" },
  ]);
  assert.deepEqual(linkify("javascript:alert(1)"), [{ type: "text", value: "javascript:alert(1)" }]);
});
