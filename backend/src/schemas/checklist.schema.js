import { z } from 'zod';

// KEEP IN SYNC with frontend/src/utils/fieldTypes.js
export const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'radio', 'dropdown', 'checkbox', 'file_upload'];
export const OPTION_FIELD_TYPES = ['radio', 'dropdown', 'checkbox'];
export const REVIEW_STATUSES = ['pending', 'verified', 'needs_review'];

const ALIASES = {
  select: 'dropdown', multiselect: 'checkbox', multi_select: 'checkbox', checkboxes: 'checkbox',
  file: 'file_upload', upload: 'file_upload', fileupload: 'file_upload', string: 'text',
  long_text: 'textarea', longtext: 'textarea', paragraph: 'textarea', integer: 'number', datepicker: 'date',
};

const lenientText = (max) => z.string().max(max).nullish().transform((v) => v ?? '');
const intOrNull = z.preprocess(
  (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Math.trunc(Number(v))),
  z.number().int().positive().nullable()
);

const sourceSchema = z
  .object({
    documentId: intOrNull.optional(),
    page: intOrNull.optional(),
    reference: z.string().max(255).nullish(),
    excerpt: z.string().max(5000).nullish(),
  })
  .nullish();

const questionSchema = z.object({
  text: z.string().trim().min(3).max(2000),
  description: lenientText(4000),
  fieldType: z.preprocess((v) => {
    const k = String(v ?? '').toLowerCase().trim();
    return ALIASES[k] ?? k;
  }, z.enum(FIELD_TYPES)),
  required: z.boolean().default(true),
  options: z
    .array(z.preprocess((v) => String(v ?? ''), z.string().max(255)))
    .nullish()
    .transform((v) => v ?? []),
  source: sourceSchema,
  confidence: z.number().min(0).max(1).nullish(),
  reviewStatus: z.enum(REVIEW_STATUSES).default('pending'),
});

const masterSectionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: lenientText(4000),
  questions: z.array(questionSchema).default([]),
});

const sectionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: lenientText(4000),
  masterSections: z.array(masterSectionSchema).default([]),
});

export const draftSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: lenientText(4000),
  sections: z.array(sectionSchema).default([]),
});

// ---- Request schemas ----
export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createGenerationSchema = z.object({
  documentIds: z.array(z.coerce.number().int().positive()).min(1).max(20),
  checklistName: z.string().trim().min(1).max(255),
  instructions: z.string().max(4000).optional().default(''),
  includeSuggestedQuestions: z.boolean().optional().default(false),
});

export const updateChecklistSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().max(4000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sections: z.array(z.any()).optional(),
});
