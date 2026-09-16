document.addEventListener('DOMContentLoaded', async () => {
  const hostnameEl = document.getElementById('hostname-display');
  const portEl = document.getElementById('port-display');
  const ipEl = document.getElementById('ip-display');
  const macEl = document.getElementById('mac-display');
  const pinInput = document.getElementById('pin-input');
  const ramEl = document.getElementById('ram-display');
  const qrImg = document.getElementById('qr-image');
  const autostartToggle = document.getElementById('autostart-toggle');
  const logsContainer = document.getElementById('logs-container');

  // Titlebar buttons
  document.getElementById('btn-minimize').addEventListener('click', () => {
    window.sonanceAPI.minimizeWindow();
  });

  document.getElementById('btn-close').addEventListener('click', () => {
    window.sonanceAPI.hideToTray();
  });

  // Load and populate system info
  async function loadSystemData() {
    try {
      const data = await window.sonanceAPI.getSystemInfo();
      if (!data) return;

      hostnameEl.textContent = data.hostname;
      portEl.textContent = `PORT ${data.port}`;
      ipEl.textContent = data.ip;
      macEl.textContent = data.mac;
      pinInput.value = data.pin;
      ramEl.textContent = data.ram;
      autostartToggle.checked = data.autoStart;

      // Generate Pairing Payload for QR
      const pairingPayload = {
        name: data.hostname,
        ipAddress: data.ip,
        macAddress: data.mac,
        port: data.port,
        pin: data.pin,
      };

      const qrDataUrl = await window.sonanceAPI.generateQrCode(pairingPayload);
      if (qrDataUrl) {
        qrImg.src = qrDataUrl;
      }

      // Populate existing logs
      if (data.logs && data.logs.length > 0) {
        logsContainer.innerHTML = '';
        data.logs.forEach(addLogEntry);
      }
    } catch (e) {
      console.error('Failed to load system info:', e);
    }
  }

  // Copy Buttons
  document.getElementById('btn-copy-ip').addEventListener('click', () => {
    window.sonanceAPI.copyToClipboard(ipEl.textContent);
    const btn = document.getElementById('btn-copy-ip');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });

  document.getElementById('btn-copy-mac').addEventListener('click', () => {
    window.sonanceAPI.copyToClipboard(macEl.textContent);
    const btn = document.getElementById('btn-copy-mac');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });

  // Save PIN
  document.getElementById('btn-save-pin').addEventListener('click', async () => {
    const newPin = pinInput.value.trim();
    await window.sonanceAPI.updateConfig({ pin: newPin });
    const btn = document.getElementById('btn-save-pin');
    btn.textContent = 'Saved!';
    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
    loadSystemData();
  });

  // Autostart Toggle
  autostartToggle.addEventListener('change', async (e) => {
    await window.sonanceAPI.toggleAutoStart(e.target.checked);
  });

  // Power action test buttons
  document.querySelectorAll('.test-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      if (action === 'shutdown' || action === 'restart') {
        if (!confirm(`Are you sure you want to test ${action.toUpperCase()} on this computer?`)) {
          return;
        }
      }
      await window.sonanceAPI.executePowerAction(action);
    });
  });

  // Clear Logs
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    logsContainer.innerHTML = '<div class="log-entry system"><span class="log-time">[Clear]</span><span class="log-msg">Logs cleared.</span></div>';
  });

  // Real-time Log Stream
  function addLogEntry(item) {
    const row = document.createElement('div');
    row.className = `log-entry ${item.type || 'info'}`;
    row.innerHTML = `
      <span class="log-time">[${item.time}]</span>
      <span class="log-msg">${item.message} (${item.clientIp || 'local'})</span>
    `;
    logsContainer.prepend(row);
  }

  window.sonanceAPI.onLog((item) => {
    addLogEntry(item);
  });

  loadSystemData();
});
