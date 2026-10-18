import { CheckCircle2, XCircle, X } from 'lucide-react';

export default function UploadedFileList({ documents, onRemove }) {
  if (!documents.length) return null;
  return (
    <ul className="filelist">
      {documents.map((d) => (
        <li key={d.id}>
          {d.status === 'completed' ? <CheckCircle2 size={18} color="#16a34a" /> : <XCircle size={18} color="#dc2626" />}
          <div style={{ flex: 1 }}>
            <strong>{d.filename}</strong>
            <div className="muted">
              {d.status === 'completed'
                ? `${d.pageCount ? `${d.pageCount} pages · ` : ''}${d.charCount.toLocaleString()} characters extracted`
                : d.error}
            </div>
          </div>
          <button className="icon" title="Remove from this checklist" onClick={() => onRemove(d.id)}><X size={16} /></button>
        </li>
      ))}
    </ul>
  );
}
