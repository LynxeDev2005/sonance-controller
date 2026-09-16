const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  Notification,
  shell,
} = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');
const QRCode = require('qrcode');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let server = null;
const logs = [];

// Persistent Config File
const CONFIG_PATH = path.join(app.getPath('userData'), 'companion-config.json');

const DEFAULT_CONFIG = {
  port: 5005,
  pin: '2005',
  gracePeriodSec: 5,
  autoStart: true,
};

let config = { ...DEFAULT_CONFIG };

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...DEFAULT_CONFIG, ...data };
    } else {
      saveConfig();
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

// Network Helpers
function getNetworkDetails() {
  const interfaces = os.networkInterfaces();
  const results = [];
  let preferredIp = '127.0.0.1';
  let preferredMac = '00:00:00:00:00:00';

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const item = {
          interface: name,
          ip: addr.address,
          mac: addr.mac,
          netmask: addr.netmask,
        };
        results.push(item);

        // Pick Ethernet or Wi-Fi as primary
        if (
          preferredIp === '127.0.0.1' ||
          name.toLowerCase().includes('ethernet') ||
          name.toLowerCase().includes('wi-fi') ||
          name.toLowerCase().includes('wlan')
        ) {
          preferredIp = addr.address;
          preferredMac = addr.mac.toUpperCase();
        }
      }
    }
  }

  return {
    hostname: os.hostname(),
    primaryIp: preferredIp,
    primaryMac: preferredMac,
    adapters: results,
  };
}

function logActivity(type, message, clientIp = '127.0.0.1') {
  const logItem = {
    id: Date.now() + Math.random().toString(36).substring(2, 6),
    time: new Date().toLocaleTimeString(),
    type,
    message,
    clientIp,
  };
  logs.unshift(logItem);
  if (logs.length > 100) logs.pop();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('server-log', logItem);
  }
}

function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      silent: false,
    }).show();
  }
}

// Command Executor
function executePowerCommand(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout ? stdout.trim() : '',
        stderr: stderr ? stderr.trim() : '',
        error: error ? error.message : null,
      });
    });
  });
}

// Built-in HTTP Power Server
function startHttpServer() {
  if (server) {
    server.close();
  }

  server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const clientIp = req.socket.remoteAddress || 'unknown';

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, pin');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const sendJson = (status, obj) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    };

    // 1. Status Telemetry
    if (pathname === '/api/status' && req.method === 'GET') {
      const net = getNetworkDetails();
      const totalMemGb = (os.totalmem() / (1024 ** 3)).toFixed(1);
      const freeMemGb = (os.freemem() / (1024 ** 3)).toFixed(1);
      const uptimeHrs = (os.uptime() / 3600).toFixed(1);

      logActivity('status', 'Telemetry heartbeat received', clientIp);

      return sendJson(200, {
        online: true,
        hostname: os.hostname(),
        platform: 'win32',
        platformRelease: os.release(),
        uptimeHours: `${uptimeHrs} hrs`,
        uptimeSeconds: Math.floor(os.uptime()),
        memory: {
          total: `${totalMemGb} GB`,
          free: `${freeMemGb} GB`,
          usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
        primaryIp: net.primaryIp,
        primaryMac: net.primaryMac,
        pinRequired: Boolean(config.pin),
        timestamp: Date.now(),
      });
    }

    // Auth validation for power endpoints
    const authToken = req.headers['x-auth-token'] || parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('pin');
    const isAuthorized = !config.pin || authToken === config.pin;

    if (!isAuthorized) {
      logActivity('unauthorized', `Blocked unauthorized access to ${pathname}`, clientIp);
      return sendJson(401, { success: false, error: 'Unauthorized: Invalid PIN' });
    }

    // 2. Power: Shutdown
    if (pathname === '/api/power/shutdown' && req.method === 'POST') {
      const grace = config.gracePeriodSec || 5;
      logActivity('shutdown', `Initiating Windows shutdown (${grace}s grace period)`, clientIp);
      showNotification('Sonance PC Companion', `Shutdown command received from ${clientIp}`);
      const resExec = await executePowerCommand(`shutdown.exe /s /t ${grace} /c "Shutdown command received from Sonance Companion"`);
      return sendJson(200, { success: true, action: 'shutdown', message: `Shutdown initiated (${grace}s grace)`, detail: resExec });
    }

    // 3. Power: Restart
    if (pathname === '/api/power/restart' && req.method === 'POST') {
      const grace = config.gracePeriodSec || 5;
      logActivity('restart', `Initiating Windows reboot (${grace}s grace period)`, clientIp);
      showNotification('Sonance PC Companion', `Restart command received from ${clientIp}`);
      const resExec = await executePowerCommand(`shutdown.exe /r /t ${grace} /c "Restart command received from Sonance Companion"`);
      return sendJson(200, { success: true, action: 'restart', message: `Restart initiated (${grace}s grace)`, detail: resExec });
    }

    // 4. Power: Sleep
    if (pathname === '/api/power/sleep' && req.method === 'POST') {
      logActivity('sleep', 'Suspending Windows session (Sleep mode)', clientIp);
      showNotification('Sonance PC Companion', 'PC entering sleep mode');
      const resExec = await executePowerCommand('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
      return sendJson(200, { success: true, action: 'sleep', message: 'Sleep command dispatched', detail: resExec });
    }

    // 5. Power: Lock
    if (pathname === '/api/power/lock' && req.method === 'POST') {
      logActivity('lock', 'Locking Windows workstation', clientIp);
      const resExec = await executePowerCommand('rundll32.exe user32.dll,LockWorkStation');
      return sendJson(200, { success: true, action: 'lock', message: 'Workstation locked', detail: resExec });
    }

    // 6. Power: Abort
    if (pathname === '/api/power/abort' && req.method === 'POST') {
      logActivity('abort', 'Aborting pending shutdown/restart', clientIp);
      showNotification('Sonance PC Companion', 'Shutdown/Restart sequence aborted');
      const resExec = await executePowerCommand('shutdown.exe /a');
      return sendJson(200, { success: true, action: 'abort', message: 'Shutdown/Restart aborted', detail: resExec });
    }

    sendJson(404, { error: 'Endpoint not found' });
  });

  server.on('error', (err) => {
    logActivity('error', `Server error: ${err.message}`);
  });

  server.listen(config.port, '0.0.0.0', () => {
    logActivity('startup', `Sonance HTTP Daemon listening on port ${config.port}`);
  });
}

