import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DynamicFieldRenderer from '../components/DynamicFieldRenderer.jsx';
import SourceReference from '../components/SourceReference.jsx';
import { deleteChecklist, getChecklist, updateChecklist } from '../services/checklistApi.js';
import { typeLabel } from '../utils/fieldTypes.js';

export default function ChecklistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => getChecklist(id).then((r) => setChecklist(r.checklist)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (status) => {
    try { setChecklist((await updateChecklist(id, { status })).checklist); } catch (e) { setError(e.message); }
  };
  const archive = async () => {
    if (!window.confirm('Archive this checklist?')) return;
    try { await deleteChecklist(id); navigate('/'); } catch (e) { setError(e.message); }
  };

  if (error) return <p className="error">{error}</p>;
  if (!checklist) return <p>Loading…</p>;

  return (
    <div>
      <div className="row">
        <div>
          <h1>{checklist.title}</h1>
          <span className={`badge ${checklist.status === 'published' ? 'ok' : ''}`}>{checklist.status}</span>
          <span className="muted"> · version {checklist.version}</span>
        </div>
        <div className="actions">
          {checklist.status === 'published'
            ? <button className="btn" onClick={() => setStatus('draft')}>Unpublish</button>
            : <button className="btn primary" onClick={() => setStatus('published')}>Publish</button>}
          <button className="btn danger" onClick={archive}>Archive</button>
        </div>
      </div>

      {checklist.sections.map((s) => (
        <section className="card" key={s.id}>
          <h2>{s.title}</h2>
          {s.description && <p className="muted">{s.description}</p>}
          {s.masterSections.map((m) => (
            <div className="master" key={m.id}>
              <h3>{m.title}</h3>
              {m.questions.map((q) => (
                <div className={`question static ${q.reviewStatus === 'needs_review' ? 'flag' : ''}`} key={q.id}>
                  <div className="q-text">
                    {q.text} {q.required && <span className="req-star">*</span>}
                    <span className="badge">{typeLabel(q.fieldType)}</span>
                    {q.reviewStatus === 'needs_review' && <span className="badge warn">Needs review</span>}
                  </div>
                  {q.description && <div className="muted">{q.description}</div>}
                  <DynamicFieldRenderer question={q} />
                  <SourceReference source={q.source} />
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
