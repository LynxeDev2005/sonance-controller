import { requireNativeModule } from 'expo-modules-core';

export interface WakeOnLanResult {
  success: boolean;
  mac: string;
  broadcast?: string;
  port?: number;
  message?: string;
  error?: string;
}

export interface PingResult {
  host: string;
  port: number;
  online: boolean;
}

export interface SiriShortcutResult {
  success: boolean;
  phrase: string;
}

// Fallback / mock implementation if running in Expo Go or Web environment
let NativeModule: any;
try {
  NativeModule = requireNativeModule('PcControlNative');
} catch (e) {
  console.warn('[PcControlNative] Native module not loaded, using fallback/simulation mode.');
  NativeModule = {
    async sendWakeOnLan(mac: string, broadcast?: string, port?: number): Promise<WakeOnLanResult> {
      console.log(`[WOL Simulation] Sending packet to ${mac} via ${broadcast || '255.255.255.255'}:${port || 9}`);
      return {
        success: true,
        mac,
        broadcast: broadcast || '255.255.255.255',
        port: port || 9,
        message: 'Simulation: Packet sent (native module required for real UDP broadcast)',
      };
    },
    async pingHost(host: string, port: number, timeoutMs?: number): Promise<PingResult> {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 1500);
        const res = await fetch(`http://${host}:${port}/api/status`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return { host, port, online: res.ok };
      } catch {
        return { host, port, online: false };
      }
    },
    async donateSiriShortcut(actionType: string, title: string, phrase: string): Promise<SiriShortcutResult> {
      return { success: true, phrase };
    },
  };
}

export async function sendWakeOnLan(
  macAddress: string,
  broadcastAddress: string = '255.255.255.255',
  port: number = 9
): Promise<WakeOnLanResult> {
  return await NativeModule.sendWakeOnLan(macAddress, broadcastAddress, port);
}

export async function pingHost(
  host: string,
  port: number,
  timeoutMs: number = 1500
): Promise<PingResult> {
  return await NativeModule.pingHost(host, port, timeoutMs);
}

export async function donateSiriShortcut(
  actionType: 'wake' | 'shutdown' | 'restart' | 'sleep' | 'lock',
  title: string,
  phrase: string
): Promise<SiriShortcutResult> {
  return await NativeModule.donateSiriShortcut(actionType, title, phrase);
}

export default {
  sendWakeOnLan,
  pingHost,
  donateSiriShortcut,
};
