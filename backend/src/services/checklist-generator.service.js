import { env } from '../config/env.js';
import { buildChunks } from './chunking.service.js';
import { buildGenerationPrompt } from './prompt.service.js';
import { generateJson } from './ai.service.js';
import { validateGeneratedDraft } from './checklist-validator.service.js';
import { AppError } from '../utils/errors.js';

const MAX_CHUNKS = 40;
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
const clip = (s, n = 255) => String(s ?? '').trim().slice(0, n);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function findOrCreate(list, title, extra) {
  const key = norm(title);
  let item = list.find((x) => norm(x.title) === key);
  if (!item) {
    item = { title: clip(title) || 'Untitled', description: '', ...extra };
    list.push(item);
  }
  return item;
}

function mergeInto(merged, part) {
  for (const s of Array.isArray(part?.sections) ? part.sections : []) {
    if (!isObj(s)) continue;
    const section = findOrCreate(merged.sections, s.title, { masterSections: [] });
    if (!section.description && s.description) section.description = String(s.description);
    for (const ms of Array.isArray(s.masterSections) ? s.masterSections : []) {
      if (!isObj(ms)) continue;
      const master = findOrCreate(section.masterSections, ms.title, { questions: [] });
      if (!master.description && ms.description) master.description = String(ms.description);
      for (const q of Array.isArray(ms.questions) ? ms.questions : []) if (isObj(q)) master.questions.push(q);
    }
  }
}


const DOC_RE = /\[\[DOCUMENT id=\d+ name=".*?"\]\]/g;

/** Split a chunk in two, keeping the document/page markers so sources stay traceable. */
function splitChunk(text) {
  let mid = text.lastIndexOf('\n\n', Math.floor(text.length / 2));
  if (mid < text.length * 0.25) mid = text.indexOf('\n', Math.floor(text.length / 2));
  if (mid <= 0) mid = Math.floor(text.length / 2);
  const left = text.slice(0, mid);
  let right = text.slice(mid).replace(/^\n+/, '');
  const page = [...left.matchAll(/\[\[PAGE \d+\]\]/g)].pop();
  if (page && !right.startsWith('[[PAGE')) right = `${page[0]}\n${right}`;
  const doc = [...left.matchAll(DOC_RE)].pop();
  if (doc && !right.startsWith('[[DOCUMENT')) right = `${doc[0]}\n${right}`;
  return [left, right];
}

/** Generate for one chunk; if the model output is cut off, retry on two smaller halves. */
async function processChunk(text, ctx, depth = 0) {
  try {
    return [await generateJson(buildGenerationPrompt({ ...ctx, chunk: text }))];
  } catch (err) {
    if (err.code !== 'OUTPUT_TRUNCATED' || depth >= 4 || text.length < 1200) throw err;
    const [a, b] = splitChunk(text);
    return [...(await processChunk(a, ctx, depth + 1)), ...(await processChunk(b, ctx, depth + 1))];
  }
}

export async function generateDraft({ documents, checklistName, instructions, includeSuggestedQuestions, onProgress }) {
  const chunks = buildChunks(documents, env.chunkChars);
  if (!chunks.length) throw new AppError(422, 'The selected documents contain no text.');
  if (chunks.length > MAX_CHUNKS) {
    throw new AppError(422, `These documents are too large (${chunks.length} parts, max ${MAX_CHUNKS}). Split them or upload fewer files.`);
  }

  const merged = { title: checklistName, description: '', sections: [] };

  for (let i = 0; i < chunks.length; i++) {
    await onProgress?.(`Generating checklist — part ${i + 1} of ${chunks.length}`);
    const parts = await processChunk(chunks[i], {
      index: i,
      total: chunks.length,
      checklistName,
      instructions,
      includeSuggestedQuestions,
      existingSections: merged.sections.map((s) => s.title),
    });
    parts.forEach((p) => mergeInto(merged, p));
  }

  await onProgress?.('Validating generated checklist and verifying sources');
  return validateGeneratedDraft(merged, documents);
}