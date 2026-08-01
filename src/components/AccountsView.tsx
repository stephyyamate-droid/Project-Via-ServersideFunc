import { useState } from 'react';
import {
  UserPlus,
  Search,
  Loader2,
  Trash2,
  X,
  UserCheck,
  Shield,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from './Modal';
import { EmptyState, Spinner, Toast } from './ui';
import { fetchAccounts, deleteAccount, searchRobloxUser, linkAccount } from '../lib/api';
import { timeAgo } from '../lib/format';
import type { Account, RobloxSearchResult } from '../types';

interface Props {
  accounts: Account[];
  loading: boolean;
  onChanged: () => void;
}

export function AccountsView({ accounts, loading, onChanged }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<RobloxSearchResult | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setResult(null);
    try {
      const res = await searchRobloxUser(query.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function link() {
    if (!result) return;
    setLinking(true);
    setError('');
    try {
      await linkAccount(result);
      await onChanged();
      setToast({ kind: 'success', msg: `Linked ${result.username}` });
      setModalOpen(false);
      setResult(null);
      setQuery('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to link account');
    } finally {
      setLinking(false);
    }
  }

  async function remove(acc: Account) {
    setBusyId(acc.id);
    try {
      await deleteAccount(acc.id);
      await onChanged();
      setToast({ kind: 'success', msg: `Removed ${acc.username}` });
    } catch (e) {
      setToast({ kind: 'error', msg: e instanceof Error ? e.message : 'Failed to remove' });
    } finally {
      setBusyId('');
    }
  }

  function openModal() {
    setModalOpen(true);
    setQuery('');
    setResult(null);
    setError('');
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
          <h1 className="heading text-3xl text-white">Accounts</h1>
          <p className="mt-1 text-sm text-black-300">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} allowlisted ·
            These players get the in-game GUI when they join a bridged server
          </p>
        </div>
        <button className="btn-red" onClick={openModal}>
          <UserPlus className="h-4 w-4" /> Add Account
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-red-600/20 bg-red-600/5 px-4 py-3 text-sm text-black-200 animate-fade-up">
        <Shield className="mr-1.5 inline h-4 w-4 text-red-500" />
        When an allowlisted player joins a Roblox server running the bridge script, a GUI with a Lua
        executor appears on their screen. They can run code directly in-game.
      </div>

      {/* Accounts grid */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="No accounts linked"
          hint="Add your Roblox account to get the in-game executor GUI. Search by Roblox username."
          action={<button className="btn-red" onClick={openModal}><UserPlus className="h-4 w-4" /> Add Account</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="card-hover flex items-center gap-4 p-4 animate-fade-up">
              {/* Avatar */}
              {acc.avatar_url ? (
                <img
                  src={acc.avatar_url}
                  alt={acc.username}
                  className="h-14 w-14 rounded-full border-2 border-red-600/30 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-600/30 bg-black-800 text-black-300">
                  <UserCheck className="h-6 w-6" />
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-white">{acc.display_name ?? acc.username}</h3>
                <p className="mono truncate text-[11px] text-red-500/60">@{acc.username}</p>
                <p className="mono mt-0.5 text-[11px] text-black-400">ID: {acc.roblox_id}</p>
                <p className="mt-0.5 text-[11px] text-black-400">Added {timeAgo(acc.created_at)}</p>
              </div>

              {/* Remove */}
              <button
                className="btn-ghost shrink-0 !px-3 !py-2 hover:!border-red-600/40 hover:!text-red-400"
                disabled={busyId === acc.id}
                onClick={() => remove(acc)}
                aria-label={`Remove ${acc.username}`}
              >
                {busyId === acc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Account"
        subtitle="Search Roblox by username to link an account"
        icon={<UserPlus className="h-5 w-5" />}
        size="md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            {result && (
              <button className="btn-red" disabled={linking} onClick={link}>
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {linking ? 'Linking…' : 'Link Account'}
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {/* Search bar */}
          <div>
            <label className="label">Roblox Username</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black-400" />
                <input
                  className="input pl-9"
                  placeholder="e.g. Roblox"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                  disabled={searching}
                />
              </div>
              <button className="btn-red" disabled={searching || !query.trim()} onClick={search}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Search result */}
          {result && (
            <div className="animate-fade-up rounded-lg border border-success-500/30 bg-success-500/5 p-4">
              <div className="flex items-center gap-4">
                {result.avatar_url ? (
                  <img
                    src={result.avatar_url}
                    alt={result.username}
                    className="h-16 w-16 rounded-full border-2 border-success-500/40 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-success-500/40 bg-black-800 text-black-300">
                    <UserCheck className="h-7 w-7" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{result.display_name}</p>
                  <p className="mono text-sm text-red-400">@{result.username}</p>
                  <p className="mono mt-0.5 text-[11px] text-black-400">User ID: {result.roblox_id}</p>
                </div>
                <span className="chip border border-success-500/30 bg-success-500/10 text-success-400">
                  <UserCheck className="h-3 w-3" /> Found
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {toast && <Toast kind={toast.kind}>{toast.msg}</Toast>}
    </div>
  );
}
