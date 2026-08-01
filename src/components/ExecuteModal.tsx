import { useEffect, useState } from 'react';
import { Play, Loader2, Zap, Code2, Server as ServerIcon } from 'lucide-react';
import { Modal } from './Modal';
import { LiveConsole } from './LiveConsole';
import { queueRawCode, pollExecution } from '../lib/api';
import { StatusBadge, CategoryBadge } from './ui';
import type { Execution, Script, Server } from '../types';
import { isConnected } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  script: Script | null;
  servers: Server[];
  onExecuted: () => void;
}

export function ExecuteModal({ open, onClose, script, servers, onExecuted }: Props) {
  const connected = servers.filter(isConnected);
  const [serverId, setServerId] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [mode, setMode] = useState<'script' | 'custom'>('script');
  const [execution, setExecution] = useState<Execution | null>(null);
  const [polling, setPolling] = useState(false);
  const [timeout, setTimeoutFlag] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setExecution(null);
      setError('');
      setPolling(false);
      setTimeoutFlag(false);
      setMode(script ? 'script' : 'custom');
      setServerId(connected[0]?.id ?? '');
      setCustomCode(script?.code ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function run() {
    const server = servers.find((s) => s.id === serverId);
    if (!server) {
      setError('No server selected.');
      return;
    }
    if (!isConnected(server)) {
      setError('That server is not connected. Make sure the bridge script is running.');
      return;
    }

    const code = mode === 'script' && script ? script.code : customCode;
    if (!code.trim()) {
      setError('No code to execute.');
      return;
    }

    setError('');
    setPolling(true);
    setTimeoutFlag(false);
    setExecution(null);

    try {
      const code = mode === 'script' && script ? script.code : customCode;
      const queued = await queueRawCode(code, server);

      setExecution(queued);
      onExecuted();

      // Poll until the server runs it and posts the result back
      const result = await pollExecution(queued.id, 20_000, 1000);
      setExecution(result);
      if (result.status !== 'success' && result.status !== 'failed') {
        setTimeoutFlag(true);
      }
      onExecuted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed');
    } finally {
      setPolling(false);
    }
  }

  const codeToShow = mode === 'script' && script ? script.code : customCode;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Execute"
      subtitle={mode === 'script' && script ? script.title : 'Custom Lua'}
      icon={<Zap className="h-5 w-5" />}
      size="xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-red" disabled={polling || connected.length === 0} onClick={run}>
            {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {polling ? 'Waiting for server…' : 'Execute'}
          </button>
        </>
      }
    >
      {/* Server selector */}
      <div className="mb-4">
        <label className="label">Target Server</label>
        {connected.length === 0 ? (
          <div className="rounded-lg border border-warn-500/30 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
            <ServerIcon className="mr-1.5 inline h-4 w-4" />
            No connected servers. Put the bridge script in your Roblox game first — see the Setup tab.
          </div>
        ) : (
          <select className="input" value={serverId} onChange={(e) => setServerId(e.target.value)} disabled={polling}>
            {connected.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.player_count}/{s.max_players} players
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Mode toggle */}
      {script && (
        <div className="mb-4 flex gap-1 rounded-lg border border-black-600 bg-black-900 p-1">
          <button
            onClick={() => setMode('script')}
            className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
              mode === 'script' ? 'bg-red-600 text-white' : 'text-black-300 hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> Script
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
              mode === 'custom' ? 'bg-red-600 text-white' : 'text-black-300 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Custom Code
          </button>
        </div>
      )}

      {/* Script badges */}
      {mode === 'script' && script && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={script.status} />
          <CategoryBadge category={script.category} />
          <span className="chip border border-black-600 bg-black-800 text-black-200">{script.game_name}</span>
        </div>
      )}

      {/* Code editor / preview */}
      <div className="mb-4">
        <label className="label">{mode === 'custom' ? 'Lua Code' : 'Payload'}</label>
        {mode === 'custom' ? (
          <textarea
            className="input mono min-h-[140px] resize-y text-red-300/90"
            spellCheck={false}
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            disabled={polling}
            placeholder="-- Enter Lua code to run on the server&#10;print('Hello from PUNCH.CLUB')&#10;print('Players: ' .. #game:GetService('Players'):GetPlayers())"
          />
        ) : (
          <pre className="mono max-h-40 overflow-auto rounded-lg border border-black-600 bg-black-950 p-3 text-xs text-red-300/90">
{codeToShow}
          </pre>
        )}
      </div>

      {/* Live console */}
      <label className="label">Live Console</label>
      <LiveConsole execution={execution} polling={polling} timeout={timeout} />

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </Modal>
  );
}
