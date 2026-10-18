// KEEP IN SYNC with backend/src/schemas/checklist.schema.js
export const FIELD_TYPES = [
  { value: 'text', label: 'Text box' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date picker' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'file_upload', label: 'File upload' },
];
export const OPTION_TYPES = ['radio', 'dropdown', 'checkbox'];
export const REVIEW_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'needs_review', label: 'Needs review' },
];

export const typeLabel = (v) => FIELD_TYPES.find((f) => f.value === v)?.label ?? v;
export const defaultOptions = (type) =>
  type === 'radio' ? ['Yes', 'No', 'N/A'] : OPTION_TYPES.includes(type) ? ['Option 1', 'Option 2'] : [];

let n = 0;
export const uid = () => `k${Date.now().toString(36)}${n++}`;

export const newQuestion = () => ({
  _key: uid(), text: '', description: '', fieldType: 'text', required: true, options: [],
  source: null, reviewStatus: 'pending',
});
export const newMasterSection = () => ({ _key: uid(), title: 'New master section', description: '', questions: [newQuestion()] });
export const newSection = () => ({ _key: uid(), title: 'New section', description: '', masterSections: [newMasterSection()] });

/** Add stable client-side keys (the backend strips unknown fields). */
export const withKeys = (draft) => ({
  ...draft,
  sections: draft.sections.map((s) => ({
    ...s, _key: uid(),
    masterSections: s.masterSections.map((m) => ({
      ...m, _key: uid(),
      questions: m.questions.map((q) => ({ ...q, _key: uid() })),
    })),
  })),
});

export const replaceAt = (arr, i, v) => arr.map((x, idx) => (idx === i ? v : x));
export const removeAt = (arr, i) => arr.filter((_, idx) => idx !== i);
export const moveItem = (arr, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
};
