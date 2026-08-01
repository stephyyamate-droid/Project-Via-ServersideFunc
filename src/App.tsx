import { useCallback, useEffect, useState } from 'react';
import {
  Code2,
  History as HistoryIcon,
  Menu,
  X,
  Zap,
  Plus,
  Github,
  Shield,
  Activity,
  Radio,
  Server as ServerIcon,
  UserCheck,
} from 'lucide-react';
import { ScriptHub } from './components/ScriptHub';
import { ExecutorView } from './components/ExecutorView';
import { AccountsView } from './components/AccountsView';
import { ServersView } from './components/ServersView';
import { SetupView } from './components/SetupView';
import { HistoryView } from './components/HistoryView';
import { ExecuteModal } from './components/ExecuteModal';
import { ScriptModal } from './components/ScriptModal';
import { Toast } from './components/ui';
import { fetchScripts, fetchExecutions, fetchServers, fetchAccounts, connectedServers } from './lib/api';
import type { Account, Execution, Script, Server } from './types';

type View = 'executor' | 'scripts' | 'accounts' | 'servers' | 'setup' | 'history';

const NAV: { id: View; label: string; icon: typeof Code2 }[] = [
  { id: 'executor', label: 'Executor', icon: Zap },
  { id: 'scripts', label: 'Scripts', icon: Code2 },
  { id: 'accounts', label: 'Accounts', icon: UserCheck },
  { id: 'servers', label: 'Servers', icon: ServerIcon },
  { id: 'setup', label: 'Setup', icon: Radio },
  { id: 'history', label: 'History', icon: HistoryIcon },
];

