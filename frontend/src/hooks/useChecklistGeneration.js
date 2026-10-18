import { useCallback, useEffect, useState } from 'react';
import { generateChecklist, getGeneration, uploadDocuments } from '../services/checklistApi.js';

/** Upload + start generation state for the Create page. */
export function useChecklistGeneration() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = useCallback(async (files) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const res = await uploadDocuments(files, setProgress);
      setDocuments((prev) => [...prev, ...res.documents]);
      if (res.rejected?.length) setError(res.rejected.map((r) => `${r.filename}: ${r.error}`).join(' '));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const removeDocument = (id) => setDocuments((prev) => prev.filter((d) => d.id !== id));

  const start = async (payload) => {
    setError(null);
    try {
      return (await generateChecklist(payload)).id;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  return { documents, uploading, progress, error, setError, upload, removeDocument, start };
}

/** Polls a generation job until it leaves pending/processing. */
export function useGenerationPolling(id, intervalMs = 2000) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let stopped = false;
    let timer;
    const tick = async () => {
      try {
        const { generation } = await getGeneration(id);
        if (stopped) return;
        setJob(generation);
        if (['pending', 'processing'].includes(generation.status)) timer = setTimeout(tick, intervalMs);
      } catch (e) {
        if (!stopped) setError(e.message);
      }
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, intervalMs]);

  return { job, error };
}
