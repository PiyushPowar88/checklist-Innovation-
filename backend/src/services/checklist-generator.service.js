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

export async function generateDraft({ documents, checklistName, instructions, includeSuggestedQuestions, onProgress }) {
  const chunks = buildChunks(documents, env.chunkChars);
  if (!chunks.length) throw new AppError(422, 'The selected documents contain no text.');
  if (chunks.length > MAX_CHUNKS) {
    throw new AppError(422, `These documents are too large (${chunks.length} parts, max ${MAX_CHUNKS}). Split them or upload fewer files.`);
  }

  const merged = { title: checklistName, description: '', sections: [] };

  for (let i = 0; i < chunks.length; i++) {
    await onProgress?.(`Generating checklist — part ${i + 1} of ${chunks.length}`);
    const prompt = buildGenerationPrompt({
      chunk: chunks[i],
      index: i,
      total: chunks.length,
      checklistName,
      instructions,
      includeSuggestedQuestions,
      existingSections: merged.sections.map((s) => s.title),
    });
    mergeInto(merged, await generateJson(prompt));
  }

  await onProgress?.('Validating generated checklist and verifying sources');
  return validateGeneratedDraft(merged, documents);
}
