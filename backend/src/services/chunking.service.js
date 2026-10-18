const PAGE_RE = /\[\[PAGE (\d+)\]\]/g;

function splitLongText(text, max) {
  if (text.length <= max) return [text];
  const out = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n[[PAGE', max);
    if (cut < max * 0.4) cut = rest.lastIndexOf('\n\n', max);
    if (cut < max * 0.4) cut = rest.lastIndexOf('\n', max);
    if (cut <= 0) cut = max;
    const segment = rest.slice(0, cut);
    out.push(segment);
    rest = rest.slice(cut).replace(/^\n+/, '');
    // Keep page traceability when a page is split across chunks.
    const lastPage = [...segment.matchAll(PAGE_RE)].pop();
    if (lastPage && rest && !rest.startsWith('[[PAGE')) rest = `[[PAGE ${lastPage[1]}]]\n${rest}`;
  }
  if (rest) out.push(rest);
  return out;
}

/** Split documents into chunks that fit the model, each prefixed with a document marker. */
export function buildChunks(documents, maxChars) {
  const pieces = [];
  for (const d of documents) {
    const header = `[[DOCUMENT id=${d.id} name="${String(d.original_name).replace(/"/g, "'")}"]]\n`;
    splitLongText(d.extracted_text || '', Math.max(2000, maxChars - header.length - 50)).forEach((seg) =>
      pieces.push(header + seg)
    );
  }
  const chunks = [];
  let cur = '';
  for (const p of pieces) {
    if (cur && cur.length + p.length + 2 > maxChars) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}
