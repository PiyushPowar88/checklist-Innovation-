import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const MAX_MB = 15;
const ok = (f) => /\.(pdf|docx)$/i.test(f.name);

export default function DocumentUploader({ onUpload, uploading, progress }) {
  const input = useRef(null);
  const [selected, setSelected] = useState([]);
  const [problems, setProblems] = useState([]);
  const [drag, setDrag] = useState(false);

  const pick = (fileList) => {
    const files = [...fileList];
    const bad = files.filter((f) => !ok(f) || f.size > MAX_MB * 1024 * 1024);
    setProblems(bad.map((f) => `${f.name}: ${!ok(f) ? 'only PDF and DOCX files are allowed' : `larger than ${MAX_MB} MB`}`));
    setSelected(files.filter((f) => !bad.includes(f)));
  };

  const submit = async () => {
    await onUpload(selected);
    setSelected([]);
    if (input.current) input.current.value = '';
  };

  return (
    <div>
      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
      >
        <UploadCloud size={30} />
        <p><strong>Click to choose</strong> or drag PDF / DOCX files here</p>
        <small>Up to {MAX_MB} MB per file</small>
        <input ref={input} type="file" multiple accept=".pdf,.docx" hidden onChange={(e) => pick(e.target.files)} />
      </div>

      {problems.map((p) => <p key={p} className="error">{p}</p>)}
      {selected.length > 0 && (
        <div className="row" style={{ marginTop: 12 }}>
          <span>{selected.length} file(s) selected: {selected.map((f) => f.name).join(', ')}</span>
          <button className="btn primary" disabled={uploading} onClick={submit}>
            {uploading ? `Uploading… ${progress}%` : 'Upload & extract text'}
          </button>
        </div>
      )}
      {uploading && <div className="bar"><div style={{ width: `${progress}%` }} /></div>}
    </div>
  );
}
