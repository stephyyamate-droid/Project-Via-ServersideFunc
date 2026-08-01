import type { ReactNode } from 'react';
import { Check, AlertTriangle, Eye, Copy } from 'lucide-react';
import type { ScriptStatus } from '../types';

export function StatusBadge({ status }: { status: ScriptStatus }) {
  const map = {
    working: { label: 'Working', cls: 'bg-success-500/15 text-success-400 border border-success-500/30', icon: <Check className="h-3 w-3" /> },
    patched: { label: 'Patched', cls: 'bg-red-500/15 text-red-400 border border-red-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
    checking: { label: 'Checking', cls: 'bg-warn-500/15 text-warn-400 border border-warn-500/30', icon: <Eye className="h-3 w-3" /> },
  } as const;
  const s = map[status];
  return (
    <span className={`chip ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, string> = {
    Utility: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    Admin: 'text-red-400 border-red-500/30 bg-red-500/10',
    Fun: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    'Anti-Exploit': 'text-warn-400 border-warn-500/30 bg-warn-500/10',
    Economy: 'text-success-400 border-success-500/30 bg-success-500/10',
  };
  return (
    <span className={`chip ${map[category] ?? 'text-black-200 border-black-600 bg-black-800'}`}>
      {category}
    </span>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CopyButton({ text, label = 'Copy', onCopied }: { text: string; label?: string; onCopied?: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(text);
        onCopied?.();
      }}
      className="btn-ghost !px-3 !py-1.5 !text-xs"
    >
      <Copy className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black-600 bg-black-900/40 px-6 py-16 text-center animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-600/20 bg-red-600/5 text-red-500">{icon}</div>
      <div>
        <p className="font-bold text-white">{title}</p>
        {hint && <p className="mt-1 text-sm text-black-300">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toast({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const cls =
    kind === 'error'
      ? 'bg-red-600/15 text-red-300 border-red-600/40'
      : 'bg-success-500/15 text-success-400 border-success-500/40';
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold shadow-card animate-fade-up ${cls}`}>
      {children}
    </div>
  );
}
