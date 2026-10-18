import { Loader2 } from 'lucide-react';

const STEPS = ['Extract', 'Generate', 'Validate', 'Review'];

function stepIndex(job) {
  if (!job) return 0;
  if (job.status === 'review' || job.status === 'approved') return 4;
  const m = (job.progressMessage || '').toLowerCase();
  if (m.includes('validat')) return 2;
  if (m.includes('generat')) return 1;
  return 0;
}

export default function GenerationProgress({ job }) {
  const current = stepIndex(job);
  const failed = job?.status === 'failed';
  return (
    <div className="card">
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s} className={failed && i === current ? 'failed' : i < current ? 'done' : i === current ? 'active' : ''}>{s}</li>
        ))}
      </ol>
      {failed ? (
        <p className="error">Generation failed: {job.errorMessage}</p>
      ) : (
        <p className="row" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <Loader2 className="spin" size={18} /> {job?.progressMessage || 'Starting…'}
        </p>
      )}
    </div>
  );
}
