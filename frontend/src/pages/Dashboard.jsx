import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { listChecklists, listGenerations } from '../services/checklistApi.js';

const fmt = (d) => new Date(d).toLocaleString();

export default function Dashboard() {
  const [checklists, setChecklists] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([listChecklists(), listGenerations()])
      .then(([c, g]) => { setChecklists(c.checklists); setDrafts(g.generations); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="row"><h1>Checklists</h1><Link to="/create" className="btn primary"><Plus size={16} /> New checklist</Link></div>
      {error && <p className="error">{error}</p>}

      {drafts.length > 0 && (
        <div className="card">
          <h3>In progress</h3>
          <table>
            <thead><tr><th>Name</th><th>Status</th><th>Started</th><th /></tr></thead>
            <tbody>
              {drafts.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td><span className={`badge ${g.status === 'failed' ? 'warn' : ''}`}>{g.status === 'review' ? 'Awaiting review' : g.status}</span></td>
                  <td>{fmt(g.createdAt)}</td>
                  <td>{g.status === 'review' ? <Link to={`/generations/${g.id}/preview`}>Review draft</Link> : g.status === 'failed' ? <span className="muted">{g.errorMessage?.slice(0, 60)}</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        {!checklists ? <p>Loading…</p> : checklists.length === 0 ? (
          <p className="muted">No saved checklists yet. Click “New checklist” and upload a policy or procedure document.</p>
        ) : (
          <table>
            <thead><tr><th>Title</th><th>Status</th><th>Sections</th><th>Questions</th><th>Created</th></tr></thead>
            <tbody>
              {checklists.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/checklists/${c.id}`}>{c.title}</Link></td>
                  <td><span className={`badge ${c.status === 'published' ? 'ok' : ''}`}>{c.status}</span></td>
                  <td>{c.sectionCount}</td><td>{c.questionCount}</td><td>{fmt(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
