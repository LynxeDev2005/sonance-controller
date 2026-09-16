# 🖥️ SONANCE — PC Companion Software for Windows

A dedicated, lightweight background companion software for your Windows PC designed to pair with the **Sonance iOS App**.

---

## ⚡ Features

- 🟢 **Runs Silently on Windows Boot**: Automatically boots in the background with **0 command prompt windows** using a lightweight VBScript runner.
- 🎛️ **Web Control Center (`http://localhost:5005`)**:
  - Displays your PC's exact **Local IPv4 Address** and **NIC MAC Address** for easy iOS pairing.
  - **Live Execution Logs**: View commands sent from your iPhone in real-time.
  - **1-Click Startup Toggle**: Enable or disable Windows auto-start directly from the browser.
  - **Manual Power Triggers**: Test Shutdown, Restart, Sleep, and Lock.
  - **Customizable Security PIN**: Protect remote power execution.
- 🔒 **Supported Remote Commands**:
  - `POST /api/power/shutdown` -> Windows shutdown (`shutdown.exe /s /t <grace>`)
  - `POST /api/power/restart` -> Windows restart (`shutdown.exe /r /t <grace>`)
  - `POST /api/power/sleep` -> Windows sleep mode (`rundll32.exe powrprof.dll,SetSuspendState 0,1,0`)
  - `POST /api/power/lock` -> Lock screen (`rundll32.exe user32.dll,LockWorkStation`)
  - `POST /api/power/abort` -> Cancel pending shutdown/restart (`shutdown.exe /a`)
  - `GET /api/status` -> Live CPU, RAM, Uptime, and hostname telemetry

---

## 🚀 Installation & Usage

### Option 1: Automatic Startup on Windows Boot (Recommended)
1. Double-click **`install-startup.bat`**.
2. That's it! Sonance Companion is now registered in Windows Startup (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`) and will silently run every time your PC turns on.

### Option 2: Run with Web Dashboard
Double-click **`start-companion.bat`**. This starts the agent and opens `http://localhost:5005` in your browser.

### Option 3: Uninstall from Startup
Double-click **`uninstall-startup.bat`** to remove the auto-start background launcher.
