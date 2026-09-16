/**
 * SONANCE — YOUR PC COMPANION
 * Dedicated Windows Background Daemon & Control Center
 * Zero-dependency pure Node.js server.
 */

const http = require('http');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const LOGS_MAX = 50;
const activityLogs = [];

// Default configuration
let config = {
  port: 5005,
  pin: '1234',
  gracePeriodSec: 5,
  autoStartEnabled: true,
};

function logActivity(type, message, clientIp) {
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    clientIp: clientIp || 'Localhost',
  };
  activityLogs.unshift(entry);
  if (activityLogs.length > LOGS_MAX) {
    activityLogs.pop();
  }
  console.log(`[${entry.timestamp}] [${entry.type.toUpperCase()}] ${entry.message} (From: ${entry.clientIp})`);
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = { ...config, ...JSON.parse(raw) };
    } catch (e) {
      console.error('[Config] Error reading config.json, using defaults.', e.message);
    }
  } else {
    saveConfig();
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('[Config] Error saving config.json:', e.message);
  }
}

loadConfig();

function getLocalNetworkDetails() {
  const interfaces = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interface: name,
          ip: net.address,
          mac: net.mac,
          netmask: net.netmask,
        });
      }
    }
  }
  return results;
}

function executeCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: (stderr || error.message).trim() });
      } else {
        resolve({ success: true, output: (stdout || '').trim() });
      }
    });
  });
}

function isStartupInstalled() {
  const startupDir = path.join(
    process.env.APPDATA || '',
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup'
  );
  const vbsPath = path.join(startupDir, 'SonanceCompanion.vbs');
  return fs.existsSync(vbsPath);
}

