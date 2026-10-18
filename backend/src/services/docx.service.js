import mammoth from 'mammoth';

const strip = (s) => s.replace(/<[^>]+>/g, '');
const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/** Convert mammoth's HTML to text that keeps headings (#), list items (-) and table rows (a | b). */
function htmlToText(html) {
  return decode(
    html
      .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) =>
        `\n${[...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => strip(m[1]).trim()).join(' | ')}\n`
      )
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => `\n\n${'#'.repeat(Number(l))} ${strip(t)}\n\n`)
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/p>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  );
}

/** DOCX has no fixed pages, so page is null (we never guess page numbers). */
export async function extractDocx(filePath) {
  const { value } = await mammoth.convertToHtml({ path: filePath });
  return { pages: [{ page: null, text: htmlToText(value) }], pageCount: null };
}
