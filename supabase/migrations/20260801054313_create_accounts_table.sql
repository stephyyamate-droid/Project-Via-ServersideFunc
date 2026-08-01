/*
# Accounts table + clean example scripts

## Overview
1. Create a new `accounts` table to store Roblox accounts linked to the panel.
   These accounts are allowlisted in-game — when they join a server running the
   bridge script, a GUI appears for them and they can execute Lua.
2. Delete ALL existing example scripts from the `scripts` table.

## New table: accounts
- `id` (uuid, PK)
- `roblox_id` (bigint, unique) — the Roblox user ID
- `username` (text) — the Roblox username at time of linking
- `display_name` (text) — the Roblox display name
- `avatar_url` (text) — headshot thumbnail URL
- `created_at` (timestamptz)

## Security
- Enable RLS on `accounts`.
- Single-tenant (no auth): allow anon + authenticated CRUD so the panel can
  read/write accounts without a login screen.
*/

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_id bigint UNIQUE NOT NULL,
  username text NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE
  TO anon, authenticated USING (true);

-- Delete all example scripts
DELETE FROM scripts;