/**
 * PC Control Companion Daemon for Windows
 * Lightweight HTTP Server with zero external npm dependencies.
 */

const http = require('http');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Default configuration
let config = {
  port: 5005,
  pin: '1234',
  allowedIps: [], // empty = allow any local network IP
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (e) {
    console.error('[Config] Error reading config.json, using defaults.', e.message);
  }
} else {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

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
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout.trim() });
      }
    });
  });
}

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

  // Authentication validation
  const authToken = req.headers['x-auth-token'] || url.searchParams.get('token') || url.searchParams.get('pin');
  const isAuthorized = !config.pin || authToken === config.pin;

  // JSON helper
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Status endpoint (Public or Auth)
  if (pathname === '/api/status' && req.method === 'GET') {
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);
    const uptimeHours = (os.uptime() / 3600).toFixed(1);

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

  // All power control endpoints require PIN auth
  if (!isAuthorized) {
    return sendJson(401, {
      success: false,
      error: 'Unauthorized: Invalid or missing PIN / x-auth-token header.',
    });
  }

  if (pathname === '/api/power/shutdown' && req.method === 'POST') {
    console.log(`[${new Date().toLocaleTimeString()}] Executing SHUTDOWN command...`);
    const result = await executeCommand('shutdown.exe /s /t 5 /c "Shutdown triggered via iOS App"');
    return sendJson(200, {
      success: true,
      action: 'shutdown',
      message: 'System shutdown sequence initiated (5-second grace period).',
      detail: result,
    });
  }

  if (pathname === '/api/power/restart' && req.method === 'POST') {
    console.log(`[${new Date().toLocaleTimeString()}] Executing RESTART command...`);
    const result = await executeCommand('shutdown.exe /r /t 5 /c "Restart triggered via iOS App"');
    return sendJson(200, {
      success: true,
      action: 'restart',
      message: 'System restart sequence initiated (5-second grace period).',
      detail: result,
    });
  }

  if (pathname === '/api/power/sleep' && req.method === 'POST') {
    console.log(`[${new Date().toLocaleTimeString()}] Executing SLEEP command...`);
    // Rundll32 power suspend
    const result = await executeCommand('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
    return sendJson(200, {
      success: true,
      action: 'sleep',
      message: 'System sleep command dispatched.',
      detail: result,
    });
  }

  if (pathname === '/api/power/lock' && req.method === 'POST') {
    console.log(`[${new Date().toLocaleTimeString()}] Executing LOCK WORKSTATION command...`);
    const result = await executeCommand('rundll32.exe user32.dll,LockWorkStation');
    return sendJson(200, {
      success: true,
      action: 'lock',
      message: 'Windows workstation locked.',
      detail: result,
    });
  }

  if (pathname === '/api/power/abort' && req.method === 'POST') {
    console.log(`[${new Date().toLocaleTimeString()}] Aborting pending shutdown/restart...`);
    const result = await executeCommand('shutdown.exe /a');
    return sendJson(200, {
      success: true,
      action: 'abort',
      message: 'Pending shutdown/restart cancelled.',
      detail: result,
    });
  }

  // Not Found
  sendJson(404, { error: 'Endpoint not found' });
});

server.listen(config.port, '0.0.0.0', () => {
  const nets = getLocalNetworkDetails();
  console.log('====================================================');
  console.log('        🚀 SONANCE - YOUR PC COMPANION AGENT       ');
  console.log('====================================================');
  console.log(`Status: Running on port ${config.port}`);
  console.log(`PIN Authentication: ${config.pin ? `Configured ("${config.pin}")` : 'Disabled'}`);
  console.log('\n📱 Local Network Connection Info for your iOS App:');
  nets.forEach((n, idx) => {
    console.log(`  [Adapter #${idx + 1}: ${n.interface}]`);
    console.log(`    • IP Address  : ${n.ip}`);
    console.log(`    • MAC Address : ${n.mac}`);
    console.log(`    • Port        : ${config.port}`);
  });
  console.log('====================================================\n');
});
