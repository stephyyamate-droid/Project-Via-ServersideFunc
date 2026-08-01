import { useEffect, useRef, useState } from 'react';
import { Terminal, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import type { Execution } from '../types';
import { formatTime } from '../lib/format';

interface Props {
  execution: Execution | null;
  polling: boolean;
  timeout: boolean;
}

export function LiveConsole({ execution, polling, timeout }: Props) {
  const [printed, setPrinted] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const output = execution?.output ?? '';
  const allLines = output ? output.split('\n') : [];

  useEffect(() => {
    if (!output) {
      setPrinted([]);
      return;
    }
    // Re-print from scratch whenever output changes
    const lines = output.split('\n');
    setPrinted(lines.slice(0, printed.length + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [printed, polling]);

  const status = execution?.status;
  const isRunning = status === 'pending' || status === 'executing';

  return (
    <div className="overflow-hidden rounded-lg border border-black-600 bg-black-950">
      {/* Title bar */}
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
        {execution && (
          <div className="flex items-center gap-2 text-xs font-bold">
            {status === 'success' && (
              <span className="flex items-center gap-1 text-success-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> SUCCESS · {execution.duration_ms}ms
              </span>
            )}
            {status === 'failed' && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="h-3.5 w-3.5" /> FAILED · {execution.duration_ms}ms
              </span>
            )}
            {status === 'executing' && (
              <span className="flex items-center gap-1 text-warn-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> EXECUTING…
              </span>
            )}
            {status === 'pending' && (
              <span className="flex items-center gap-1 text-black-300">
                <Clock className="h-3.5 w-3.5" /> QUEUED — waiting for server
              </span>
            )}
            {execution.completed_at && (
              <span className="text-black-400">· {formatTime(execution.completed_at)}</span>
            )}
          </div>
        )}
      </div>

      {/* Console body */}
      <div ref={scrollRef} className="mono max-h-80 min-h-[120px] overflow-auto p-3 text-xs leading-relaxed">
        {!execution && (
          <p className="text-black-400">No execution yet. Select a server and run a script.</p>
        )}
        {execution && status === 'pending' && allLines.length === 0 && (
          <div className="space-y-1">
            <p className="text-warn-400">Command queued. Waiting for the Roblox server to poll…</p>
            <p className="text-black-400">The bridge script polls every 1 second.</p>
          </div>
        )}
        {allLines.map((l, i) => (
          <ConsoleLine key={i} line={l} />
        ))}
        {isRunning && (
          <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-blink bg-red-500" />
        )}
        {timeout && (
          <p className="mt-2 text-warn-400">
            Timed out waiting for result. The server may be disconnected. Check the Servers tab.
          </p>
        )}
        {execution && !isRunning && !timeout && allLines.length === 0 && (
          <p className="text-black-400">(no output captured)</p>
        )}
      </div>
    </div>
  );
}

function ConsoleLine({ line }: { line: string }) {
  let cls = 'text-black-200';
  if (line.includes('[ERROR]') || line.includes('failed')) cls = 'text-red-400';
  else if (line.includes('[WARN]')) cls = 'text-warn-400';
  else if (line.includes('status=success') || line.includes('SUCCESS')) cls = 'text-success-400';
  else if (line.includes('PUNCH.CLUB')) cls = 'text-red-500 font-bold';
  else if (line.startsWith('[')) cls = 'text-black-300';

  return <div className={cls}>{line || '\u00a0'}</div>;
}
