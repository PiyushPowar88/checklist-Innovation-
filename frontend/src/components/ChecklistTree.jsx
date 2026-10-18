import { Plus } from 'lucide-react';
import SectionEditor from './SectionEditor.jsx';
import MasterSectionEditor from './MasterSectionEditor.jsx';
import QuestionEditor from './QuestionEditor.jsx';
import { moveItem, newMasterSection, newQuestion, newSection, removeAt, replaceAt } from '../utils/fieldTypes.js';

/** Controlled editor for the whole draft hierarchy. */
export default function ChecklistTree({ draft, onChange, documentNames = {} }) {
  const sections = draft.sections;
  const setSections = (next) => onChange({ ...draft, sections: next });
  const setSection = (si, patch) => setSections(replaceAt(sections, si, patch));

  return (
    <div>
      {sections.map((s, si) => (
        <SectionEditor
          key={s._key}
          section={s}
          isFirst={si === 0}
          isLast={si === sections.length - 1}
          onChange={(v) => setSection(si, v)}
          onDelete={() => window.confirm(`Remove section "${s.title}" and everything in it?`) && setSections(removeAt(sections, si))}
          onMove={(d) => setSections(moveItem(sections, si, d))}
          onAddMaster={() => setSection(si, { ...s, masterSections: [...s.masterSections, newMasterSection()] })}
        >
          {s.masterSections.map((m, mi) => {
            const setMasters = (next) => setSection(si, { ...s, masterSections: next });
            const setMaster = (v) => setMasters(replaceAt(s.masterSections, mi, v));
            return (
              <MasterSectionEditor
                key={m._key}
                master={m}
                isFirst={mi === 0}
                isLast={mi === s.masterSections.length - 1}
                onChange={setMaster}
                onDelete={() => window.confirm(`Remove master section "${m.title}"?`) && setMasters(removeAt(s.masterSections, mi))}
                onMove={(d) => setMasters(moveItem(s.masterSections, mi, d))}
                onAddQuestion={() => setMaster({ ...m, questions: [...m.questions, newQuestion()] })}
              >
                {m.questions.map((q, qi) => (
                  <QuestionEditor
                    key={q._key}
                    question={q}
                    documentNames={documentNames}
                    isFirst={qi === 0}
                    isLast={qi === m.questions.length - 1}
                    onChange={(v) => setMaster({ ...m, questions: replaceAt(m.questions, qi, v) })}
                    onDelete={() => setMaster({ ...m, questions: removeAt(m.questions, qi) })}
                    onMove={(d) => setMaster({ ...m, questions: moveItem(m.questions, qi, d) })}
                  />
                ))}
              </MasterSectionEditor>
            );
          })}
        </SectionEditor>
      ))}
      <button className="btn" onClick={() => setSections([...sections, newSection()])}><Plus size={16} /> Add section</button>
    </div>
  );
}
