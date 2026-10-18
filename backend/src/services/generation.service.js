import * as documentRepo from '../repositories/document.repository.js';
import * as genRepo from '../repositories/generation.repository.js';
import * as checklistRepo from '../repositories/checklist.repository.js';
import { generateDraft } from './checklist-generator.service.js';
import { validateEditedDraft } from './checklist-validator.service.js';
import { AppError } from '../utils/errors.js';

export async function startGeneration({ documentIds, checklistName, instructions, includeSuggestedQuestions }) {
  const ids = [...new Set(documentIds)];
  const docs = await documentRepo.findByIds(ids, { withText: false });
  if (docs.length !== ids.length) throw new AppError(404, 'One or more documents were not found.');
  const bad = docs.filter((d) => d.extraction_status !== 'completed');
  if (bad.length) {
    throw new AppError(422, `These documents have no extracted text: ${bad.map((d) => d.original_name).join(', ')}`);
  }

  const jobId = await genRepo.createJob({ checklistName, instructions, includeSuggestedQuestions, documentIds: ids });
  // Run in the background; the client polls GET /api/generations/:id
  setImmediate(() => runGeneration(jobId));
  return jobId;
}

async function runGeneration(jobId) {
  try {
    await genRepo.setProgress(jobId, 'processing', 'Reading extracted document text');
    const job = await genRepo.getJob(jobId);
    const documents = await genRepo.getDocumentsWithText(jobId);
    const { draft, warnings } = await generateDraft({
      documents,
      checklistName: job.job_name,
      instructions: job.instructions,
      includeSuggestedQuestions: !!job.include_suggestions,
      onProgress: (msg) => genRepo.setProgress(jobId, 'processing', msg),
    });
    await genRepo.saveDraft(jobId, draft, warnings);
  } catch (err) {
    console.error(`Generation job ${jobId} failed:`, err.message);
    await genRepo.markFailed(jobId, err.message || 'Generation failed').catch(() => {});
  }
}

async function requireJob(id) {
  const job = await genRepo.getJob(id);
  if (!job) throw new AppError(404, 'Generation not found.');
  return job;
}

export async function getGeneration(id) {
  return genRepo.toApi(await requireJob(id), await genRepo.getDocumentsForJob(id));
}

export async function getPreview(id) {
  const job = await requireJob(id);
  const documents = await genRepo.getDocumentsForJob(id);
  return {
    generation: genRepo.toApi(job, documents),
    draft: job.draft_json ? JSON.parse(job.draft_json) : null,
    warnings: job.warnings_json ? JSON.parse(job.warnings_json) : [],
    documents: documents.map((d) => ({ id: d.id, name: d.original_name })),
  };
}

export async function savePreview(id, rawDraft) {
  const job = await requireJob(id);
  if (job.status !== 'review') throw new AppError(409, `Cannot edit a generation in status "${job.status}".`);
  const docIds = (await genRepo.getDocumentsForJob(id)).map((d) => d.id);
  const draft = validateEditedDraft(rawDraft, docIds);
  await genRepo.updateDraft(id, draft);
  return draft;
}

export async function approve(id) {
  const job = await requireJob(id);
  if (job.status !== 'review') throw new AppError(409, `Cannot approve a generation in status "${job.status}".`);
  const docIds = (await genRepo.getDocumentsForJob(id)).map((d) => d.id);
  const draft = validateEditedDraft(JSON.parse(job.draft_json), docIds);
  return checklistRepo.createFromDraft(id, draft); // transactional
}