function setStartupState(enable) {
  const startupDir = path.join(
    process.env.APPDATA || '',
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup'
  );
  const vbsPath = path.join(startupDir, 'SonanceCompanion.vbs');

  if (enable) {
    const vbsContent = [
      'Set WshShell = CreateObject("WScript.Shell")',
      `WshShell.CurrentDirectory = "${__dirname.replace(/\\/g, '\\\\')}"`,
      'WshShell.Run "node agent.js", 0, False',
    ].join('\r\n');

    try {
      fs.writeFileSync(vbsPath, vbsContent, 'utf8');
      config.autoStartEnabled = true;
      saveConfig();
      return { success: true, message: 'Startup background launcher created.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  } else {
    try {
      if (fs.existsSync(vbsPath)) {
        fs.unlinkSync(vbsPath);
      }
      config.autoStartEnabled = false;
      saveConfig();
      return { success: true, message: 'Startup background launcher removed.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// Generate the Modern Monochrome Black & White Web Control Center
function renderHtmlDashboard(primaryNet) {
  const ip = primaryNet ? primaryNet.ip : '127.0.0.1';
  const mac = primaryNet ? primaryNet.mac.toUpperCase() : 'N/A';
  const startupActive = isStartupInstalled();
  const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
  const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);
  const uptimeHours = (os.uptime() / 3600).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SONANCE — PC Companion</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #000000; color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 30px 16px; }
    .container { max-width: 680px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 18px; }
    .brand { display: flex; flex-direction: column; }
    .title { font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #ffffff; }
    .subtitle { font-size: 10px; font-weight: 700; color: #71717a; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
    .status-badge { display: flex; align-items: center; gap: 6px; background: #121215; border: 1px solid #ffffff; padding: 6px 12px; borderRadius: 20px; font-size: 11px; font-weight: 800; }
    .status-dot { width: 7px; height: 7px; background: #ffffff; border-radius: 50%; }

    /* Cards */
    .card { background: #0d0d10; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; }
    .card-title { font-size: 11px; font-weight: 800; color: #71717a; letter-spacing: 1px; text-transform: uppercase; }

    /* Pairing Details */
    .pair-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .pair-item { background: #141418; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; }
    .pair-label { font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 4px; }
    .pair-value { font-size: 15px; font-weight: 800; color: #ffffff; font-family: monospace; letter-spacing: 0.5px; }

    /* Manual Actions */
    .btn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .btn { background: #141418; color: #ffffff; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 8px; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.15s ease; }
    .btn:hover { background: #ffffff; color: #000000; border-color: #ffffff; }
    .btn-primary { background: #ffffff; color: #000000; border-color: #ffffff; }
    .btn-primary:hover { background: #e4e4e7; }

    /* Settings Form */
    .form-row { display: flex; gap: 10px; align-items: flex-end; }
    .form-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 11px; font-weight: 600; color: #a1a1aa; }
    .input { background: #141418; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 12px; color: #ffffff; font-size: 13px; font-family: monospace; outline: none; }
    .input:focus { border-color: #ffffff; }

    /* Toggle Switch */
    .toggle-row { display: flex; justify-content: space-between; align-items: center; background: #141418; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; }
    .toggle-info { display: flex; flex-direction: column; gap: 2px; }
    .toggle-title { font-size: 13px; font-weight: 700; color: #ffffff; }
    .toggle-desc { font-size: 11px; color: #71717a; }

    /* Activity Logs */
    .logs-list { max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; font-family: monospace; font-size: 11px; }
    .log-item { background: #141418; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 6px 10px; display: flex; gap: 10px; color: #a1a1aa; }
    .log-time { color: #ffffff; font-weight: 700; }
    .log-type { color: #ffffff; background: #27272a; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: 800; }

    .toast { position: fixed; bottom: 20px; background: #ffffff; color: #000000; padding: 10px 18px; border-radius: 20px; font-size: 13px; font-weight: 700; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="title">SONANCE</div>
        <div class="subtitle">Your PC Companion &middot; Windows Daemon</div>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        ACTIVE &middot; PORT ${config.port}
      </div>
    </div>

    <!-- Quick Info Cards -->
    <div class="card">
      <div class="card-title">iOS App Connection Details</div>
      <div class="pair-grid">
        <div class="pair-item">
          <div class="pair-label">PC IPv4 Address</div>
          <div class="pair-value" id="ipVal">${ip}</div>
        </div>
        <div class="pair-item">
          <div class="pair-label">NIC MAC Address (WOL)</div>
          <div class="pair-value">${mac}</div>
        </div>
        <div class="pair-item">
          <div class="pair-label">Port</div>
          <div class="pair-value">${config.port}</div>
        </div>
        <div class="pair-item">
          <div class="pair-label">Auth PIN</div>
          <div class="pair-value">${config.pin || 'None'}</div>
        </div>
      </div>
    </div>

    <!-- Windows Startup Configuration -->
    <div class="card">
      <div class="card-title">Background Automation</div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-title">Run Silently on Windows Startup</div>
          <div class="toggle-desc">Auto-start Sonance in the background every time Windows boots</div>
        </div>
        <button class="btn ${startupActive ? 'btn-primary' : ''}" onclick="toggleStartup(${!startupActive})">
          ${startupActive ? 'Enabled (Active)' : 'Enable Auto-Start'}
        </button>
      </div>
    </div>

    <!-- Test Controls -->
    <div class="card">
      <div class="card-title">Manual Action Triggers</div>
      <div class="btn-grid">
        <button class="btn" onclick="sendPowerAction('lock')">Lock Screen</button>
        <button class="btn" onclick="sendPowerAction('sleep')">Sleep</button>
        <button class="btn" onclick="sendPowerAction('restart')">Restart</button>
        <button class="btn" onclick="sendPowerAction('shutdown')">Shutdown</button>
      </div>
    </div>

    <!-- Settings Form -->
    <div class="card">
      <div class="card-title">Security & Configuration</div>
      <form class="form-row" onsubmit="saveSettings(event)">
        <div class="form-group">
          <label class="form-label">PIN Authentication Token</label>
          <input class="input" type="text" id="pinInput" value="${config.pin}">
        </div>
        <div class="form-group">
          <label class="form-label">Grace Period (Seconds)</label>
          <input class="input" type="number" id="graceInput" value="${config.gracePeriodSec}" min="0" max="60">
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 10px 16px;">Save Settings</button>
      </form>
    </div>

    <!-- Live Activity Log -->
    <div class="card">
      <div class="card-title">Live Execution Logs</div>
      <div class="logs-list" id="logsContainer">
        ${
          activityLogs.length === 0
            ? '<div style="color: #71717a; padding: 6px;">Waiting for commands from iOS App...</div>'
            : activityLogs
                .map(
                  (l) => `<div class="log-item">
            <span class="log-time">${l.timestamp}</span>
            <span class="log-type">${l.type}</span>
            <span>${l.message}</span>
          </div>`
                )
                .join('')
        }
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    async function toggleStartup(enable) {
      const res = await fetch('/api/startup/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable })
      });
      const data = await res.json();
      showToast(data.message || 'Updated startup settings');
      setTimeout(() => location.reload(), 800);
    }

    async function sendPowerAction(action) {
      if (!confirm('Execute ' + action.toUpperCase() + ' on this PC?')) return;
      const res = await fetch('/api/power/' + action, {
        method: 'POST',
        headers: { 'x-auth-token': '${config.pin}' }
      });
      const data = await res.json();
      showToast(data.message || 'Action sent');
      setTimeout(() => location.reload(), 1000);
    }

    async function saveSettings(e) {
      e.preventDefault();
      const pin = document.getElementById('pinInput').value.trim();
      const grace = parseInt(document.getElementById('graceInput').value, 10) || 5;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, gracePeriodSec: grace })
      });
      const data = await res.json();
      showToast('Settings saved!');
      setTimeout(() => location.reload(), 800);
    }

    // Auto-refresh logs every 4 seconds
    setInterval(async () => {
      try {
        const res = await fetch('/api/logs');
        const logs = await res.json();
        const container = document.getElementById('logsContainer');
        if (logs.length > 0) {
          container.innerHTML = logs.map(l => '<div class="log-item"><span class="log-time">' + l.timestamp + '</span><span class="log-type">' + l.type + '</span><span>' + l.message + '</span></div>').join('');
        }
      } catch {}
    }, 4000);
  </script>
</body>
</html>`;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const clientIp = req.socket.remoteAddress || '';

  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const parseBody = () => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  // 1. Web Management Dashboard
  if (pathname === '/' && req.method === 'GET') {
    const nets = getLocalNetworkDetails();
    const primaryNet = nets[0] || null;
    const html = renderHtmlDashboard(primaryNet);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // 2. Logs endpoint for Web UI
  if (pathname === '/api/logs' && req.method === 'GET') {
    return sendJson(200, activityLogs);
  }

  // 3. Status Endpoint (Public Telemetry)
  if (pathname === '/api/status' && req.method === 'GET') {
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);
    const uptimeHours = (os.uptime() / 3600).toFixed(1);

    const authToken = req.headers['x-auth-token'] || url.searchParams.get('token') || url.searchParams.get('pin');
    const isAuthorized = !config.pin || authToken === config.pin;

    return sendJson(200, {
      status: 'online',
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeHours: `${uptimeHours} hrs`,
      memory: {
        total: `${totalMem} GB`,
        free: `${freeMem} GB`,
      },
      authorized: isAuthorized,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Startup Toggle Endpoint
  if (pathname === '/api/startup/toggle' && req.method === 'POST') {
    const body = await parseBody();
    const result = setStartupState(body.enable);
    logActivity('startup', `Windows startup ${body.enable ? 'enabled' : 'disabled'}`, clientIp);
    return sendJson(200, result);
  }

  // 5. Settings Save Endpoint
  if (pathname === '/api/settings' && req.method === 'POST') {
    const body = await parseBody();
    if (body.pin !== undefined) config.pin = body.pin.trim();
    if (body.gracePeriodSec !== undefined) config.gracePeriodSec = body.gracePeriodSec;
    saveConfig();
    logActivity('settings', 'Companion settings updated', clientIp);
    return sendJson(200, { success: true, config });
  }

  // Authenticate Power Commands
  const authToken = req.headers['x-auth-token'] || url.searchParams.get('token') || url.searchParams.get('pin');
  const isAuthorized = !config.pin || authToken === config.pin;

  if (!isAuthorized) {
    logActivity('unauthorized', `Blocked request to ${pathname}`, clientIp);
    return sendJson(401, {
      success: false,
      error: 'Unauthorized: Invalid or missing PIN / x-auth-token header.',
    });
  }

  // 6. Power: Shutdown
  if (pathname === '/api/power/shutdown' && req.method === 'POST') {
    const grace = config.gracePeriodSec || 5;
    logActivity('shutdown', `Initiating Windows shutdown (${grace}s grace period)`, clientIp);
    const result = await executeCommand(`shutdown.exe /s /t ${grace} /c "Shutdown command received from Sonance Companion"`);
    return sendJson(200, {
      success: true,
      action: 'shutdown',
      message: `System shutdown initiated (${grace}s grace period).`,
      detail: result,
    });
  }

  // 7. Power: Restart
  if (pathname === '/api/power/restart' && req.method === 'POST') {
    const grace = config.gracePeriodSec || 5;
    logActivity('restart', `Initiating Windows reboot (${grace}s grace period)`, clientIp);
    const result = await executeCommand(`shutdown.exe /r /t ${grace} /c "Restart command received from Sonance Companion"`);
    return sendJson(200, {
      success: true,
      action: 'restart',
      message: `System restart initiated (${grace}s grace period).`,
      detail: result,
    });
  }

  // 8. Power: Sleep
  if (pathname === '/api/power/sleep' && req.method === 'POST') {
    logActivity('sleep', 'Putting PC into sleep mode', clientIp);
    const result = await executeCommand('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
    return sendJson(200, {
      success: true,
      action: 'sleep',
      message: 'System sleep dispatched.',
      detail: result,
    });
  }

  // 9. Power: Lock
  if (pathname === '/api/power/lock' && req.method === 'POST') {
    logActivity('lock', 'Locking Windows workstation', clientIp);
    const result = await executeCommand('rundll32.exe user32.dll,LockWorkStation');
    return sendJson(200, {
      success: true,
      action: 'lock',
      message: 'Windows workstation locked.',
      detail: result,
    });
  }

  // 10. Power: Abort
  if (pathname === '/api/power/abort' && req.method === 'POST') {
    logActivity('abort', 'Aborting pending shutdown/restart', clientIp);
    const result = await executeCommand('shutdown.exe /a');
    return sendJson(200, {
      success: true,
      action: 'abort',
      message: 'Pending shutdown/restart cancelled.',
      detail: result,
    });
  }

  sendJson(404, { error: 'Endpoint not found' });
});

// Auto-register startup if first run
if (!fs.existsSync(CONFIG_FILE) || config.autoStartEnabled) {
  setStartupState(true);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('====================================================');
    console.log('  ℹ️  SONANCE COMPANION IS ALREADY RUNNING!        ');
    console.log('====================================================');
    console.log(`Port ${config.port} is already active in the background.`);
    console.log(`Open your browser to: http://localhost:${config.port}`);
    console.log('To stop or restart it, run: server\\stop-companion.bat\n');
    process.exit(0);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(config.port, '0.0.0.0', () => {
  const nets = getLocalNetworkDetails();
  console.log('====================================================');
  console.log('        🚀 SONANCE — YOUR PC COMPANION AGENT       ');
  console.log('====================================================');
  console.log(`Web Dashboard: http://localhost:${config.port}`);
  console.log(`Port: ${config.port} | PIN: ${config.pin ? `"${config.pin}"` : 'None'}`);
  console.log(`Silent Windows Startup: ${isStartupInstalled() ? 'Enabled (Auto-runs on boot)' : 'Disabled'}`);
  console.log('\n📱 Local Network Connection Info for your iOS App:');
  nets.forEach((n, idx) => {
    console.log(`  [Adapter #${idx + 1}: ${n.interface}]`);
    console.log(`    • IP Address  : ${n.ip}`);
    console.log(`    • MAC Address : ${n.mac}`);
    console.log(`    • Port        : ${config.port}`);
  });
  console.log('====================================================\n');
});
