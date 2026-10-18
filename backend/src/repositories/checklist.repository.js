import { pool, withTransaction } from '../config/db.js';

async function insertHierarchy(conn, checklistId, draft) {
  for (const [si, s] of draft.sections.entries()) {
    const [sr] = await conn.execute(
      'INSERT INTO sections (checklist_id, title, description, sort_order) VALUES (?,?,?,?)',
      [checklistId, s.title, s.description || null, si + 1]
    );
    for (const [mi, ms] of s.masterSections.entries()) {
      const [mr] = await conn.execute(
        'INSERT INTO master_sections (section_id, title, description, sort_order) VALUES (?,?,?,?)',
        [sr.insertId, ms.title, ms.description || null, mi + 1]
      );
      for (const [qi, q] of ms.questions.entries()) {
        const [qr] = await conn.execute(
          `INSERT INTO questions (master_section_id, question_text, description, field_type, is_required,
             sort_order, source_excerpt, confidence, review_status) VALUES (?,?,?,?,?,?,?,?,?)`,
          [mr.insertId, q.text, q.description || null, q.fieldType, q.required ? 1 : 0, qi + 1,
           q.source?.excerpt ?? null, q.confidence ?? null, q.reviewStatus]
        );
        for (const [oi, label] of q.options.entries()) {
          await conn.execute('INSERT INTO question_options (question_id, option_label, sort_order) VALUES (?,?,?)', [
            qr.insertId, label, oi + 1,
          ]);
        }
        if (q.source?.documentId) {
          await conn.execute(
            'INSERT INTO question_sources (question_id, document_id, page_number, section_reference, source_excerpt) VALUES (?,?,?,?,?)',
            [qr.insertId, q.source.documentId, q.source.page ?? null, q.source.reference ?? null, q.source.excerpt ?? null]
          );
        }
      }
    }
  }
}

/** Saves the approved draft and flips the job to 'approved' atomically. */
export async function createFromDraft(jobId, draft) {
  return withTransaction(async (conn) => {
    const [jobs] = await conn.execute('SELECT status FROM generation_jobs WHERE id=? FOR UPDATE', [jobId]);
    if (!jobs[0] || jobs[0].status !== 'review') {
      const err = new Error('This generation was already approved or is not ready.');
      err.status = 409;
      throw err;
    }
    const [r] = await conn.execute(
      "INSERT INTO checklists (job_id, title, description, status) VALUES (?,?,?, 'draft')",
      [jobId, draft.title, draft.description || null]
    );
    await insertHierarchy(conn, r.insertId, draft);
    await conn.execute("UPDATE generation_jobs SET status='approved', progress_message='Approved' WHERE id=?", [jobId]);
    return r.insertId;
  });
}

export async function list() {
  const [rows] = await pool.query(
    `SELECT c.id, c.title, c.description, c.status, c.version, c.created_at, c.updated_at,
       (SELECT COUNT(*) FROM sections s WHERE s.checklist_id = c.id) AS section_count,
       (SELECT COUNT(*) FROM questions q JOIN master_sections ms ON ms.id = q.master_section_id
          JOIN sections s ON s.id = ms.section_id WHERE s.checklist_id = c.id) AS question_count
     FROM checklists c WHERE c.status <> 'archived' ORDER BY c.created_at DESC, c.id DESC`
  );
  return rows.map((r) => ({
    id: r.id, title: r.title, description: r.description, status: r.status, version: r.version,
    sectionCount: r.section_count, questionCount: r.question_count, createdAt: r.created_at, updatedAt: r.updated_at,
  }));
}

const group = (rows, key) =>
  rows.reduce((m, r) => ((m[r[key]] ||= []).push(r), m), {});

export async function getById(id) {
  const [cr] = await pool.execute('SELECT * FROM checklists WHERE id=?', [id]);
  const c = cr[0];
  if (!c) return null;

  const [sections] = await pool.execute('SELECT * FROM sections WHERE checklist_id=? ORDER BY sort_order, id', [id]);
  const sIds = sections.map((s) => s.id);
  const [masters] = sIds.length
    ? await pool.query('SELECT * FROM master_sections WHERE section_id IN (?) ORDER BY sort_order, id', [sIds])
    : [[]];
  const mIds = masters.map((m) => m.id);
  const [questions] = mIds.length
    ? await pool.query('SELECT * FROM questions WHERE master_section_id IN (?) ORDER BY sort_order, id', [mIds])
    : [[]];
  const qIds = questions.map((q) => q.id);
  const [options] = qIds.length
    ? await pool.query('SELECT * FROM question_options WHERE question_id IN (?) ORDER BY sort_order, id', [qIds])
    : [[]];
  const [sources] = qIds.length
    ? await pool.query(
        `SELECT qs.*, d.original_name FROM question_sources qs JOIN documents d ON d.id = qs.document_id
         WHERE qs.question_id IN (?)`,
        [qIds]
      )
    : [[]];

  const optionsByQ = group(options, 'question_id');
  const sourceByQ = Object.fromEntries(sources.map((s) => [s.question_id, s]));
  const questionsByM = group(questions, 'master_section_id');
  const mastersBySection = group(masters, 'section_id');

  return {
    id: c.id, jobId: c.job_id, title: c.title, description: c.description || '', status: c.status,
    version: c.version, createdAt: c.created_at, updatedAt: c.updated_at,
    sections: sections.map((s) => ({
      id: s.id, title: s.title, description: s.description || '', order: s.sort_order,
      masterSections: (mastersBySection[s.id] || []).map((m) => ({
        id: m.id, title: m.title, description: m.description || '', order: m.sort_order,
        questions: (questionsByM[m.id] || []).map((q) => {
          const src = sourceByQ[q.id];
          return {
            id: q.id, text: q.question_text, description: q.description || '', fieldType: q.field_type,
            required: !!q.is_required, order: q.sort_order, reviewStatus: q.review_status,
            confidence: q.confidence === null ? null : Number(q.confidence),
            options: (optionsByQ[q.id] || []).map((o) => o.option_label),
            source: src
              ? { documentId: src.document_id, documentName: src.original_name, page: src.page_number,
                  reference: src.section_reference, excerpt: src.source_excerpt }
              : null,
          };
        }),
      })),
    })),
  };
}

export async function update(id, { title, description, status, draft }) {
  return withTransaction(async (conn) => {
    const sets = [];
    const vals = [];
    if (title !== undefined) { sets.push('title=?'); vals.push(title); }
    if (description !== undefined) { sets.push('description=?'); vals.push(description || null); }
    if (status !== undefined) { sets.push('status=?'); vals.push(status); }
    if (draft) {
      sets.push('title=?', 'description=?', 'version=version+1');
      vals.push(draft.title, draft.description || null);
    }
    if (sets.length) await conn.execute(`UPDATE checklists SET ${sets.join(', ')} WHERE id=?`, [...vals, id]);
    if (draft) {
      await conn.execute('DELETE FROM sections WHERE checklist_id=?', [id]); // cascades
      await insertHierarchy(conn, id, draft);
    }
  });
}

/** Archive by default; hard=true removes the checklist and its hierarchy. */
export async function remove(id, hard = false) {
  if (hard) await pool.execute('DELETE FROM checklists WHERE id=?', [id]);
  else await pool.execute("UPDATE checklists SET status='archived' WHERE id=?", [id]);
}
