# AI Checklist Generator (local)

Upload PDF/DOCX policy documents → AI generates sections, master sections, questions, field types,
mandatory flags, options and source references → review/edit → approve → saved in MySQL.

Stack: React + Vite · Node + Express · MySQL · Groq. Nothing is deployed; everything runs locally.

## 1. Database
Run `backend/sql/schema.sql` in MySQL Workbench (optionally `seed.sql` for one sample checklist).

## 2. Backend
```
cd backend
npm install
# edit .env: DB_USER, DB_PASSWORD, GROQ_API_KEY, GROQ_MODEL (a model ID enabled on YOUR Groq account)
npm run dev          # http://localhost:5000  (health: /api/health)
```

## 3. Frontend
```
cd frontend
npm install
npm run dev          # http://localhost:5173
```

## How it works
1. `POST /api/documents/upload` – magic-byte validation, text extraction (PDF per page, DOCX with headings/tables).
   Scanned/empty files are flagged "OCR required".
2. `POST /api/generations` – starts a background job; the UI polls `GET /api/generations/:id`.
   Text is split into chunks; each chunk goes to Groq; results are merged by section/master-section title.
3. Validation (zod + rules): bad field types fixed, option rules enforced, duplicates removed,
   every source excerpt is checked against the document text, and page numbers are taken from the
   verified page (never trusted from the model). Unverifiable questions become **needs_review**.
4. `GET/PUT /api/generations/:id/preview` – edit the draft in the UI.
5. `POST /api/generations/:id/approve` – saved in ONE MySQL transaction (all or nothing).

## Additions beyond the original plan
- `generation_jobs.draft_json / warnings_json / progress_message` hold the editable draft; `documents.page_count / extraction_error`.
- `GET /api/generations` (resume unapproved drafts from the Dashboard); `DELETE /api/checklists/:id` archives (`?hard=true` deletes).
- `generation.service.js`, `utils/errors.js`, `env.js` as small helpers.

## Privacy
With Groq, extracted document text is sent to an external API. For documents that must never leave the
machine, swap `ai.service.js` for a local model (e.g. Ollama) – nothing else needs to change.

## Not included yet (production)
Authentication / client ownership, OCR for scanned PDFs, audit logs, retention rules, automated tests.
