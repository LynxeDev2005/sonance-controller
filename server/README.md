# 🖥️ PC Control Windows Companion Daemon

A lightweight HTTP background server running on Windows with **zero external npm dependencies**.

## Features
- **Endpoints**:
  - `GET /api/status` - Live system telemetry (hostname, uptime, RAM, latency)
  - `POST /api/power/shutdown` - Triggers Windows shutdown sequence (`shutdown /s /t 5`)
  - `POST /api/power/restart` - Triggers Windows reboot sequence (`shutdown /r /t 5`)
  - `POST /api/power/sleep` - Puts PC into low power sleep mode
  - `POST /api/power/lock` - Locks the Windows session
  - `POST /api/power/abort` - Cancels pending shutdown/restart (`shutdown /a`)
- **Security**: PIN authentication via `x-auth-token` header or `?pin=1234`.

## Running the Agent

### Option 1: Run manually
Double-click `start-agent.bat` or run:
```bash
node agent.js
```

### Option 2: Run silently on Windows Startup (Recommended)
Double-click `install-startup.bat`.
This creates a background launcher in your Windows Startup directory (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`) so the server starts automatically whenever your computer boots up.
