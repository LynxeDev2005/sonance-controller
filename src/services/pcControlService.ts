import { DeviceConfig, PCStatus, PowerAction, CommandExecutionResult } from '../types';
import { sendWakeOnLan, donateSiriShortcut } from '../../modules/pc-control-native/src';

export class PCControlService {
  /**
   * Broadcasts a Wake-on-LAN Magic Packet via native Swift UDP socket.
   */
  static async wakePC(device: DeviceConfig): Promise<CommandExecutionResult> {
    try {
      const broadcast = device.broadcastAddress || '255.255.255.255';
      const result = await sendWakeOnLan(device.macAddress, broadcast, 9);

      // Register Siri activity
      try {
        await donateSiriShortcut('wake', `Turn On ${device.name}`, `Turn on ${device.name}`);
      } catch (e) {
        // Siri donation non-blocking
      }

      if (result.success) {
        return {
          success: true,
          action: 'wake',
          message: `Magic packet sent to ${device.macAddress} via ${broadcast}:9`,
          detail: result,
        };
      } else {
        return {
          success: false,
          action: 'wake',
          message: result.error || 'Failed to send Wake-on-LAN packet',
          error: result.error,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'wake',
        message: error.message || 'Error executing Wake-on-LAN',
        error: error.message,
      };
    }
  }

  /**
   * Executes power action (Shutdown, Restart, Sleep, Lock, Abort) via Windows Companion Agent API.
   */
  static async executePowerAction(
    device: DeviceConfig,
    action: PowerAction
  ): Promise<CommandExecutionResult> {
    if (action === 'wake') {
      return this.wakePC(device);
    }

    const endpoint = `http://${device.ipAddress}:${device.port}/api/power/${action}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': device.pin || '',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        // Donate Siri shortcut for this action
        try {
          const actionTitles: Record<string, string> = {
            shutdown: `Shutdown ${device.name}`,
            restart: `Restart ${device.name}`,
            sleep: `Sleep ${device.name}`,
            lock: `Lock ${device.name}`,
          };
          if (actionTitles[action]) {
            await donateSiriShortcut(action as any, actionTitles[action], `${action} ${device.name}`);
          }
        } catch {}

        return {
          success: true,
          action,
          message: data.message || `Successfully executed ${action}`,
          detail: data,
        };
      } else {
        return {
          success: false,
          action,
          message: data.error || `Server returned error (${response.status})`,
          error: data.error,
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      let errorMsg = error.message;
      if (error.name === 'AbortError') {
        errorMsg = 'Connection timed out. Ensure PC is powered on and Companion Agent is running.';
      } else if (error.message && error.message.includes('Network request failed')) {
        errorMsg = `Could not reach ${device.ipAddress}:${device.port}. Check if PC is online & on same Wi-Fi.`;
      }
      return {
        success: false,
        action,
        message: errorMsg,
        error: errorMsg,
      };
    }
  }

  /**
   * Checks real-time status of the Windows PC Companion Agent.
   */
  static async checkStatus(device: DeviceConfig): Promise<PCStatus> {
    const startTime = Date.now();
    const endpoint = `http://${device.ipAddress}:${device.port}/api/status`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-auth-token': device.pin || '',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          online: true,
          hostname: data.hostname,
          platform: data.platform,
          arch: data.arch,
          uptimeHours: data.uptimeHours,
          memory: data.memory,
          authorized: data.authorized,
          latencyMs,
          lastChecked: Date.now(),
        };
      } else {
        return {
          online: false,
          latencyMs,
          lastChecked: Date.now(),
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      return {
        online: false,
        lastChecked: Date.now(),
        error: error.name === 'AbortError' ? 'Timeout' : 'Offline',
      };
    }
  }
}
