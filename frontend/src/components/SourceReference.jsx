import { FileText } from 'lucide-react';

export default function SourceReference({ source, documentName }) {
  if (!source || (!source.documentId && !source.excerpt)) {
    return <div className="source none">No source reference (not backed by an uploaded document).</div>;
  }
  const name = documentName || source.documentName || `Document #${source.documentId}`;
  return (
    <div className="source">
      <div className="source-head">
        <FileText size={14} /> {name}
        {source.page ? ` · page ${source.page}` : ''}
        {source.reference ? ` · ${source.reference}` : ''}
      </div>
      {source.excerpt && <blockquote>{source.excerpt}</blockquote>}
    </div>
  );
}
