import { useState } from 'react';

const AddTaskModal = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title required');
    if (!deadline) return setError('Deadline required');
    onAdd({ title: title.trim(), deadline: new Date(deadline).toISOString() });
    setTitle(''); setDeadline(''); setError(''); onClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-md p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">New Task</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs font-mono text-[var(--accent-red)]">{error}</p>}

          <div>
            <label className="text-xs font-mono text-[var(--text-muted)] mb-1.5 block">TITLE</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Submit CS301 Assignment"
              maxLength={500} autoFocus
              className="w-full px-3 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="text-xs font-mono text-[var(--text-muted)] mb-1.5 block">DEADLINE</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none transition-colors [color-scheme:dark]" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
