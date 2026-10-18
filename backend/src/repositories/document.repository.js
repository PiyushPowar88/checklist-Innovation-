import { pool } from '../config/db.js';

export async function create({ originalName, storedName, mimeType, fileSize }) {
  const [r] = await pool.execute(
    'INSERT INTO documents (original_name, stored_name, mime_type, file_size) VALUES (?,?,?,?)',
    [originalName, storedName, mimeType, fileSize]
  );
  return r.insertId;
}

export const markProcessing = (id) =>
  pool.execute("UPDATE documents SET extraction_status='processing' WHERE id=?", [id]);

export const markCompleted = (id, text, pageCount) =>
  pool.execute(
    "UPDATE documents SET extraction_status='completed', extracted_text=?, page_count=?, extraction_error=NULL WHERE id=?",
    [text, pageCount ?? null, id]
  );

export const markFailed = (id, error, pageCount) =>
  pool.execute("UPDATE documents SET extraction_status='failed', extraction_error=?, page_count=? WHERE id=?", [
    error,
    pageCount ?? null,
    id,
  ]);

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, original_name, mime_type, file_size, page_count, extraction_status, extraction_error,
            CHAR_LENGTH(extracted_text) AS char_count, LEFT(extracted_text, 500) AS preview, created_at
     FROM documents WHERE id=?`,
    [id]
  );
  return rows[0] || null;
}

export async function findByIds(ids, { withText = true } = {}) {
  if (!ids.length) return [];
  const cols = withText
    ? 'id, original_name, extraction_status, extracted_text'
    : 'id, original_name, extraction_status';
  const [rows] = await pool.query(`SELECT ${cols} FROM documents WHERE id IN (?)`, [ids]);
  return rows;
}
