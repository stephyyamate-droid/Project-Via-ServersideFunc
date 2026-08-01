/*
# Roblox Server-Side Panel — schema

## Overview
Single-tenant dashboard for managing Roblox game servers, a library of
saved Lua scripts, and a log of script executions. No sign-in screen,
so all data is intentionally shared and policies are open to anon + authenticated.

## New Tables

1. `servers` — registered Roblox game servers
   - id (uuid, PK)
   - name (text) — friendly label for the server
   - place_id (bigint) — Roblox Place ID
   - job_id (text) — Roblox server JobId
   - region (text) — geographic region
   - max_players (int) — server capacity
   - player_count (int, default 0) — current players
   - status (text, default 'online') — online | idle | offline
   - created_at (timestamptz)

2. `scripts` — saved Lua script library
   - id (uuid, PK)
   - title (text)
   - description (text)
   - code (text) — Lua source
   - category (text) — Utility | Admin | Fun | Anti-Exploit | Economy
   - created_at, updated_at (timestamptz)

3. `executions` — execution history log
   - id (uuid, PK)
   - script_title (text) — snapshot of script name at run time
   - server_name (text) — snapshot of server name at run time
   - status (text, default 'pending') — success | failed | pending
   - output (text) — console output
   - duration_ms (int) — run duration in ms
   - created_at (timestamptz)

## Security
- RLS enabled on all three tables.
- All policies scoped TO anon, authenticated with USING/WITH CHECK (true)
  because the app has no sign-in screen and the data is intentionally shared.
*/