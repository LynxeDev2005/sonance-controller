import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceConfig } from '../types';

const STORAGE_KEY_ACTIVE_DEVICE = '@pc_control_active_device';
const STORAGE_KEY_ALL_DEVICES = '@pc_control_all_devices';

export const DEFAULT_DEVICE: DeviceConfig = {
  id: 'default-pc',
  name: 'My Gaming PC',
  ipAddress: '192.168.100.3',
  macAddress: '9C:6B:00:E2:9C:24',
  broadcastAddress: '192.168.100.255',
  port: 5005,
  pin: '1234',
  isDefault: true,
  createdAt: Date.now(),
};

export async function getActiveDevice(): Promise<DeviceConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_DEVICE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Storage] Error loading active device:', e);
  }
  return DEFAULT_DEVICE;
}

export async function saveActiveDevice(device: DeviceConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_DEVICE, JSON.stringify(device));
  } catch (e) {
    console.error('[Storage] Error saving active device:', e);
  }
}

export async function getAllDevices(): Promise<DeviceConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ALL_DEVICES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Storage] Error loading all devices:', e);
  }
  return [DEFAULT_DEVICE];
}

export async function saveAllDevices(devices: DeviceConfig[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ALL_DEVICES, JSON.stringify(devices));
  } catch (e) {
    console.error('[Storage] Error saving all devices:', e);
  }
}
