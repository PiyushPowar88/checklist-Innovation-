import * as checklistRepo from '../repositories/checklist.repository.js';
import * as genRepo from '../repositories/generation.repository.js';
import { validateEditedDraft } from './checklist-validator.service.js';
import { AppError } from '../utils/errors.js';

export const list = () => checklistRepo.list();

export async function get(id) {
  const checklist = await checklistRepo.getById(id);
  if (!checklist) throw new AppError(404, 'Checklist not found.');
  return checklist;
}

export async function update(id, body) {
  const existing = await get(id);
  let draft;
  if (body.sections) {
    const docIds = (await genRepo.getDocumentsForJob(existing.jobId)).map((d) => d.id);
    draft = validateEditedDraft(
      { title: body.title ?? existing.title, description: body.description ?? existing.description, sections: body.sections },
      docIds
    );
  }
  await checklistRepo.update(id, { title: body.title, description: body.description, status: body.status, draft });
  return get(id);
}

export async function remove(id, hard) {
  await get(id);
  await checklistRepo.remove(id, hard);
}
