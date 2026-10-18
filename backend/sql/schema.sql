CREATE DATABASE IF NOT EXISTS ai_checklist_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_checklist_db;

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  page_count INT NULL,
  extraction_status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  extraction_error VARCHAR(500) NULL,
  extracted_text LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(255),
  status ENUM('pending','processing','review','approved','failed') DEFAULT 'pending',
  instructions TEXT,
  include_suggestions BOOLEAN NOT NULL DEFAULT FALSE,
  progress_message VARCHAR(255) NULL,
  draft_json LONGTEXT NULL,
  warnings_json LONGTEXT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_documents (
  job_id BIGINT NOT NULL,
  document_id BIGINT NOT NULL,
  PRIMARY KEY (job_id, document_id),
  FOREIGN KEY (job_id) REFERENCES generation_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS checklists (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('draft','published','archived') DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES generation_jobs(id)
);

CREATE TABLE IF NOT EXISTS sections (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  checklist_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS master_sections (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  section_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  master_section_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  description TEXT,
  field_type ENUM('text','textarea','number','date','radio','dropdown','checkbox','file_upload') NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  source_excerpt TEXT,
  confidence DECIMAL(5,4) NULL,
  review_status ENUM('pending','verified','needs_review') DEFAULT 'pending',
  FOREIGN KEY (master_section_id) REFERENCES master_sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_options (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_sources (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT NOT NULL,
  document_id BIGINT NOT NULL,
  page_number INT NULL,
  section_reference VARCHAR(255),
  source_excerpt TEXT,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE RESTRICT
);
