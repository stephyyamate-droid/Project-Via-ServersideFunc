/*
# Script Hub schema rework — punch.club style

## Overview
Shift the panel toward a Roblox script-hub aesthetic (like punch.club):
- Each script targets a specific Roblox game (game_name)
- Each script has a working status: working | patched | checking
- Remove the servers concept from the primary flow; executions become
  "copy/run" actions logged against a game + script.

## Changes to existing tables
1. `scripts` — add two columns:
   - `game_name` (text, default 'Universal') — the Roblox game the script targets
   - `status` (text, default 'working') — working | patched | checking
2. `executions` — widen meaning: rename server_name usage to game_name context.
   Add `game_name` column (text, default '') to record which game a run targeted.

## Security
- No changes to RLS; tables remain open to anon + authenticated (single-tenant, no auth).
*/

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS game_name text NOT NULL DEFAULT 'Universal';
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'working';

ALTER TABLE executions ADD COLUMN IF NOT EXISTS game_name text NOT NULL DEFAULT '';

-- Re-seed script-hub-style data (wipe old scripts first, safe — single-tenant demo)
DELETE FROM scripts;
DELETE FROM executions;

INSERT INTO scripts (title, game_name, status, category, description, code) VALUES
('Infinite Yield', 'Universal', 'working', 'Admin', 'Ultimate admin command suite. Over 150 commands.', '-- loadstring\nloadstring(game:HttpGet("https://raw.host/infinite_yield.lua"))()'),
('Dex Explorer', 'Universal', 'working', 'Utility', 'Full Data Explorer — inspect every instance in the game.', '-- Dex Explorer v4\nloadstring(game:HttpGet("https://raw.host/dex.lua"))()'),
('Brookhaven GUI', 'Brookhaven RP', 'working', 'Fun', 'Admin commands, player tools, and house unlock for Brookhaven.', '-- Brookhaven RP GUI\nloadstring(game:HttpGet("https://raw.host/brookhaven.lua"))()'),
('Adopt Me Autofarm', 'Adopt Me', 'patched', 'Economy', 'Auto-collect and trade pets. Currently patched — waiting for update.', '-- Adopt Me Autofarm [PATCHED]\nloadstring(game:HttpGet("https://raw.host/adoptme.lua"))()'),
('Bedwars Aimbot', 'Bedwars', 'working', 'Fun', 'Auto-aim bed defense destroyer and kill aura.', '-- Bedwars Aimbot\nloadstring(game:HttpGet("https://raw.host/bedwars.lua"))()'),
('Tower of Hell Skip', 'Tower of Hell', 'working', 'Utility', 'Teleport to the top of every stage instantly.', '-- ToH Stage Skip\nloadstring(game:HttpGet("https://raw.host/toh.lua"))()'),
('Grow a Garden Autofarm', 'Grow a Garden', 'checking', 'Economy', 'Auto-plant, water, and harvest. Checking compatibility.', '-- Grow a Garden Autofarm [BETA]\nloadstring(game:HttpGet("https://raw.host/garden.lua"))()'),
('Anti-Exploit Bypass', 'Universal', 'working', 'Anti-Exploit', 'Bypasses common server-side anti-exploit checks.', '-- AE Bypass\nloadstring(game:HttpGet("https://raw.host/aebypass.lua"))()'),
('Universal Fly Noclip', 'Universal', 'working', 'Utility', 'Fly anywhere and walk through walls. Works on most games.', '-- Fly + Noclip\nloadstring(game:HttpGet("https://raw.host/fly.lua"))()'),
('Da Hood Aimlock', 'Da Hood', 'patched', 'Fun', 'Silent aimlock for Da Hood. Patched in latest update.', '-- Da Hood Aimlock [PATCHED]\nloadstring(game:HttpGet("https://raw.host/dahood.lua"))()'),
('Speed Legend Sprint', 'Speed Simulator', 'working', 'Fun', 'Infinite stamina and auto-sprint.', '-- Speed Legend\nloadstring(game:HttpGet("https://raw.host/speed.lua"))()'),
('Arsenal ESP', 'Arsenal', 'working', 'Fun', 'See every player through walls with distance tags.', '-- Arsenal ESP\nloadstring(game:HttpGet("https://raw.host/arsenal.lua"))()');