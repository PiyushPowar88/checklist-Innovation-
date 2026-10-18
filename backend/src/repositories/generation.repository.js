import { pool, withTransaction } from '../config/db.js';

export async function createJob({ checklistName, instructions, includeSuggestedQuestions, documentIds }) {
  return withTransaction(async (conn) => {
    const [r] = await conn.execute(
      "INSERT INTO generation_jobs (job_name, status, instructions, include_suggestions, progress_message) VALUES (?, 'pending', ?, ?, 'Queued')",
      [checklistName, instructions || null, includeSuggestedQuestions ? 1 : 0]
    );
    for (const docId of documentIds) {
      await conn.execute('INSERT INTO job_documents (job_id, document_id) VALUES (?,?)', [r.insertId, docId]);
    }
    return r.insertId;
  });
}

export async function getJob(id) {
  const [rows] = await pool.execute(
    `SELECT j.*, (SELECT c.id FROM checklists c WHERE c.job_id = j.id ORDER BY c.id DESC LIMIT 1) AS checklist_id
     FROM generation_jobs j WHERE j.id=?`,
    [id]
  );
  return rows[0] || null;
}

export async function list(limit = 20) {
  const [rows] = await pool.query(
    "SELECT id, job_name, status, progress_message, error_message, created_at, updated_at FROM generation_jobs WHERE status <> 'approved' ORDER BY id DESC LIMIT ?",
    [limit]
  );
  return rows.map((j) => toApi(j));
}

export async function getDocumentsForJob(jobId) {
  const [rows] = await pool.execute(
    `SELECT d.id, d.original_name, d.page_count FROM documents d
     JOIN job_documents jd ON jd.document_id = d.id WHERE jd.job_id=? ORDER BY d.id`,
    [jobId]
  );
  return rows;
}

export async function getDocumentsWithText(jobId) {
  const [rows] = await pool.execute(
    `SELECT d.id, d.original_name, d.extracted_text FROM documents d
     JOIN job_documents jd ON jd.document_id = d.id WHERE jd.job_id=? ORDER BY d.id`,
    [jobId]
  );
  return rows;
}

export const setProgress = (id, status, message) =>
  pool.execute('UPDATE generation_jobs SET status=?, progress_message=?, error_message=NULL WHERE id=?', [
    status,
    String(message).slice(0, 255),
    id,
  ]);

export const saveDraft = (id, draft, warnings) =>
  pool.execute(
    "UPDATE generation_jobs SET status='review', progress_message='Ready for review', draft_json=?, warnings_json=? WHERE id=?",
    [JSON.stringify(draft), JSON.stringify(warnings), id]
  );

export const updateDraft = (id, draft) =>
  pool.execute('UPDATE generation_jobs SET draft_json=? WHERE id=?', [JSON.stringify(draft), id]);

export const markFailed = (id, message) =>
  pool.execute("UPDATE generation_jobs SET status='failed', error_message=?, progress_message='Failed' WHERE id=?", [
    String(message).slice(0, 2000),
    id,
  ]);

/** Jobs left in pending/processing by a server restart can never finish. */
export async function failStuckJobs() {
  const [r] = await pool.execute(
    "UPDATE generation_jobs SET status='failed', error_message='Server restarted during generation. Please start again.' WHERE status IN ('pending','processing')"
  );
  return r.affectedRows;
}

export function toApi(job, documents) {
  return {
    id: job.id,
    name: job.job_name,
    status: job.status,
    progressMessage: job.progress_message,
    errorMessage: job.error_message,
    checklistId: job.checklist_id ?? null,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    ...(documents ? { documents: documents.map((d) => ({ id: d.id, name: d.original_name })) } : {}),
  };
}
