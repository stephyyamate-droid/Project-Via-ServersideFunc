import { supabase } from './supabase';
import type {
  Account,
  Execution,
  RobloxSearchResult,
  Script,
  ScriptCategory,
  ScriptStatus,
  Server,
} from '../types';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge`;
const EDGE_HEADERS: Record<string, string> = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

/* ---------------- Scripts ---------------- */

export async function fetchScripts(): Promise<Script[]> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createScript(input: {
  title: string;
  game_name: string;
  status: ScriptStatus;
  category: ScriptCategory;
  description: string;
  code: string;
}): Promise<Script> {
  const { data, error } = await supabase
    .from('scripts')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateScript(
  id: string,
  input: Partial<Pick<Script, 'title' | 'game_name' | 'status' | 'category' | 'description' | 'code'>>,
): Promise<void> {
  const { error } = await supabase
    .from('scripts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteScript(id: string): Promise<void> {
  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------- Servers ---------------- */

export async function fetchServers(): Promise<Server[]> {
  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteServer(id: string): Promise<void> {
  const { error } = await supabase.from('servers').delete().eq('id', id);
  if (error) throw error;
}

export function isConnected(server: Server): boolean {
  const age = Date.now() - new Date(server.last_seen).getTime();
  return age < 30_000;
}

export function connectedServers(servers: Server[]): Server[] {
  return servers.filter(isConnected);
}

/* ---------------- Executions ---------------- */

export async function fetchExecutions(): Promise<Execution[]> {
  const { data, error } = await supabase
    .from('executions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data ?? [];
}

export async function clearExecutions(): Promise<void> {
  const { error } = await supabase
    .from('executions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function queueRawCode(code: string, server: Server): Promise<Execution> {
  const row = {
    script_title: 'Executor',
    game_name: server.name,
    server_id: server.id,
    server_name: server.name,
    status: 'pending',
    code,
    output: '',
  };
  const { data, error } = await supabase
    .from('executions')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function pollExecution(
  id: string,
  timeoutMs = 20_000,
  intervalMs = 1000,
): Promise<Execution> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('executions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data && (data.status === 'success' || data.status === 'failed')) {
      return data as Execution;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  const { data } = await supabase
    .from('executions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Execution) ?? null;
}

/* ---------------- Accounts ---------------- */

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Search Roblox for a user by username via the edge function.
 */
export async function searchRobloxUser(username: string): Promise<RobloxSearchResult> {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: EDGE_HEADERS,
    body: JSON.stringify({ action: 'search_roblox', username }),
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as RobloxSearchResult;
}

/**
 * Link a Roblox account to the panel's allowlist.
 */
export async function linkAccount(user: RobloxSearchResult): Promise<void> {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: EDGE_HEADERS,
    body: JSON.stringify({
      action: 'link_account',
      roblox_id: user.roblox_id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    }),
  });
  if (!res.ok) throw new Error(`Link failed (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
}
