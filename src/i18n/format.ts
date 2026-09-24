/** Interpolates {placeholders}. Unknown placeholders are left untouched. */
export function fmt(template: string, params: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}
