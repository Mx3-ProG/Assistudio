/**
 * Sales Center instant search — pure (unit-tested). Runs in the browser over a
 * compact index so an affiliate finds an answer in seconds, mid-conversation,
 * even on a weak mobile connection. Accent- and case-insensitive; every query
 * word must match (prefix) somewhere; titles and tags rank above body text.
 */

export interface SearchDoc {
  id: string;
  kind: string;
  key: string;
  title: string;
  tags: string[];
  text: string;
  href: string;
}

interface IndexedDoc extends SearchDoc {
  nTitle: string;
  nTags: string;
  nText: string;
}

export function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’'`]/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function buildIndex(docs: SearchDoc[]): IndexedDoc[] {
  return docs.map((d) => ({ ...d, nTitle: ` ${normalize(d.title)} `, nTags: ` ${normalize(d.tags.join(" "))} `, nText: ` ${normalize(d.text)} ` }));
}

const has = (hay: string, word: string) => hay.includes(` ${word}`);

export function search(index: IndexedDoc[], query: string, limit = 20): SearchDoc[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(" ").filter(Boolean);
  const scored: { d: IndexedDoc; score: number }[] = [];
  for (const d of index) {
    let score = 0;
    let all = true;
    for (const w of words) {
      const s = (has(d.nTitle, w) ? 5 : 0) + (has(d.nTags, w) ? 4 : 0) + (has(d.nText, w) ? 1 : 0);
      if (!s) { all = false; break; }
      score += s;
    }
    if (!all) continue;
    if (words.length > 1 && (d.nTitle.includes(` ${q}`) || d.nTags.includes(` ${q}`))) score += 6;
    else if (words.length > 1 && d.nText.includes(` ${q}`)) score += 2;
    scored.push({ d, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.d.title.localeCompare(b.d.title))
    .slice(0, limit)
    .map(({ d }) => ({ id: d.id, kind: d.kind, key: d.key, title: d.title, tags: d.tags, text: d.text, href: d.href }));
}

/** Short excerpt around the first matching word, for result previews. */
export function excerpt(text: string, query: string, size = 140) {
  const words = normalize(query).split(" ").filter(Boolean);
  const n = normalize(text);
  let at = -1;
  for (const w of words) {
    const i = n.indexOf(w);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  // normalize() preserves length for Latin text closely enough for a preview.
  const start = Math.max(0, at - 40);
  const out = text.replace(/\s+/g, " ").slice(start, start + size).trim();
  return (start > 0 ? "…" : "") + out + (start + size < text.length ? "…" : "");
}
