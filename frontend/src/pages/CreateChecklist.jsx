import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUploader from '../components/DocumentUploader.jsx';
import UploadedFileList from '../components/UploadedFileList.jsx';
import GenerationProgress from '../components/GenerationProgress.jsx';
import { useChecklistGeneration, useGenerationPolling } from '../hooks/useChecklistGeneration.js';

export default function CreateChecklist() {
  const navigate = useNavigate();
  const gen = useChecklistGeneration();
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [suggest, setSuggest] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const { job, error: pollError } = useGenerationPolling(generationId);

  const usable = gen.documents.filter((d) => d.status === 'completed');
  const canGenerate = name.trim() && usable.length > 0 && !gen.uploading && !generationId;

  useEffect(() => {
    if (job?.status === 'review') navigate(`/generations/${job.id}/preview`);
  }, [job, navigate]);

  const generate = async () => {
    const id = await gen.start({
      documentIds: usable.map((d) => d.id),
      checklistName: name.trim(),
      instructions,
      includeSuggestedQuestions: suggest,
    });
    if (id) setGenerationId(id);
  };

  return (
    <div>
      <h1>Generate checklist with AI</h1>

      <div className="card">
        <h3>1. Upload documents</h3>
        <DocumentUploader onUpload={gen.upload} uploading={gen.uploading} progress={gen.progress} />
        <UploadedFileList documents={gen.documents} onRemove={gen.removeDocument} />
      </div>

      <div className="card">
        <h3>2. Details</h3>
        <label>Checklist name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Access Management Checklist" />
        </label>
        <label>Instructions (optional)
          <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Focus on user access and approvals." />
        </label>
        <label className="inline">
          <input type="checkbox" checked={suggest} onChange={(e) => setSuggest(e.target.checked)} />
          Also include AI-suggested questions (marked “needs review”, not from the documents)
        </label>
        <div style={{ marginTop: 16 }}>
          <button className="btn primary" disabled={!canGenerate} onClick={generate}>Generate checklist</button>
        </div>
      </div>

      {(gen.error || pollError) && <p className="error">{gen.error || pollError}</p>}
      {generationId && <GenerationProgress job={job} />}
      {job?.status === 'failed' && (
        <button className="btn" onClick={() => setGenerationId(null)}>Try again</button>
      )}
    </div>
  );
}