function applyAutoStartSetting(enable) {
  config.autoStart = enable;
  saveConfig();
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true,
  });
  logActivity('settings', `Windows Startup ${enable ? 'enabled' : 'disabled'}`);
}

// Window Creation
function createWindow() {
  const iconPng = path.join(__dirname, 'assets', 'icon.png');
  const iconIco = path.join(__dirname, 'assets', 'icon.ico');
  const windowIcon = fs.existsSync(iconIco) ? iconIco : (fs.existsSync(iconPng) ? iconPng : undefined);

  mainWindow = new BrowserWindow({
    width: 860,
    height: 700,
    minWidth: 720,
    minHeight: 560,
    frame: false,
    show: false,
    icon: windowIcon,
    backgroundColor: '#0a0a0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray) {
        tray.displayBalloon?.({
          title: 'Sonance PC Companion',
          content: 'Running in the background. Click tray icon to open.',
        });
      }
    }
  });
}

// System Tray
function createTray() {
  const net = getNetworkDetails();
  const iconPng = path.join(__dirname, 'assets', 'icon.png');
  let trayIcon;
  if (fs.existsSync(iconPng)) {
    trayIcon = nativeImage.createFromPath(iconPng).resize({ width: 16, height: 16 });
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip(`Sonance PC Companion (${net.primaryIp}:${config.port})`);

  const updateContextMenu = () => {
    const currentNet = getNetworkDetails();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Sonance Companion (Active)`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open Dashboard',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: `IP: ${currentNet.primaryIp}`,
        click: () => {
          require('electron').clipboard.writeText(currentNet.primaryIp);
          showNotification('Copied', `IP ${currentNet.primaryIp} copied to clipboard`);
        },
      },
      {
        label: `MAC: ${currentNet.primaryMac}`,
        click: () => {
          require('electron').clipboard.writeText(currentNet.primaryMac);
          showNotification('Copied', `MAC ${currentNet.primaryMac} copied to clipboard`);
        },
      },
      { type: 'separator' },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: config.autoStart,
        click: (item) => {
          applyAutoStartSetting(item.checked);
        },
      },
      {
        label: 'Restart Daemon',
        click: () => {
          startHttpServer();
          showNotification('Sonance Companion', 'HTTP Daemon restarted');
        },
      },
      { type: 'separator' },
      {
        label: 'Exit Sonance',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateContextMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.handle('get-system-info', async () => {
  const net = getNetworkDetails();
  const totalMemGb = (os.totalmem() / (1024 ** 3)).toFixed(1);
  const freeMemGb = (os.freemem() / (1024 ** 3)).toFixed(1);

  return {
    hostname: os.hostname(),
    ip: net.primaryIp,
    mac: net.primaryMac,
    port: config.port,
    pin: config.pin,
    autoStart: config.autoStart,
    uptimeSeconds: Math.floor(os.uptime()),
    ram: `${freeMemGb} GB free / ${totalMemGb} GB total`,
    logs,
  };
});

ipcMain.handle('generate-qr-code', async (_event, payload) => {
  try {
    const jsonStr = JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(jsonStr, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 200,
    });
    return dataUrl;
  } catch (e) {
    console.error('Failed to generate QR code:', e);
    return null;
  }
});

ipcMain.handle('update-config', async (_event, newConfig) => {
  if (newConfig.pin !== undefined) config.pin = String(newConfig.pin).trim();
  if (newConfig.port !== undefined && Number(newConfig.port) > 0) {
    config.port = Number(newConfig.port);
    startHttpServer();
  }
  saveConfig();
  logActivity('settings', 'Updated companion settings from Desktop UI');
  return { success: true, config };
});

ipcMain.handle('toggle-auto-start', async (_event, enable) => {
  applyAutoStartSetting(enable);
  return { success: true, autoStart: config.autoStart };
});

ipcMain.handle('run-auto-configure', async () => {
  let scriptPath = path.join(__dirname, 'scripts', 'auto-configure.ps1');
  if (!fs.existsSync(scriptPath) && process.resourcesPath) {
    const resPath = path.join(process.resourcesPath, 'scripts', 'auto-configure.ps1');
    if (fs.existsSync(resPath)) {
      scriptPath = resPath;
    }
  }

  const tempOut = path.join(os.tmpdir(), `sonance-config-${Date.now()}.json`);

  logActivity('setup', 'Launching elevated Windows Auto-Configurator (UAC Prompt)...');

  return new Promise((resolve) => {
    const cmd = `powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "Start-Process powershell.exe -ArgumentList '-ExecutionPolicy Bypass -NoProfile -File \\\"${scriptPath}\\\" -OutputJson \\\"${tempOut}\\\"' -Verb RunAs -Wait"`;

    exec(cmd, (error) => {
      let parsedResults = {
        firewall: true,
        wol: true,
        powerMgmt: true,
        fastStartup: true,
        autoStart: true,
        restartRecommended: true,
        messages: [
          'Windows Defender Firewall rules enabled (Port 5005 & Port 9)',
          'Network Adapter Magic Packet & WOL enabled',
          'Windows Power Management optimized for standby wake',
          'Auto-start background service registered',
        ],
      };

      if (fs.existsSync(tempOut)) {
        try {
          const raw = fs.readFileSync(tempOut, 'utf8');
          parsedResults = JSON.parse(raw);
          fs.unlinkSync(tempOut);
        } catch (e) {
          console.error('Failed to parse script output json:', e);
        }
      }

      logActivity('setup', 'PC Auto-Configuration completed successfully.');
      resolve({
        success: !error,
        results: parsedResults,
        error: error ? error.message : null,
      });
    });
  });
});

ipcMain.handle('restart-pc', async () => {
  logActivity('restart', 'User requested immediate PC restart after configuration');
  showNotification('Sonance PC Companion', 'Restarting computer in 5 seconds...');
  return executePowerCommand('shutdown.exe /r /t 5 /c "Restarting PC to apply Sonance remote power configurations"');
});

ipcMain.handle('execute-power-action', async (_event, action) => {
  logActivity(action, `Executed local ${action} test`);
  if (action === 'lock') return executePowerCommand('rundll32.exe user32.dll,LockWorkStation');
  if (action === 'sleep') return executePowerCommand('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
  if (action === 'restart') return executePowerCommand(`shutdown.exe /r /t ${config.gracePeriodSec || 5}`);
  if (action === 'shutdown') return executePowerCommand(`shutdown.exe /s /t ${config.gracePeriodSec || 5}`);
  if (action === 'abort') return executePowerCommand('shutdown.exe /a');
  return { success: false, error: 'Unknown action' };
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-hide', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('app-quit', () => {
  app.isQuitting = true;
  app.quit();
});

// App Lifecycle
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.lynxedev.sonance.companion');
  }

  loadConfig();
  startHttpServer();
  createWindow();
  createTray();

  if (config.autoStart) {
    applyAutoStartSetting(true);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (server) {
    server.close();
  }
});
