import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface PollBody {
  action: "poll";
  server_id: string;
  auth_token: string;
}
interface ResultBody {
  action: "result";
  server_id: string;
  auth_token: string;
  execution_id: string;
  status: "success" | "failed";
  output: string;
  duration_ms: number;
}
interface RegisterBody {
  action: "register";
  name: string;
  place_id: number;
  job_id: string;
  region: string;
  max_players: number;
  player_count: number;
}
interface SearchRobloxBody {
  action: "search_roblox";
  username: string;
}
interface LinkAccountBody {
  action: "link_account";
  roblox_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
}
interface CheckAllowlistBody {
  action: "check_allowlist";
  roblox_id: number;
  server_id: string;
  auth_token: string;
}
interface GetAllowlistBody {
  action: "get_allowlist";
  server_id: string;
  auth_token: string;
}

type Body =
  | PollBody
  | ResultBody
  | RegisterBody
  | SearchRobloxBody
  | LinkAccountBody
  | CheckAllowlistBody
  | GetAllowlistBody;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;

    switch (body.action) {
      /* ---- Game polls for pending commands ---- */
      case "poll": {
        const { server_id, auth_token } = body as PollBody;
        const { data: server, error: sErr } = await supabase
          .from("servers")
          .select("id, auth_token")
          .eq("id", server_id)
          .maybeSingle();

        if (sErr || !server) return json({ error: "Server not found" }, 404);
        if (server.auth_token !== auth_token) return json({ error: "Invalid auth token" }, 403);

        await supabase
          .from("servers")
          .update({ last_seen: new Date().toISOString(), status: "online" })
          .eq("id", server_id);

        const { data: cmd } = await supabase
          .from("executions")
          .select("id, code, script_title")
          .eq("server_id", server_id)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!cmd) return json({ command: null });

        await supabase
          .from("executions")
          .update({ status: "executing" })
          .eq("id", cmd.id);

        return json({ command: { id: cmd.id, code: cmd.code, title: cmd.script_title } });
      }

      /* ---- Game posts back the result ---- */
      case "result": {
        const { server_id, auth_token, execution_id, status, output, duration_ms } = body as ResultBody;
        const { data: server } = await supabase
          .from("servers")
          .select("auth_token")
          .eq("id", server_id)
          .maybeSingle();

        if (!server || server.auth_token !== auth_token) return json({ error: "Invalid auth token" }, 403);

        await supabase
          .from("executions")
          .update({ status, output, duration_ms, completed_at: new Date().toISOString() })
          .eq("id", execution_id);

        return json({ ok: true });
      }

      /* ---- Game registers itself ---- */
      case "register": {
        const { name, place_id, job_id, region, max_players, player_count } = body as RegisterBody;
        const { data: existing } = await supabase
          .from("servers")
          .select("id, auth_token")
          .eq("place_id", place_id)
          .eq("job_id", job_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("servers")
            .update({ name, last_seen: new Date().toISOString(), status: "online", max_players, player_count })
            .eq("id", existing.id);
          return json({ server_id: existing.id, auth_token: existing.auth_token });
        }

        const { data: created, error } = await supabase
          .from("servers")
          .insert({ name, place_id, job_id, region, max_players, player_count, status: "online", last_seen: new Date().toISOString() })
          .select("id, auth_token")
          .single();

        if (error) return json({ error: "Failed to register server" }, 500);
        return json({ server_id: created.id, auth_token: created.auth_token });
      }

      /* ---- Panel searches Roblox for a user by username ---- */
      case "search_roblox": {
        const { username } = body as SearchRobloxBody;
        const clean = username.trim();
        if (!clean) return json({ error: "Username required" }, 400);

        // Step 1: resolve username → user ID
        const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [clean], excludeBannedUsers: false }),
        });
        if (!userRes.ok) return json({ error: "Roblox API unavailable" }, 502);
        const userData = await userRes.json();
        if (!userData.data || userData.data.length === 0) {
          return json({ error: `No Roblox user found for "${clean}"` }, 404);
        }
        const user = userData.data[0];

        // Step 2: get avatar headshot
        let avatarUrl = "";
        try {
          const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`,
          );
          if (thumbRes.ok) {
            const thumbData = await thumbRes.json();
            if (thumbData.data && thumbData.data.length > 0) {
              avatarUrl = thumbData.data[0].imageUrl ?? "";
            }
          }
        } catch { /* avatar is optional */ }

        return json({
          roblox_id: user.id,
          username: user.name,
          display_name: user.displayName,
          avatar_url: avatarUrl,
        });
      }

      /* ---- Panel links a Roblox account to the allowlist ---- */
      case "link_account": {
        const { roblox_id, username, display_name, avatar_url } = body as LinkAccountBody;

        // Upsert: if the roblox_id already exists, update username/avatar
        const { data: existing } = await supabase
          .from("accounts")
          .select("id")
          .eq("roblox_id", roblox_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("accounts")
            .update({ username, display_name, avatar_url })
            .eq("id", existing.id);
          return json({ ok: true, id: existing.id });
        }

        const { data, error } = await supabase
          .from("accounts")
          .insert({ roblox_id, username, display_name, avatar_url })
          .select("id")
          .single();

        if (error) return json({ error: "Failed to link account" }, 500);
        return json({ ok: true, id: data.id });
      }

      /* ---- Game checks if a single player is allowlisted ---- */
      case "check_allowlist": {
        const { roblox_id, server_id, auth_token } = body as CheckAllowlistBody;
        const { data: server } = await supabase
          .from("servers")
          .select("auth_token")
          .eq("id", server_id)
          .maybeSingle();

        if (!server || server.auth_token !== auth_token) return json({ error: "Invalid auth token" }, 403);

        const { data: account } = await supabase
          .from("accounts")
          .select("roblox_id, username, display_name")
          .eq("roblox_id", roblox_id)
          .maybeSingle();

        return json({ allowed: !!account, account: account ?? null });
      }

      /* ---- Game fetches the full allowlist on startup ---- */
      case "get_allowlist": {
        const { server_id, auth_token } = body as GetAllowlistBody;
        const { data: server } = await supabase
          .from("servers")
          .select("auth_token")
          .eq("id", server_id)
          .maybeSingle();

        if (!server || server.auth_token !== auth_token) return json({ error: "Invalid auth token" }, 403);

        const { data: accounts } = await supabase
          .from("accounts")
          .select("roblox_id, username, display_name")
          .order("created_at", { ascending: true });

        return json({ accounts: accounts ?? [] });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
