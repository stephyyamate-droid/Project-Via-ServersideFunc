import { useEffect, useState } from 'react';
import { Save, Loader2, Code2 } from 'lucide-react';
import { Modal } from './Modal';
import { createScript, updateScript } from '../lib/api';
import type { Script, ScriptCategory, ScriptStatus } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Script | null;
}

const CATEGORIES: ScriptCategory[] = ['Utility', 'Admin', 'Fun', 'Anti-Exploit', 'Economy'];
const STATUSES: ScriptStatus[] = ['working', 'patched', 'checking'];

export function ScriptModal({ open, onClose, onSaved, editing }: Props) {
  const [title, setTitle] = useState('');
  const [gameName, setGameName] = useState('Universal');
  const [status, setStatus] = useState<ScriptStatus>('working');
  const [category, setCategory] = useState<ScriptCategory>('Utility');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '');
      setGameName(editing?.game_name ?? 'Universal');
      setStatus(editing?.status ?? 'working');
      setCategory(editing?.category ?? 'Utility');
      setDescription(editing?.description ?? '');
      setCode(editing?.code ?? "print('Hello from PUNCH.CLUB')");
      setError('');
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      setError('Title and code are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateScript(editing.id, {
          title: title.trim(),
          game_name: gameName.trim() || 'Universal',
          status, category,
          description: description.trim(),
          code,
        });
      } else {
        await createScript({
          title: title.trim(),
          game_name: gameName.trim() || 'Universal',
          status, category,
          description: description.trim(),
          code,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Script' : 'New Script'}
      subtitle={editing ? editing.title : 'Add a script to the hub'}
      icon={<Code2 className="h-5 w-5" />}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-red" disabled={saving} onClick={submit}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="Server Status" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Game</label>
            <input className="input" placeholder="Universal" value={gameName} onChange={(e) => setGameName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ScriptCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ScriptStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="What does this script do?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Lua code</label>
          <textarea
            className="input mono min-h-[200px] resize-y text-red-300/90"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
