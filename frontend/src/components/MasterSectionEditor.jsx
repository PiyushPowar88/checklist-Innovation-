import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export default function MasterSectionEditor({ master, onChange, onDelete, onMove, onAddQuestion, isFirst, isLast, children }) {
  return (
    <div className="master">
      <div className="row">
        <input className="title-input" value={master.title} onChange={(e) => onChange({ ...master, title: e.target.value })} />
        <span className="actions">
          <button className="icon" disabled={isFirst} onClick={() => onMove(-1)} title="Move up"><ArrowUp size={14} /></button>
          <button className="icon" disabled={isLast} onClick={() => onMove(1)} title="Move down"><ArrowDown size={14} /></button>
          <button className="icon danger" onClick={onDelete} title="Remove master section"><Trash2 size={14} /></button>
        </span>
      </div>
      {children}
      <button className="btn small" onClick={onAddQuestion}><Plus size={14} /> Add question</button>
    </div>
  );
}
