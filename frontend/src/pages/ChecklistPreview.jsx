import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import ChecklistTree from '../components/ChecklistTree.jsx';
import GenerationProgress from '../components/GenerationProgress.jsx';
import { useGenerationPolling } from '../hooks/useChecklistGeneration.js';
import { approveChecklist, getChecklistPreview, savePreview } from '../services/checklistApi.js';
import { withKeys } from '../utils/fieldTypes.js';

export default function ChecklistPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { job, error: pollError } = useGenerationPolling(id);
  const [draft, setDraft] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (job?.status !== 'review' || draft) return;
    getChecklistPreview(id)
      .then((p) => { setDraft(withKeys(p.draft)); setWarnings(p.warnings); setDocuments(p.documents); })
      .catch((e) => setError(e.message));
  }, [job, id, draft]);

  const documentNames = useMemo(() => Object.fromEntries(documents.map((d) => [d.id, d.name])), [documents]);
  const stats = useMemo(() => {
    if (!draft) return null;
    const qs = draft.sections.flatMap((s) => s.masterSections.flatMap((m) => m.questions));
    return { total: qs.length, review: qs.filter((q) => q.reviewStatus === 'needs_review').length };
  }, [draft]);

  const run = async (fn) => {
    setBusy(true); setError(null); setMessage(null);
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const save = () => run(async () => { await savePreview(id, draft); setMessage('Draft saved.'); });
  const approve = () => run(async () => {
    await savePreview(id, draft); // persist the latest edits first
    const { checklistId } = await approveChecklist(id);
    navigate(`/checklists/${checklistId}`);
  });

  if (pollError || error && !draft) return <p className="error">{pollError || error}</p>;
  if (!job) return <p>Loading…</p>;
  if (['pending', 'processing', 'failed'].includes(job.status)) return <GenerationProgress job={job} />;
  if (job.status === 'approved') {
    return <p>This checklist was already approved. {job.checklistId && <Link to={`/checklists/${job.checklistId}`}>Open it</Link>}</p>;
  }
  if (!draft) return <p>Loading draft…</p>;

  return (
    <div>
      <div className="row">
        <div style={{ flex: 1 }}>
          <input className="title-input huge" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <div className="muted">{stats.total} questions · {stats.review} need review · sources: {documents.map((d) => d.name).join(', ')}</div>
        </div>
        <div className="actions">
          <button className="btn" disabled={busy} onClick={save}>Save draft</button>
          <button className="btn primary" disabled={busy} onClick={approve}>Approve & save checklist</button>
        </div>
      </div>

      {message && <p className="ok-text">{message}</p>}
      {error && <p className="error">{error}</p>}

      {warnings.length > 0 && (
        <div className="card warnbox">
          <h3><AlertTriangle size={16} /> {warnings.length} item(s) to check</h3>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      <ChecklistTree draft={draft} onChange={setDraft} documentNames={documentNames} />
    </div>
  );
}