export default function App() {
  const [view, setView] = useState<View>('executor');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  const [execScript, setExecScript] = useState<Script | null>(null);
  const [execOpen, setExecOpen] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [toast, setToast] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [sc, ex, sv, acc] = await Promise.all([
      fetchScripts(),
      fetchExecutions(),
      fetchServers(),
      fetchAccounts(),
    ]);
    setScripts(sc);
    setExecutions(ex);
    setServers(sv);
    setAccounts(acc);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadAll();
      } catch (e) {
        setToast({ kind: 'error', msg: e instanceof Error ? e.message : 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  // Auto-refresh server list every 5s so connection status stays live
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const sv = await fetchServers();
        setServers(sv);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  function flash(kind: 'error' | 'success', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function openExecute(s: Script) {
    setExecScript(s);
    setExecOpen(true);
  }

  function openNewScript() {
    setEditingScript(null);
    setScriptModalOpen(true);
  }

  function openEditScript(s: Script) {
    setEditingScript(s);
    setScriptModalOpen(true);
  }

  function goto(v: View) {
    setView(v);
    setMobileNav(false);
  }

  const connCount = connectedServers(servers).length;

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-black-700 bg-black-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button className="rounded-lg p-2 text-black-200 hover:bg-black-800 hover:text-white lg:hidden" onClick={() => setMobileNav(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <a href="#" className="flex items-center gap-2.5" onClick={(e) => { e.preventDefault(); goto('executor'); }}>
            <Logo />
            <div className="hidden sm:block">
              <span className="heading text-xl text-white">PUNCH<span className="text-red-600">.</span>CLUB</span>
            </div>
          </a>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => goto(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wide transition ${
                    active ? 'text-white' : 'text-black-300 hover:text-white'
                  }`}>
                  <Icon className={`h-4 w-4 ${active ? 'text-red-500' : ''}`} />
                  {item.label}
                  {item.id === 'servers' && connCount > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-success-400" />
                  )}
                  {active && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-red-600" />}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 md:flex ${
              connCount > 0 ? 'border-success-500/30 bg-success-500/10' : 'border-black-600 bg-black-900'
            }`}>
              <span className="relative flex h-2 w-2">
                {connCount > 0 && <span className="absolute inline-flex h-full w-full animate-pulse-red rounded-full bg-success-500" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${connCount > 0 ? 'bg-success-400' : 'bg-black-400'}`} />
              </span>
              <span className="text-xs font-semibold text-black-200">
                {connCount > 0 ? `${connCount} Server${connCount === 1 ? '' : 's'} Live` : 'No Servers'}
              </span>
            </div>
            {view === 'scripts' && (
              <button className="btn-red !py-2" onClick={openNewScript}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Script</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black-950/85 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <div className="absolute left-0 top-0 h-full w-64 animate-fade-up border-r border-black-700 bg-black-900 p-4">
            <div className="flex items-center justify-between">
              <Logo />
              <button className="rounded-lg p-1.5 text-black-300 hover:bg-black-800" onClick={() => setMobileNav(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button key={item.id} onClick={() => goto(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition ${
                      active ? 'bg-red-600/10 text-white border border-red-600/30' : 'text-black-300 hover:bg-black-800 hover:text-white'
                    }`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero — only on executor view */}
        {view === 'executor' && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-2xl border border-black-700 bg-black-900 p-8 sm:p-12">
              <div className="grid-lines absolute inset-0 opacity-50" />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />
              <div className="relative max-w-2xl">
                <div className="chip mb-5 border border-red-600/30 bg-red-600/10 text-red-400">
                  <Shield className="h-3.5 w-3.5" /> Real Server-Side Execution · v4
                </div>
                <h1 className="heading text-4xl leading-[0.95] text-white sm:text-6xl">
                  The hardest hitting<br /><span className="text-red-600 text-glow-red">server-side</span> on Roblox
                </h1>
                <p className="mt-4 max-w-lg text-sm text-black-200 sm:text-base">
                  Write Lua in your browser and run it on any connected Roblox server.
                  Link your account to get the in-game executor GUI. Real execution, real output.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="btn-red" onClick={() => goto('setup')}>
                    <Radio className="h-4 w-4" /> Setup Bridge
                  </button>
                  <button className="btn-line" onClick={() => goto('accounts')}>
                    <UserCheck className="h-4 w-4" /> Add Account
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'executor' && (
          <ExecutorView
            servers={servers}
            loading={loading}
            onExecuted={loadAll}
            onGoSetup={() => goto('setup')}
          />
        )}
        {view === 'scripts' && (
          <ScriptHub
            scripts={scripts}
            executions={executions}
            servers={servers}
            loading={loading}
            onAdd={openNewScript}
            onEdit={openEditScript}
            onExecute={openExecute}
            onChanged={loadAll}
          />
        )}
        {view === 'accounts' && (
          <AccountsView accounts={accounts} loading={loading} onChanged={loadAll} />
        )}
        {view === 'servers' && (
          <ServersView servers={servers} loading={loading} onChanged={loadAll} onGoSetup={() => goto('setup')} />
        )}
        {view === 'setup' && <SetupView onGoHub={() => goto('executor')} />}
        {view === 'history' && <HistoryView executions={executions} loading={loading} onChanged={loadAll} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-black-700 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-black-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo small />
            <span className="font-bold text-black-200">PUNCH<span className="text-red-600">.</span>CLUB</span>
            <span className="hidden sm:inline">· Real server-side execution · Not affiliated with Roblox Corporation</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> v4.0.0</span>
            <span className="flex items-center gap-1.5">
              <Activity className={`h-3.5 w-3.5 ${connCount > 0 ? 'text-success-400' : ''}`} />
              {connCount > 0 ? 'Bridge operational' : 'Awaiting connection'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExecuteModal
        open={execOpen}
        onClose={() => setExecOpen(false)}
        script={execScript}
        servers={servers}
        onExecuted={loadAll}
      />
      <ScriptModal
        open={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
        editing={editingScript}
        onSaved={() => {
          loadAll();
          flash('success', editingScript ? 'Script updated' : 'Script added');
        }}
      />

      {toast && <Toast kind={toast.kind}>{toast.msg}</Toast>}
    </div>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  const size = small ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <div className={`flex ${size} items-center justify-center rounded-lg border border-red-600/40 bg-black-950`}>
      <svg viewBox="0 0 32 32" className="h-4/5 w-4/5" fill="none">
        <path d="M11 9l-3 5 3 5M21 9l3 5-3 5M17.5 7l-3 14" stroke="#ff2d2d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
