/** Renders the correct control for a question's field type (used in preview and saved view). */
export default function DynamicFieldRenderer({ question, disabled = false }) {
  const { fieldType, options = [] } = question;
  const name = `f-${question._key ?? question.id}`;

  switch (fieldType) {
    case 'textarea': return <textarea rows={3} disabled={disabled} placeholder="Answer…" />;
    case 'number': return <input type="number" disabled={disabled} />;
    case 'date': return <input type="date" disabled={disabled} />;
    case 'file_upload': return <input type="file" disabled={disabled} />;
    case 'dropdown':
      return (
        <select disabled={disabled} defaultValue="">
          <option value="" disabled>Select…</option>
          {options.map((o, i) => <option key={i}>{o}</option>)}
        </select>
      );
    case 'radio':
      return (
        <div className="choices">
          {options.map((o, i) => (
            <label key={i}><input type="radio" name={name} disabled={disabled} /> {o}</label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="choices">
          {options.map((o, i) => (
            <label key={i}><input type="checkbox" disabled={disabled} /> {o}</label>
          ))}
        </div>
      );
    default: return <input type="text" disabled={disabled} placeholder="Answer…" />;
  }
}
