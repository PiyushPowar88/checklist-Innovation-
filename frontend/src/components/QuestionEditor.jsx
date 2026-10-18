import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { FIELD_TYPES, OPTION_TYPES, REVIEW_STATUSES, defaultOptions, typeLabel } from '../utils/fieldTypes.js';
import DynamicFieldRenderer from './DynamicFieldRenderer.jsx';
import SourceReference from './SourceReference.jsx';

export default function QuestionEditor({ question: q, documentNames, onChange, onDelete, onMove, isFirst, isLast }) {
  const [open, setOpen] = useState(!q.text);
  const set = (patch) => onChange({ ...q, ...patch });
  const hasOptions = OPTION_TYPES.includes(q.fieldType);

  const changeType = (fieldType) => {
    set({ fieldType, options: OPTION_TYPES.includes(fieldType) ? (q.options.length >= 2 ? q.options : defaultOptions(fieldType)) : [] });
  };

  return (
    <div className={`question ${q.reviewStatus === 'needs_review' ? 'flag' : ''}`}>
      <div className="q-head" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="q-text">{q.text || <em>New question</em>}</span>
        <span className="badge">{typeLabel(q.fieldType)}</span>
        {q.required && <span className="badge req">Required</span>}
        {q.reviewStatus === 'needs_review' && <span className="badge warn">Needs review</span>}
        {q.reviewStatus === 'verified' && <span className="badge ok">Verified</span>}
        <span className="actions" onClick={(e) => e.stopPropagation()}>
          <button className="icon" disabled={isFirst} onClick={() => onMove(-1)} title="Move up"><ArrowUp size={14} /></button>
          <button className="icon" disabled={isLast} onClick={() => onMove(1)} title="Move down"><ArrowDown size={14} /></button>
          <button className="icon danger" onClick={onDelete} title="Remove question"><Trash2 size={14} /></button>
        </span>
      </div>

      {open && (
        <div className="q-body">
          <label>Question
            <textarea rows={2} value={q.text} onChange={(e) => set({ text: e.target.value })} />
          </label>
          <label>Description / guidance
            <input value={q.description || ''} onChange={(e) => set({ description: e.target.value })} />
          </label>
          <div className="grid3">
            <label>Field type
              <select value={q.fieldType} onChange={(e) => changeType(e.target.value)}>
                {FIELD_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </label>
            <label>Review status
              <select value={q.reviewStatus} onChange={(e) => set({ reviewStatus: e.target.value })}>
                {REVIEW_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="inline">
              <input type="checkbox" checked={q.required} onChange={(e) => set({ required: e.target.checked })} /> Mandatory
            </label>
          </div>
          {hasOptions && (
            <label>Options (one per line, at least 2)
              <textarea rows={Math.max(3, q.options.length + 1)} value={q.options.join('\n')} onChange={(e) => set({ options: e.target.value.split('\n') })} />
            </label>
          )}
          <div className="preview-box">
            <small className="muted">Field preview</small>
            <DynamicFieldRenderer question={q} />
          </div>
          <SourceReference source={q.source} documentName={q.source?.documentId ? documentNames[q.source.documentId] : null} />
        </div>
      )}
    </div>
  );
}
