/*
# Roblox Server-Side Panel — schema

## Overview
Single-tenant dashboard for managing Roblox game servers, a library of
saved Lua scripts, and a log of script executions. No sign-in screen,
so all data is intentionally shared and policies are open to anon + authenticated.

## New Tables
1. servers — registered Roblox game servers (name, place_id, job_id, region, max_players, player_count, status)
2. scripts — saved Lua script library (title, description, code, category)
3. executions — execution history log (script_title, server_name, status, output, duration_ms)

## Security
- RLS enabled on all three tables.
- All policies TO anon, authenticated with USING/WITH CHECK (true) — no sign-in, shared data.
*/

CREATE TABLE IF NOT EXISTS servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  place_id bigint NOT NULL,
  job_id text NOT NULL,
  region text NOT NULL DEFAULT 'US-East',
  max_players int NOT NULL DEFAULT 16,
  player_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'online',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_servers" ON servers;
CREATE POLICY "anon_select_servers" ON servers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_servers" ON servers;
CREATE POLICY "anon_insert_servers" ON servers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_servers" ON servers;
CREATE POLICY "anon_update_servers" ON servers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_servers" ON servers;
CREATE POLICY "anon_delete_servers" ON servers FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Utility',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scripts" ON scripts;
CREATE POLICY "anon_select_scripts" ON scripts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_scripts" ON scripts;
CREATE POLICY "anon_insert_scripts" ON scripts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_scripts" ON scripts;
CREATE POLICY "anon_update_scripts" ON scripts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_scripts" ON scripts;
CREATE POLICY "anon_delete_scripts" ON scripts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_title text NOT NULL,
  server_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  output text NOT NULL DEFAULT '',
  duration_ms int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_executions" ON executions;
CREATE POLICY "anon_select_executions" ON executions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_executions" ON executions;
CREATE POLICY "anon_insert_executions" ON executions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_executions" ON executions;
CREATE POLICY "anon_update_executions" ON executions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_executions" ON executions;
CREATE POLICY "anon_delete_executions" ON executions FOR DELETE
  TO anon, authenticated USING (true);

-- Seed a few sample servers and scripts so the dashboard isn't empty
INSERT INTO servers (name, place_id, job_id, region, max_players, player_count, status) VALUES
('Brookhaven RP — Server A', 4924232812, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'US-East', 12, 11, 'online'),
('Adopt Me — Server B', 920587237, 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'US-West', 50, 47, 'online'),
('Tower of Hell — Server C', 1962087011, 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'EU-Central', 8, 8, 'idle'),
('Bedwars — Server D', 6872265039, 'd4e5f6a7-b8c9-0123-defa-456789012345', 'Asia-East', 16, 0, 'offline')
ON CONFLICT DO NOTHING;

INSERT INTO scripts (title, description, code, category) VALUES
('Infinite Yield Admin', 'A general-purpose admin command suite.', '-- Infinite Yield style admin commands\nlocal Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\n\nlocal function notify(msg)\n    game.StarterGui:SetCore("SendNotification", {Title="Admin",Text=msg})\nend\n\nnotify("Admin loaded")', 'Admin'),
('Anti-Exploit Guard', 'Detects and kicks suspicious players server-side.', '-- Anti-exploit server guard\nlocal Players = game:GetService("Players")\nPlayers.PlayerAdded:Connect(function(plr)\n    plr.CharacterAdded:Connect(function(char)\n        local root = char:WaitForChild("HumanoidRootPart")\n        local last = root.Position\n        task.spawn(function()\n            while task.wait(1) do\n                local dist = (root.Position - last).Magnitude\n                if dist > 500 then\n                    plr:Kick("Suspicious movement")\n                end\n                last = root.Position\n            end\n        end)\n    end)\nend)', 'Anti-Exploit'),
('Economy Booster', 'Grants currency to all players on the server.', '-- Give 1000 coins to every player\nlocal Players = game:GetService("Players")\nfor _, plr in ipairs(Players:GetPlayers()) do\n    local leaderstats = plr:FindFirstChild("leaderstats")\n    if leaderstats then\n        local coins = leaderstats:FindFirstChild("Coins")\n        if coins then coins.Value += 1000 end\n    end\nend', 'Economy'),
('Speed Patch', 'Sets all players walk speed to 24.', '-- Set every player walk speed\nlocal Players = game:GetService("Players")\nfor _, plr in ipairs(Players:GetPlayers()) do\n    local char = plr.Character\n    if char then\n        local hum = char:FindFirstChildOfClass("Humanoid")\n        if hum then hum.WalkSpeed = 24 end\n    end\nend', 'Utility'),
('Fun Fireworks', 'Spawns fireworks above every spawn point.', '-- Spawn fireworks\nlocal Workspace = game:GetService("Workspace")\nfor i=1, 20 do\n    local part = Instance.new("Part")\n    part.Position = Vector3.new(math.random(-100,100), 50, math.random(-100,100))\n    part.Anchored = true\n    part.Color = Color3.fromHSV(math.random(), 1, 1)\n    part.Parent = Workspace\n    task.delay(2, function() part:Destroy() end)\nend', 'Fun')
ON CONFLICT DO NOTHING;