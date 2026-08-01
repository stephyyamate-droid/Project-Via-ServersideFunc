import { useMemo, useState } from 'react';
import {
  History as HistoryIcon,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  Loader2,
  ChevronDown,
  Zap,
  Clock,
} from 'lucide-react';
import { EmptyState, Spinner, Toast } from './ui';
import { clearExecutions } from '../lib/api';
import { formatTime, timeAgo } from '../lib/format';
import type { Execution } from '../types';

interface Props {
  executions: Execution[];
  loading: boolean;
  onChanged: () => void;
}

export function HistoryView({ executions, loading, onChanged }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      if (filter !== 'all' && e.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return e.script_title.toLowerCase().includes(q) || e.game_name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [executions, query, filter]);

  const summary = useMemo(() => {
    const ok = executions.filter((e) => e.status === 'success').length;
    const failed = executions.filter((e) => e.status === 'failed').length;
    return { ok, fail: failed, total: executions.length };
  }, [executions]);

  async function doClear() {
    setConfirm(false);
    setClearing(true);
    try {
      await clearExecutions();
      onChanged();
      setToast({ kind: 'success', msg: 'History cleared' });
    } catch (e) {
      setToast({ kind: 'error', msg: e instanceof Error ? e.message : 'Failed to clear' });
    } finally {
      setClearing(false);
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
          <h1 className="heading text-3xl text-white">Run History</h1>
          <p className="mt-1 text-sm text-black-300">
            {summary.total} runs · <span className="text-success-400">{summary.ok} success</span> · <span className="text-red-400">{summary.fail} failed</span>
          </p>
        </div>
        {executions.length > 0 && (
          <button className="btn-line" disabled={clearing} onClick={() => setConfirm(true)}>
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black-400" />
          <input className="input pl-9" placeholder="Search by script or game…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-lg border border-black-600 bg-black-900 p-1">
          {(['all', 'success', 'failed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                filter === f ? 'bg-red-600 text-white' : 'text-black-300 hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-6 w-6" />}
          title={executions.length === 0 ? 'No runs yet' : 'No runs match your filters'}
          hint={executions.length === 0 ? 'Execute a script from the hub to start logging real runs.' : 'Try a different search or filter.'}
        />
      ) : (
        <div className="card divide-y divide-black-700/60 overflow-hidden">
          {filtered.map((ex) => {
            const isOpen = open === ex.id;
            return (
              <div key={ex.id}>
                <button
                  onClick={() => setOpen(isOpen ? null : ex.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-black-850/50"
                >
                  {ex.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success-400" />
                  ) : ex.status === 'failed' ? (
                    <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  ) : ex.status === 'executing' ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-warn-400" />
                  ) : (
                    <Clock className="h-5 w-5 shrink-0 text-black-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{ex.script_title}</p>
                    <p className="mono truncate text-[11px] text-red-500/60">{ex.server_name} · {timeAgo(ex.created_at)}</p>
                  </div>
                  <span className={`chip shrink-0 ${
                    ex.status === 'success'
                      ? 'text-success-400 border border-success-500/30 bg-success-500/10'
                      : ex.status === 'failed'
                      ? 'text-red-400 border border-red-500/30 bg-red-500/10'
                      : ex.status === 'executing'
                      ? 'text-warn-400 border border-warn-500/30 bg-warn-500/10'
                      : 'text-black-300 border border-black-600 bg-black-800'
                  }`}>
                    {ex.status}
                  </span>
                  <span className="mono shrink-0 text-[11px] text-black-400">{ex.duration_ms}ms</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-black-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="animate-fade-in border-t border-black-700 bg-black-950 px-4 py-3">
                    <p className="mb-2 text-[11px] text-black-400">{formatTime(ex.created_at)}</p>
                    {ex.code && (
                      <>
                        <p className="label">Code</p>
                        <pre className="mono mb-3 max-h-40 overflow-auto rounded-lg border border-black-600 bg-black-950 p-3 text-xs text-red-300/70">
{ex.code}
                        </pre>
                      </>
                    )}
                    <p className="label">Output</p>
                    <pre className="mono max-h-64 overflow-auto rounded-lg border border-black-600 bg-black-950 p-3 text-xs leading-relaxed text-black-200">
{ex.output || '(no output captured)'}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black-950/85 backdrop-blur-sm" onClick={() => setConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm animate-fade-up rounded-xl border border-red-600/30 bg-black-900 p-5">
            <h3 className="heading text-lg text-white">Clear all history?</h3>
            <p className="mt-2 text-sm text-black-300">Every run record will be permanently deleted.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn-red" onClick={doClear}><Zap className="h-4 w-4" /> Clear All</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast kind={toast.kind}>{toast.msg}</Toast>}
    </div>
  );
}
