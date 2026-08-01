import { useState } from 'react';
import {
  Play,
  Loader2,
  Terminal,
  Server as ServerIcon,
  Wifi,
  WifiOff,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { LiveConsole } from './LiveConsole';
import { queueRawCode, pollExecution, connectedServers } from '../lib/api';
import { EmptyState } from './ui';
import type { Execution, Server } from '../types';

interface Props {
  servers: Server[];
  loading: boolean;
  onExecuted: () => void;
  onGoSetup: () => void;
}

const SNIPPETS: { label: string; code: string }[] = [
  { label: 'Hello', code: "print('Hello from PUNCH.CLUB')\nprint('Players: ' .. #game:GetService('Players'):GetPlayers())" },
  { label: 'Server Info', code: "print('PlaceId: ' .. game.PlaceId)\nprint('JobId: ' .. game.JobId)\nlocal Players = game:GetService('Players')\nfor _, p in ipairs(Players:GetPlayers()) do\n  print('  ' .. p.Name .. ' - ' .. math.floor(p:GetNetworkPing() * 1000) .. 'ms')\nend" },
  { label: 'WalkSpeed 50', code: 'local Players = game:GetService("Players")\nfor _, plr in ipairs(Players:GetPlayers()) do\n  local char = plr.Character\n  if char then\n    local hum = char:FindFirstChildOfClass("Humanoid")\n    if hum then hum.WalkSpeed = 50 end\n  end\nend\nprint("Set all players to WalkSpeed 50")' },
  { label: 'Announce', code: 'local Players = game:GetService("Players")\nfor _, plr in ipairs(Players:GetPlayers()) do\n  pcall(function()\n    game:GetService("StarterGui"):SetCore("SendNotification", {\n      Title = "PUNCH.CLUB",\n      Text = "Server announcement",\n      Duration = 5\n    })\n  end)\nend\nprint("Sent notification to " .. #Players:GetPlayers() .. " players")' },
  { label: 'Neon Rain', code: 'local Workspace = game:GetService("Workspace")\nfor i = 1, 20 do\n  local part = Instance.new("Part")\n  part.Size = Vector3.new(2, 2, 2)\n  part.Position = Vector3.new(math.random(-50, 50), 100 + math.random(0, 50), math.random(-50, 50))\n  part.Color = Color3.fromHSV(math.random(), 1, 1)\n  part.Material = Enum.Material.Neon\n  part.Parent = Workspace\nend\nprint("Spawned 20 neon parts")' },
];

export function ExecutorView({ servers, loading, onExecuted, onGoSetup }: Props) {
  const [code, setCode] = useState(SNIPPETS[0].code);
  const [serverId, setServerId] = useState('');
  const [execution, setExecution] = useState<Execution | null>(null);
  const [polling, setPolling] = useState(false);
  const [timeout, setTimeoutFlag] = useState(false);
  const [error, setError] = useState('');

  const connected = connectedServers(servers);

  async function execute() {
    const server = servers.find((s) => s.id === serverId);
    if (!server) {
      setError('Select a connected server first.');
      return;
    }
    if (!code.trim()) {
      setError('Enter some Lua code to execute.');
      return;
    }
    setError('');
    setPolling(true);
    setTimeoutFlag(false);
    setExecution(null);
    try {
      const queued = await queueRawCode(code, server);
      setExecution(queued);
      onExecuted();
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

  function loadSnippet(s: { label: string; code: string }) {
    setCode(s.code);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-black-300">
        <Loader2 className="h-7 w-7 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading text-3xl text-white">Executor</h1>
        <p className="mt-1 text-sm text-black-300">
          Write and run Lua directly on a connected Roblox server. Real execution, real output.
        </p>
      </div>

      {connected.length === 0 ? (
        <EmptyState
          icon={<ServerIcon className="h-6 w-6" />}
          title="No servers connected"
          hint="Put the bridge script in your Roblox game to start executing code. Check the Setup tab for instructions."
          action={<button className="btn-red" onClick={onGoSetup}><Zap className="h-4 w-4" /> Setup Bridge</button>}
        />
      ) : (
        <>
          {/* Server selector */}
          <div>
            <label className="label">Target Server</label>
            <select className="input" value={serverId} onChange={(e) => setServerId(e.target.value)} disabled={polling}>
              <option value="">Select a server…</option>
              {connected.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.player_count}/{s.max_players} players
                </option>
              ))}
            </select>
          </div>

          {/* Snippets */}
          <div>
            <label className="label">Quick Snippets</label>
            <div className="flex flex-wrap gap-2">
              {SNIPPETS.map((s) => (
                <button key={s.label} onClick={() => loadSnippet(s)}
                  className="btn-ghost !px-3 !py-1.5 !text-xs">
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code editor */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label !mb-0">Lua Editor</label>
              <button className="text-[11px] text-black-400 hover:text-red-400 transition" onClick={() => setCode('')}>
                <Trash2 className="mr-1 inline h-3 w-3" /> Clear
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-black-600 bg-black-950">
              <div className="flex items-center justify-between border-b border-black-700 bg-black-900 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-red-500" />
                  <span className="mono text-xs font-semibold text-black-200">executor.lua</span>
                </div>
                <div className="flex items-center gap-2">
                  {connected.find((s) => s.id === serverId) ? (
                    <span className="chip border border-success-500/30 bg-success-500/10 text-success-400">
                      <Wifi className="h-3 w-3" /> Ready
                    </span>
                  ) : (
                    <span className="chip border border-black-600 bg-black-800 text-black-400">
                      <WifiOff className="h-3 w-3" /> No server
                    </span>
                  )}
                </div>
              </div>
              <textarea
                className="mono min-h-[220px] w-full resize-y bg-black-950 p-4 text-sm leading-relaxed text-red-300/90 outline-none placeholder:text-black-500"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={polling}
                placeholder="-- Enter Lua code to run on the server…"
              />
            </div>
          </div>

          {/* Execute button */}
          <div className="flex items-center gap-3">
            <button className="btn-red" disabled={polling || !serverId} onClick={execute}>
              {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {polling ? 'Executing…' : 'Execute'}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {/* Live console */}
          <div>
            <label className="label">Live Console</label>
            <LiveConsole execution={execution} polling={polling} timeout={timeout} />
          </div>
        </>
      )}
    </div>
  );
}
