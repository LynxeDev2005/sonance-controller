import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DeviceConfig } from './src/types';
import { getActiveDevice, DEFAULT_DEVICE } from './src/services/storageService';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SiriGuideScreen } from './src/screens/SiriGuideScreen';

type ScreenType = 'dashboard' | 'settings' | 'siri_guide';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [device, setDevice] = useState<DeviceConfig>(DEFAULT_DEVICE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const stored = await getActiveDevice();
        setDevice(stored);
      } catch (e) {
        console.error('Failed to load device config:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'dashboard' && (
        <DashboardScreen
          device={device}
          onOpenSettings={() => setCurrentScreen('settings')}
          onOpenSiriGuide={() => setCurrentScreen('siri_guide')}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          device={device}
          onSave={(updated) => setDevice(updated)}
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'siri_guide' && (
        <SiriGuideScreen
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
