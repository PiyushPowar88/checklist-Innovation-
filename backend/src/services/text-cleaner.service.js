/** Normalise whitespace while keeping line structure (headings, list items, table rows). */
export function cleanText(input) {
  return String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** pages: [{ page: number|null, text }] -> one string with [[PAGE n]] markers (PDF only). */
export function buildMarkedText(pages) {
  return pages
    .map((p) => (p.page ? `[[PAGE ${p.page}]]\n${p.text}` : p.text))
    .join('\n\n')
    .trim();
}

/** Inverse of buildMarkedText: [{ page: number|null, text }] */
export function splitPages(markedText) {
  const text = String(markedText ?? '');
  if (!/\[\[PAGE \d+\]\]/.test(text)) return [{ page: null, text }];
  const out = [];
  const re = /\[\[PAGE (\d+)\]\]\n?/g;
  let match;
  let last = null;
  while ((match = re.exec(text))) {
    if (last) out.push({ page: last.page, text: text.slice(last.end, match.index) });
    last = { page: Number(match[1]), end: re.lastIndex };
  }
  if (last) out.push({ page: last.page, text: text.slice(last.end) });
  return out;
}
