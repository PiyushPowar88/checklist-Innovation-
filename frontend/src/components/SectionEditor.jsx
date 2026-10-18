import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export default function SectionEditor({ section, onChange, onDelete, onMove, onAddMaster, isFirst, isLast, children }) {
  return (
    <section className="section card">
      <div className="row">
        <input className="title-input big" value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
        <span className="actions">
          <button className="icon" disabled={isFirst} onClick={() => onMove(-1)} title="Move up"><ArrowUp size={16} /></button>
          <button className="icon" disabled={isLast} onClick={() => onMove(1)} title="Move down"><ArrowDown size={16} /></button>
          <button className="icon danger" onClick={onDelete} title="Remove section"><Trash2 size={16} /></button>
        </span>
      </div>
      <input
        className="desc-input"
        placeholder="Section description"
        value={section.description || ''}
        onChange={(e) => onChange({ ...section, description: e.target.value })}
      />
      {children}
      <button className="btn small" onClick={onAddMaster}><Plus size={14} /> Add master section</button>
    </section>
  );
}
