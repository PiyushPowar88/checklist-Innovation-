import { Link, Route, Routes } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import CreateChecklist from './pages/CreateChecklist.jsx';
import ChecklistPreview from './pages/ChecklistPreview.jsx';
import ChecklistDetails from './pages/ChecklistDetails.jsx';

export default function App() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <ClipboardCheck size={22} /> AI Checklist Generator
        </Link>
        <Link to="/create" className="btn primary">Generate with AI</Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateChecklist />} />
          <Route path="/generations/:id/preview" element={<ChecklistPreview />} />
          <Route path="/checklists/:id" element={<ChecklistDetails />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
