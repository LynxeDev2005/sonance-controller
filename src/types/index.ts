export interface DeviceConfig {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  broadcastAddress: string;
  port: number;
  pin: string;
  isDefault?: boolean;
  createdAt: number;
}

export interface PCStatus {
  online: boolean;
  hostname?: string;
  platform?: string;
  arch?: string;
  uptimeHours?: string;
  memory?: {
    total: string;
    free: string;
  };
  authorized?: boolean;
  latencyMs?: number;
  lastChecked?: number;
  error?: string;
}

export type PowerAction = 'wake' | 'shutdown' | 'restart' | 'sleep' | 'lock' | 'abort';

export interface CommandExecutionResult {
  success: boolean;
  action: PowerAction;
  message: string;
  error?: string;
  detail?: any;
}

export interface VoiceIntentMatch {
  action: PowerAction | 'status' | 'unknown';
  confidence: number;
  spokenText: string;
  description: string;
}
