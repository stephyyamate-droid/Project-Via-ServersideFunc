/*
# Server-Side Bridge Schema

## Overview
Rework the panel into a REAL Roblox server-side executor. The database now
acts as a command queue between the web panel and a Lua bridge script running
inside a Roblox game. A Supabase edge function ("bridge") relays polls and
results between the game and the database.

## Architecture
1. Web panel inserts a command (Lua code) into `executions` with status='pending'
2. The Lua bridge script in the Roblox game polls the edge function every 1s
3. Edge function returns pending commands, marks them 'executing'
4. Lua script runs the code with loadstring(), captures print/warn output
5. Lua script posts the result back via the edge function
6. Edge function updates the execution row with output + status='success'/'failed'
7. Web panel polls the execution row and displays the real output

## Changes to existing tables

### servers
- Add `last_seen` (timestamptz, default now()) — updated every poll cycle by
  the bridge; the web panel uses this to determine if the server is connected.
- Add `auth_token` (text, default gen_random_uuid()) — included in the Lua
  bridge script; the edge function validates it on every poll to prevent
  unauthorized command access.
- Change `status` column default to 'disconnected'.

### executions
- Add `server_id` (uuid, nullable) — links the execution to a specific server.
- Add `code` (text, default '') — the Lua source code to execute.
- Add `completed_at` (timestamptz, nullable) — set when the result comes back.
- Status flow is now: pending → executing → success | failed.

## New seed data
- 6 real server-side example scripts with actual Lua code (not loadstring
  patterns) that work in any Roblox game when executed via the bridge.

## Security
- No changes to RLS. All tables remain open to anon + authenticated (single-tenant, no auth).
- The edge function uses the service role key to read/write commands.
- The auth_token on each server prevents unauthorized polling.
*/

ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();
ALTER TABLE servers ADD COLUMN IF NOT EXISTS auth_token text NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE servers ALTER COLUMN status SET DEFAULT 'disconnected';

ALTER TABLE executions ADD COLUMN IF NOT EXISTS server_id uuid;
ALTER TABLE executions ADD COLUMN IF NOT EXISTS code text NOT NULL DEFAULT '';
ALTER TABLE executions ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Mark old seeded servers as disconnected (they have no real bridge connected)
UPDATE servers SET last_seen = '2000-01-01 00:00:00+00' WHERE status IN ('online', 'idle', 'offline');

-- Add real server-side example scripts (new titles, won't conflict with existing)
INSERT INTO scripts (title, game_name, status, category, description, code) VALUES
('Server Status', 'Universal', 'working', 'Utility', 'Print server info: PlaceId, JobId, player count, ping per player, and current time.', 'print("=== SERVER STATUS ===")\nprint("PlaceId: " .. tostring(game.PlaceId))\nprint("JobId: " .. game.JobId)\nlocal Players = game:GetService("Players")\nprint("Players online: " .. #Players:GetPlayers())\nfor _, plr in ipairs(Players:GetPlayers()) do\n  local ping = math.floor(plr:GetNetworkPing() * 1000)\n  print("  " .. plr.Name .. " - " .. ping .. "ms")\nend\nprint("Time: " .. os.date("%H:%M:%S"))'),
('Announce', 'Universal', 'working', 'Admin', 'Send a notification to every player on the server.', 'local Players = game:GetService("Players")\nlocal msg = "Announcement from PUNCH.CLUB"\nfor _, plr in ipairs(Players:GetPlayers()) do\n  pcall(function()\n    game:GetService("StarterGui"):SetCore("SendNotification", {\n      Title = "PUNCH.CLUB",\n      Text = msg,\n      Duration = 5\n    })\n  end)\nend\nprint("Sent notification to " .. #Players:GetPlayers() .. " players")'),
('Set WalkSpeed', 'Universal', 'working', 'Utility', 'Set every player WalkSpeed to 50.', 'local Players = game:GetService("Players")\nlocal SPEED = 50\nfor _, plr in ipairs(Players:GetPlayers()) do\n  local char = plr.Character\n  if char then\n    local hum = char:FindFirstChildOfClass("Humanoid")\n    if hum then\n      hum.WalkSpeed = SPEED\n      print(plr.Name .. " -> WalkSpeed " .. SPEED)\n    end\n  end\nend'),
('Kick All', 'Universal', 'working', 'Admin', 'Kick every player with a message.', 'local Players = game:GetService("Players")\nlocal count = 0\nfor _, plr in ipairs(Players:GetPlayers()) do\n  plr:Kick("Removed by PUNCH.CLUB")\n  count = count + 1\nend\nprint("Kicked " .. count .. " players")'),
('Neon Part Rain', 'Universal', 'working', 'Fun', 'Spawn 20 colorful neon parts falling from the sky.', 'local Workspace = game:GetService("Workspace")\nfor i = 1, 20 do\n  local part = Instance.new("Part")\n  part.Size = Vector3.new(2, 2, 2)\n  part.Position = Vector3.new(\n    math.random(-50, 50),\n    100 + math.random(0, 50),\n    math.random(-50, 50)\n  )\n  part.Color = Color3.fromHSV(math.random(), 1, 1)\n  part.Material = Enum.Material.Neon\n  part.Parent = Workspace\nend\nprint("Spawned 20 neon parts")'),
('Workspace Parts Count', 'Universal', 'working', 'Utility', 'Count all parts in the workspace and print the total.', 'local Workspace = game:GetService("Workspace")\nlocal count = 0\nfor _, obj in ipairs(Workspace:GetDescendants()) do\n  if obj:IsA("BasePart") then\n    count = count + 1\n  end\nend\nprint("Total parts in workspace: " .. count)')
ON CONFLICT DO NOTHING;