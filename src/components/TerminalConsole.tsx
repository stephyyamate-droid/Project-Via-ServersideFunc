import { useEffect, useRef, useState } from 'react';
import { Terminal, CheckCircle2, XCircle } from 'lucide-react';
import type { Execution } from '../types';
import { formatTime } from '../lib/format';

interface Props {
  running: boolean;
  result: Execution | null;
}

export function TerminalConsole({ running, result }: Props) {
  const lines = result?.output.split('\n') ?? [];
  const [printed, setPrinted] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) {
      setPrinted([]);
      return;
    }
    setPrinted([]);
    let i = 0;
    const all = result.output.split('\n');
    const timer = setInterval(() => {
      if (i >= all.length) {
        clearInterval(timer);
        return;
      }
      setPrinted((p) => [...p, all[i]]);
      i++;
    }, 120);
    return () => clearInterval(timer);
  }, [result]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [printed]);

  return (
    <div className="overflow-hidden rounded-lg border border-black-600 bg-black-950">
      <div className="flex items-center justify-between border-b border-black-700 bg-black-900 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-red-500" />
          <span className="mono text-xs font-semibold text-black-200">console</span>
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success-500/60" />
          </span>
        </div>
        {result && !running && (
          <div className="flex items-center gap-2 text-xs font-bold">
            {result.status === 'success' ? (
              <span className="flex items-center gap-1 text-success-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> SUCCESS · {result.duration_ms}ms
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="h-3.5 w-3.5" /> FAILED · {result.duration_ms}ms
              </span>
            )}
            <span className="text-black-400">· {formatTime(result.created_at)}</span>
          </div>
        )}
      </div>
      <div ref={scrollRef} className="mono max-h-72 overflow-auto p-3 text-xs leading-relaxed">
        {lines.length === 0 && !running && (
          <p className="text-black-400">awaiting execution…</p>
        )}
        {printed.map((l, i) => (
          <ConsoleLine key={i} line={l} />
        ))}
        {(running || (result && printed.length < lines.length)) && (
          <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-blink bg-red-500" />
        )}
      </div>
    </div>
  );
}

function ConsoleLine({ line }: { line: string }) {
  let cls = 'text-black-200';
  if (line.includes('ERROR') || line.includes('failed')) cls = 'text-red-400';
  else if (line.includes('WARNING')) cls = 'text-warn-400';
  else if (line.includes('status=success') || line.includes('OK')) cls = 'text-success-400';
  else if (line.includes('PUNCH.CLUB')) cls = 'text-red-500 font-bold';
  else if (line.startsWith('[')) cls = 'text-black-300';

  return <div className={cls}>{line || '\u00a0'}</div>;
}
