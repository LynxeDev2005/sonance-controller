import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceConfig } from '../types';

const STORAGE_KEY_ACTIVE_DEVICE = '@pc_control_active_device';
const STORAGE_KEY_ALL_DEVICES = '@pc_control_all_devices';

export const DEFAULT_DEVICE: DeviceConfig = {
  id: 'default-pc',
  name: 'PC',
  ipAddress: '192.168.1.50',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  broadcastAddress: '192.168.1.255',
  port: 5005,
  pin: '',
  isDefault: true,
  createdAt: Date.now(),
};

export async function getActiveDevice(): Promise<DeviceConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_DEVICE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Storage] Error loading active device:', e);
  }
  return null;
}

export async function saveActiveDevice(device: DeviceConfig | null): Promise<void> {
  try {
    if (device) {
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_DEVICE, JSON.stringify(device));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_DEVICE);
    }
  } catch (e) {
    console.error('[Storage] Error saving active device:', e);
  }
}

export async function getAllDevices(): Promise<DeviceConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ALL_DEVICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Storage] Error loading all devices:', e);
  }
  return [];
}

export async function saveAllDevices(devices: DeviceConfig[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ALL_DEVICES, JSON.stringify(devices));
  } catch (e) {
    console.error('[Storage] Error saving all devices:', e);
  }
}
