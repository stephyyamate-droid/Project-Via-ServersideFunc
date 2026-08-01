import { useMemo, useState } from 'react';
import {
  Server as ServerIcon,
  Trash2,
  Globe,
  Users,
  Loader2,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { EmptyState, Spinner, Toast } from './ui';
import { deleteServer, isConnected } from '../lib/api';
import { timeAgo } from '../lib/format';
import type { Server } from '../types';

interface Props {
  servers: Server[];
  loading: boolean;
  onChanged: () => void;
  onGoSetup: () => void;
}

export function ServersView({ servers, loading, onChanged, onGoSetup }: Props) {
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  const live = useMemo(() => servers.filter(isConnected), [servers]);
  const dead = useMemo(() => servers.filter((s) => !isConnected(s)), [servers]);

  async function remove(s: Server) {
    setBusyId(s.id);
    try {
      await deleteServer(s.id);
      onChanged();
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
      <div>
        <h1 className="heading text-3xl text-white">Servers</h1>
        <p className="mt-1 text-sm text-black-300">
          {live.length} connected · {dead.length} offline · {servers.length} total
        </p>
      </div>

      {live.length === 0 && dead.length === 0 && (
        <EmptyState
          icon={<ServerIcon className="h-6 w-6" />}
          title="No servers registered"
          hint="Put the bridge script in your Roblox game to connect a server. It auto-registers on startup."
          action={<button className="btn-red" onClick={onGoSetup}><Radio className="h-4 w-4" /> Get Bridge Script</button>}
        />
      )}

      {/* Connected servers */}
      {live.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-success-400">
            <Wifi className="h-4 w-4" /> Connected
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {live.map((s) => (
              <div key={s.id} className="card p-5 border-success-500/20 animate-fade-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-white">{s.name}</h3>
                    <p className="mono mt-0.5 text-[11px] text-black-400">PlaceId {s.place_id}</p>
                  </div>
                  <span className="chip border border-success-500/30 bg-success-500/10 text-success-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-pulse-red rounded-full bg-success-500" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success-400" />
                    </span>
                    LIVE
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-black-200"><Globe className="h-4 w-4 text-black-400" /> {s.region}</div>
                  <div className="flex items-center gap-2 text-black-200"><Users className="h-4 w-4 text-black-400" /> {s.player_count}/{s.max_players}</div>
                </div>

                <div className="mt-3 text-[11px] text-black-400">
                  Last poll: <span className="text-success-400">{timeAgo(s.last_seen)}</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="mono flex-1 truncate rounded-lg border border-black-600 bg-black-950 px-3 py-2 text-[11px] text-black-400">
                    {s.job_id.slice(0, 24)}…
                  </span>
                  <button className="btn-ghost !px-3 !py-2 hover:!border-red-600/40 hover:!text-red-400"
                    disabled={busyId === s.id} onClick={() => remove(s)} aria-label={`Delete ${s.name}`}>
                    {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline servers */}
      {dead.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black-400">
            <WifiOff className="h-4 w-4" /> Disconnected
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dead.map((s) => (
              <div key={s.id} className="card p-5 opacity-60 animate-fade-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-black-200">{s.name}</h3>
                    <p className="mono mt-0.5 text-[11px] text-black-400">PlaceId {s.place_id}</p>
                  </div>
                  <span className="chip border border-black-600 bg-black-800 text-black-400">OFFLINE</span>
                </div>
                <div className="mt-3 text-[11px] text-black-400">Last seen: {timeAgo(s.last_seen)}</div>
                <div className="mt-4">
                  <button className="btn-ghost !w-full hover:!border-red-600/40 hover:!text-red-400"
                    disabled={busyId === s.id} onClick={() => remove(s)}>
                    {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <Toast kind={toast.kind}>{toast.msg}</Toast>}
    </div>
  );
}
