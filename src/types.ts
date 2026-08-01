export type ScriptStatus = 'working' | 'patched' | 'checking';
export type ScriptCategory = 'Utility' | 'Admin' | 'Fun' | 'Anti-Exploit' | 'Economy';

export interface Script {
  id: string;
  title: string;
  game_name: string;
  status: ScriptStatus;
  category: ScriptCategory;
  description: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export type ExecutionStatus = 'pending' | 'executing' | 'success' | 'failed';

export interface Execution {
  id: string;
  script_title: string;
  game_name: string;
  server_id: string | null;
  server_name: string;
  status: ExecutionStatus;
  output: string;
  code: string;
  duration_ms: number;
  created_at: string;
  completed_at: string | null;
}

export interface Server {
  id: string;
  name: string;
  place_id: number;
  job_id: string;
  region: string;
  max_players: number;
  player_count: number;
  status: string;
  last_seen: string;
  auth_token: string;
  created_at: string;
}

export interface Account {
  id: string;
  roblox_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface RobloxSearchResult {
  roblox_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
}
