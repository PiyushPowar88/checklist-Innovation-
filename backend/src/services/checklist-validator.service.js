import { draftSchema, OPTION_FIELD_TYPES } from '../schemas/checklist.schema.js';
import { AppError } from '../utils/errors.js';
import { splitPages } from './text-cleaner.service.js';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const issues = (error) =>
  error.issues.slice(0, 10).map((i) => `${i.path.join('.') || 'root'}: ${i.message}`);

function parseStructure(raw) {
  const r = draftSchema.safeParse(raw);
  if (!r.success) throw new AppError(422, 'Checklist structure is invalid', issues(r.error));
  return r.data;
}

const short = (t) => (t.length > 60 ? `${t.slice(0, 57)}...` : t);

/** repair=true (AI output): fix and warn. repair=false (user edits): throw. */
function applyOptionRules(q, repair, warnings) {
  if (!OPTION_FIELD_TYPES.includes(q.fieldType)) {
    q.options = [];
    return;
  }
  q.options = [...new Set(q.options.map((o) => o.trim()).filter(Boolean))];
  if (q.options.length >= 2) return;
  if (!repair) throw new AppError(422, `"${short(q.text)}" needs at least 2 options for a ${q.fieldType} field.`);
  if (q.fieldType === 'radio') {
    q.options = ['Yes', 'No', 'N/A'];
    warnings.push(`"${short(q.text)}": options were missing, defaulted to Yes/No/N/A.`);
  } else {
    warnings.push(`"${short(q.text)}": ${q.fieldType} had no usable options, changed to a text field.`);
    q.fieldType = 'text';
    q.options = [];
  }
  q.reviewStatus = 'needs_review';
}

function renumberAndPrune(draft, warnings) {
  draft.sections = draft.sections
    .map((s) => {
      s.masterSections = s.masterSections.filter((ms) => ms.questions.length > 0);
      return s;
    })
    .filter((s) => {
      if (!s.masterSections.length) warnings.push(`Section "${s.title}" had no questions and was removed.`);
      return s.masterSections.length > 0;
    });
  if (!draft.sections.length) return false;
  return true;
}

/** Validate + repair + verify sources of a freshly generated draft. */
export function validateGeneratedDraft(raw, documents) {
  const warnings = [];
  const draft = parseStructure(raw);

  const docs = new Map(
    documents.map((d) => {
      const pages = splitPages(d.extracted_text).map((p) => ({ page: p.page, norm: norm(p.text) }));
      return [d.id, { pages, full: pages.map((p) => p.norm).join(' ') }];
    })
  );
  const onlyDocId = documents.length === 1 ? documents[0].id : null;
  const seen = new Set();

  for (const s of draft.sections) {
    for (const ms of s.masterSections) {
      ms.questions = ms.questions.filter((q) => {
        const key = norm(q.text);
        if (seen.has(key)) {
          warnings.push(`Duplicate question removed: "${short(q.text)}"`);
          return false;
        }
        seen.add(key);
        return true;
      });

      for (const q of ms.questions) {
        applyOptionRules(q, true, warnings);
        verifySource(q, docs, onlyDocId, warnings);
      }
    }
  }

  if (!renumberAndPrune(draft, warnings)) {
    throw new AppError(422, 'The AI did not produce any usable questions from these documents.');
  }
  return { draft, warnings };
}

function flag(q, warnings, msg) {
  q.reviewStatus = 'needs_review';
  warnings.push(`"${short(q.text)}": ${msg}`);
}

function verifySource(q, docs, onlyDocId, warnings) {
  if (!q.source) {
    if (q.reviewStatus !== 'needs_review') flag(q, warnings, 'no source reference (not backed by the documents).');
    return;
  }
  const src = q.source;
  if (!docs.has(src.documentId)) {
    if (onlyDocId) src.documentId = onlyDocId;
    else {
      src.documentId = null;
      src.page = null;
      flag(q, warnings, 'source document could not be identified.');
      return;
    }
  }
  const doc = docs.get(src.documentId);
  const excerpt = norm(src.excerpt);

  if (excerpt.length < 8) {
    src.page = null; // cannot verify, so never trust the page
    flag(q, warnings, 'no verifiable source excerpt.');
    return;
  }
  const hit = doc.pages.find((p) => p.norm.includes(excerpt));
  if (hit) {
    src.page = hit.page; // verified page (null for DOCX)
  } else if (doc.full.includes(excerpt)) {
    // excerpt spans pages: keep model page only if it is a real page
    if (!doc.pages.some((p) => p.page === src.page)) src.page = null;
  } else {
    src.page = null;
    flag(q, warnings, 'source excerpt was not found verbatim in the document — verify manually.');
  }
}

/** Strict validation for user-edited drafts (preview save + approve). */
export function validateEditedDraft(raw, allowedDocIds = []) {
  const draft = parseStructure(raw);
  for (const s of draft.sections)
    for (const ms of s.masterSections)
      for (const q of ms.questions) {
        applyOptionRules(q, false, []);
        if (q.source?.documentId && !allowedDocIds.includes(q.source.documentId)) {
          throw new AppError(422, `"${short(q.text)}" references a document that is not part of this checklist.`);
        }
      }
  if (!draft.sections.some((s) => s.masterSections.some((ms) => ms.questions.length))) {
    throw new AppError(422, 'A checklist needs at least one question.');
  }
  return draft;
}
