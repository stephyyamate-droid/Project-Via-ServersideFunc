import { useMemo, useState } from 'react';
import {
  Code2,
  Plus,
  Search,
  Play,
  Loader2,
  Trash2,
  Pencil,
  FileCode2,
  Clock,
  Zap,
} from 'lucide-react';
import { CategoryBadge, CopyButton, EmptyState, Spinner, StatusBadge, Toast } from './ui';
import { deleteScript, connectedServers } from '../lib/api';
import { timeAgo } from '../lib/format';
import type { Execution, Script, ScriptCategory, ScriptStatus, Server } from '../types';

interface Props {
  scripts: Script[];
  executions: Execution[];
  servers: Server[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (s: Script) => void;
  onExecute: (s: Script) => void;
  onChanged: () => void;
}

const CATS: ('All' | ScriptCategory)[] = ['All', 'Utility', 'Admin', 'Fun', 'Anti-Exploit', 'Economy'];
const STATUS_FILTERS: ('All' | ScriptStatus)[] = ['All', 'working', 'patched', 'checking'];

export function ScriptHub({ scripts, executions, servers, loading, onAdd, onEdit, onExecute, onChanged }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<'All' | ScriptCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | ScriptStatus>('All');
  const [busyId, setBusyId] = useState('');
  const [confirm, setConfirm] = useState<Script | null>(null);
  const [toast, setToast] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  const runCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of executions) m.set(e.script_title, (m.get(e.script_title) ?? 0) + 1);
    return m;
  }, [executions]);

  const games = useMemo(() => {
    const s = new Set<string>();
    scripts.forEach((sc) => s.add(sc.game_name));
    return Array.from(s).sort();
  }, [scripts]);

  const filtered = useMemo(() => {
    return scripts.filter((s) => {
      if (cat !== 'All' && s.category !== cat) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.game_name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [scripts, query, cat, statusFilter]);

  const connCount = connectedServers(servers).length;

  async function remove(s: Script) {
    setBusyId(s.id);
    setConfirm(null);
    try {
      await deleteScript(s.id);
      onChanged();
      setToast({ kind: 'success', msg: `Deleted "${s.title}"` });
    } catch (e) {
      setToast({ kind: 'error', msg: e instanceof Error ? e.message : 'Failed to delete' });
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-black-300">
        <Spinner className="h-7 w-7 text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading text-3xl text-white">Script Hub</h1>
          <p className="mt-1 text-sm text-black-300">
            {scripts.length} scripts · {games.length} games · {connCount} {connCount === 1 ? 'server' : 'servers'} connected
          </p>
        </div>
        <button className="btn-red" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add Script
        </button>
      </div>

      {connCount === 0 && (
        <div className="rounded-lg border border-warn-500/30 bg-warn-500/10 px-4 py-3 text-sm text-warn-400 animate-fade-up">
          <Zap className="mr-1.5 inline h-4 w-4" />
          No servers connected. Go to the Setup tab to get the bridge script for your Roblox game — without it, scripts won't execute.
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black-400" />
          <input className="input pl-9" placeholder="Search scripts, games, descriptions…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-black-600 bg-black-900 p-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                statusFilter === f ? 'bg-red-600 text-white' : 'text-black-300 hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-black-600 bg-black-900 p-1">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                cat === c ? 'bg-white text-black-950' : 'text-black-300 hover:text-white'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Code2 className="h-6 w-6" />}
          title={scripts.length === 0 ? 'No scripts yet' : 'No scripts match your filters'}
          hint={scripts.length === 0 ? 'Add your first script to launch the hub.' : 'Try a different search or filter.'}
          action={scripts.length === 0 && <button className="btn-red" onClick={onAdd}><Plus className="h-4 w-4" /> Add Script</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const runs = runCounts.get(s.title) ?? 0;
            return (
              <div key={s.id} className="card-hover group flex flex-col p-4 animate-fade-up">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-white">{s.title}</h3>
                    <p className="mono mt-0.5 truncate text-[11px] text-red-500/70">{s.game_name}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <p className="mt-2.5 line-clamp-2 text-sm text-black-300">{s.description || 'No description'}</p>

                <div className="mono mt-3 max-h-20 overflow-hidden rounded-lg border border-black-700 bg-black-950 p-2.5 text-[11px] leading-relaxed text-red-300/70">
                  <pre className="truncate">{s.code.split('\n').slice(0, 3).join('\n')}</pre>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-black-400">
                  <CategoryBadge category={s.category} />
                  <span className="flex items-center gap-1"><FileCode2 className="h-3 w-3" /> {s.code.split('\n').length} lines</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {runs} {runs === 1 ? 'run' : 'runs'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(s.created_at)}</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button className="btn-red flex-1 !py-2" onClick={() => onExecute(s)}>
                    <Play className="h-3.5 w-3.5" /> Execute
                  </button>
                  <CopyButton text={s.code} />
                  <button className="btn-ghost !px-3 !py-2" onClick={() => onEdit(s)} aria-label={`Edit ${s.title}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="btn-ghost !px-3 !py-2 hover:!border-red-600/40 hover:!text-red-400"
                    disabled={busyId === s.id} onClick={() => setConfirm(s)} aria-label={`Delete ${s.title}`}>
                    {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black-950/85 backdrop-blur-sm" onClick={() => setConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm animate-fade-up rounded-xl border border-red-600/30 bg-black-900 p-5">
            <h3 className="heading text-lg text-white">Delete script?</h3>
            <p className="mt-2 text-sm text-black-300">"{confirm.title}" will be permanently removed from the hub.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn-red" onClick={() => remove(confirm)}><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast kind={toast.kind}>{toast.msg}</Toast>}
    </div>
  );
}
