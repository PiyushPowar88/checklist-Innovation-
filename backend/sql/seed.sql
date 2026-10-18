-- Optional: one sample checklist so the Dashboard isn't empty. Run after schema.sql.
USE ai_checklist_db;

INSERT INTO generation_jobs (job_name, status, instructions) VALUES ('Sample job', 'approved', 'Seed data');
SET @job = LAST_INSERT_ID();
INSERT INTO checklists (job_id, title, description, status) VALUES (@job, 'Sample Access Checklist', 'Seed data (no source documents)', 'draft');
SET @cl = LAST_INSERT_ID();
INSERT INTO sections (checklist_id, title, sort_order) VALUES (@cl, 'Access Management', 1);
SET @sec = LAST_INSERT_ID();
INSERT INTO master_sections (section_id, title, sort_order) VALUES (@sec, 'Access Approval', 1);
SET @ms = LAST_INSERT_ID();
INSERT INTO questions (master_section_id, question_text, description, field_type, is_required, sort_order)
VALUES (@ms, 'Is access approved before it is granted?', 'Verify the documented approval process.', 'radio', TRUE, 1);
SET @q = LAST_INSERT_ID();
INSERT INTO question_options (question_id, option_label, sort_order) VALUES (@q,'Yes',1),(@q,'No',2),(@q,'Partially',3),(@q,'N/A',4);
