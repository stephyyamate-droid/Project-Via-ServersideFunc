import { useEffect, useState } from 'react';
import { Radio, Copy, Check, Terminal, Box, Link2, Shield, Users } from 'lucide-react';
import { Toast } from './ui';

interface Props {
  onGoHub: () => void;
}

export function SetupView({ onGoHub }: Props) {
  const [luaCode, setLuaCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  useEffect(() => {
    fetch('/punchclub-bridge.lua')
      .then((r) => r.text())
      .then(setLuaCode)
      .catch(() => setLuaCode('-- Failed to load bridge script'));
  }, []);

  function copyLua() {
    navigator.clipboard?.writeText(luaCode);
    setCopied(true);
    setToast({ kind: 'success', msg: 'Bridge script copied to clipboard' });
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading text-3xl text-white">Bridge Setup</h1>
        <p className="mt-1 text-sm text-black-300">
          Connect your Roblox game and get the in-game executor GUI for allowlisted players.
        </p>
      </div>

      {/* Steps */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StepCard num={1} icon={<Box className="h-5 w-5" />} title="Open Roblox Studio">
          Open your game in Roblox Studio. Right-click <span className="mono text-red-400">ServerScriptService</span> and select
          <span className="text-white"> Insert &gt; Script</span>.
        </StepCard>
        <StepCard num={2} icon={<Terminal className="h-5 w-5" />} title="Paste the bridge script">
          Copy the bridge script below, paste it into the new script, and replace any default code.
        </StepCard>
        <StepCard num={3} icon={<Radio className="h-5 w-5" />} title="Enable HTTP & publish">
          Go to <span className="text-white">Game Settings &gt; Security</span> and turn on
          <span className="text-white"> Allow HTTP Requests</span>. Then publish and join your game.
        </StepCard>
      </div>

      {/* What happens next */}
      <div className="card p-5">
        <h2 className="mb-4 heading text-lg text-white">What happens when you join</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FlowItem
            icon={<Users className="h-4 w-4" />}
            title="Add your account"
            desc="Go to the Accounts tab and search your Roblox username to link it to the allowlist."
          />
          <FlowItem
            icon={<Shield className="h-4 w-4" />}
            title="Join the game"
            desc="When your allowlisted account joins a bridged server, a GUI with a Lua executor appears on your screen."
          />
          <FlowItem
            icon={<Terminal className="h-4 w-4" />}
            title="Execute in-game"
            desc="Type Lua code into the in-game editor and hit EXECUTE. Code runs on the server with full server-side access."
          />
          <FlowItem
            icon={<Radio className="h-4 w-4" />}
            title="Or execute from the web"
            desc="Use the Executor tab on this panel to run code on any connected server. Output appears in the live console."
          />
        </div>
      </div>

      {/* Security note */}
      <div className="rounded-lg border border-warn-500/30 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
        <Shield className="mr-1.5 inline h-4 w-4" />
        The bridge runs Lua code with server-level access. Only use it in games you own. Only allowlist accounts you trust.
      </div>

      {/* Lua code */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-black-700 bg-black-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-red-500" />
            <span className="mono text-xs font-semibold text-black-200">punchclub-bridge.lua</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/punchclub-bridge.lua" download="punchclub-bridge.lua" className="btn-ghost !px-3 !py-1.5 !text-xs">
              <Link2 className="h-3.5 w-3.5" /> Download
            </a>
            <button className="btn-red !px-3 !py-1.5 !text-xs" onClick={copyLua} disabled={!luaCode}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
        </div>
        <pre className="mono max-h-[500px] overflow-auto bg-black-950 p-4 text-xs leading-relaxed text-red-300/80">
{luaCode || 'Loading…'}
        </pre>
      </div>

      <div className="flex justify-center">
        <button className="btn-red" onClick={onGoHub}>
          <Radio className="h-4 w-4" /> Go to Executor
        </button>
      </div>

      {toast && <Toast kind={toast.kind}>{toast.msg}</Toast>}
    </div>
  );
}

function StepCard({ num, icon, title, children }: { num: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-600/30 bg-red-600/10 text-red-500">
          {icon}
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-black-400">Step {num}</span>
          <h3 className="font-bold text-white">{title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm text-black-300">{children}</p>
    </div>
  );
}

function FlowItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-black-700 bg-black-950 p-3">
      <div className="flex items-center gap-2">
        <span className="text-red-500">{icon}</span>
        <p className="font-bold text-white">{title}</p>
      </div>
      <p className="mt-1 text-sm text-black-300">{desc}</p>
    </div>
  );
}
