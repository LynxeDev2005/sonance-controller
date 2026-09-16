import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DeviceConfig } from './src/types';
import {
  getActiveDevice,
  getAllDevices,
  saveActiveDevice,
  DEFAULT_DEVICE,
} from './src/services/storageService';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SiriGuideScreen } from './src/screens/SiriGuideScreen';

type ScreenType = 'dashboard' | 'settings' | 'siri_guide';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [activeDevice, setActiveDevice] = useState<DeviceConfig | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const storedAll = await getAllDevices();
        const storedActive = await getActiveDevice();
        setDevices(storedAll);
        if (storedAll.length > 0) {
          setActiveDevice(storedActive && storedAll.some(d => d.id === storedActive.id) ? storedActive : storedAll[0]);
        } else {
          setActiveDevice(null);
        }
      } catch (e) {
        console.error('Failed to load device config:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSelectActiveDevice = async (dev: DeviceConfig) => {
    setActiveDevice(dev);
    await saveActiveDevice(dev);
  };

  const handleUpdateDevicesList = (
    updatedList: DeviceConfig[],
    newActive: DeviceConfig | null
  ) => {
    setDevices(updatedList);
    if (updatedList.length === 0) {
      setActiveDevice(null);
      saveActiveDevice(null);
    } else {
      const active = newActive && updatedList.some(d => d.id === newActive.id) ? newActive : updatedList[0];
      setActiveDevice(active);
      saveActiveDevice(active);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'dashboard' && (
        <DashboardScreen
          device={activeDevice}
          devices={devices}
          onSelectDevice={handleSelectActiveDevice}
          onAddNewDevice={() => {
            setIsAddingNew(true);
            setCurrentScreen('settings');
          }}
          onOpenSettings={() => {
            setIsAddingNew(false);
            setCurrentScreen('settings');
          }}
          onOpenSiriGuide={() => setCurrentScreen('siri_guide')}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          devices={devices}
          activeDevice={activeDevice}
          initialNew={isAddingNew}
          onUpdateDevices={handleUpdateDevicesList}
          onBack={() => {
            setIsAddingNew(false);
            setCurrentScreen('dashboard');
          }}
        />
      )}

      {currentScreen === 'siri_guide' && (
        <SiriGuideScreen onBack={() => setCurrentScreen('dashboard')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
