import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DeviceConfig } from '../types';
import { saveActiveDevice } from '../services/storageService';
import { PCControlService } from '../services/pcControlService';
import {
  sanitizeMacAddress,
  isValidMacAddress,
  isValidIpv4,
  calculateSubnetBroadcast,
} from '../utils/networkUtils';
import { ArrowLeft, Save, Zap, Radio, Info } from 'lucide-react-native';

interface SettingsScreenProps {
  device: DeviceConfig;
  onSave: (updated: DeviceConfig) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  device,
  onSave,
  onBack,
}) => {
  const [name, setName] = useState(device.name);
  const [ipAddress, setIpAddress] = useState(device.ipAddress);
  const [macAddress, setMacAddress] = useState(device.macAddress);
  const [broadcastAddress, setBroadcastAddress] = useState(device.broadcastAddress);
  const [port, setPort] = useState(device.port.toString());
  const [pin, setPin] = useState(device.pin);

  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingWol, setIsTestingWol] = useState(false);

  const handleAutoFillSubnet = () => {
    if (isValidIpv4(ipAddress)) {
      const calculated = calculateSubnetBroadcast(ipAddress);
      setBroadcastAddress(calculated);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } else {
      Alert.alert('Invalid IP', 'Please enter a valid IPv4 address first (e.g. 192.168.1.100).');
    }
  };

  const handleTestPing = async () => {
    setIsTestingPing(true);
    const testConfig: DeviceConfig = {
      ...device,
      ipAddress: ipAddress.trim(),
      port: parseInt(port, 10) || 5005,
      pin: pin.trim(),
    };

    const status = await PCControlService.checkStatus(testConfig);
    setIsTestingPing(false);

    if (status.online) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert(
        'Connected 🟢',
        `Host: ${status.hostname || 'PC'}\nLatency: ${status.latencyMs}ms\nUptime: ${status.uptimeHours || 'N/A'}`
      );
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert(
        'Offline 🔴',
        `Could not connect to ${testConfig.ipAddress}:${testConfig.port}.\nCheck if Companion Agent is running on PC.`
      );
    }
  };

  const handleTestWol = async () => {
    const formattedMac = sanitizeMacAddress(macAddress);
    if (!isValidMacAddress(formattedMac)) {
      Alert.alert('Invalid MAC', 'Enter a valid 12-character MAC address (e.g. 9C:6B:00:E2:9C:24).');
      return;
    }

    setIsTestingWol(true);
    const testConfig: DeviceConfig = {
      ...device,
      macAddress: formattedMac,
      broadcastAddress: broadcastAddress.trim() || '255.255.255.255',
    };

    const result = await PCControlService.wakePC(testConfig);
    setIsTestingWol(false);

    if (result.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('WOL Sent ⚡', `Packet sent to ${testConfig.macAddress} on ${testConfig.broadcastAddress}:9.`);
    } else {
      Alert.alert('WOL Failed', result.error || 'Failed to send packet.');
    }
  };

  const handleSave = async () => {
    const formattedMac = sanitizeMacAddress(macAddress);
    const portNumber = parseInt(port, 10) || 5005;

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a device name.');
      return;
    }

    if (!isValidIpv4(ipAddress.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid IPv4 address.');
      return;
    }

    if (!isValidMacAddress(formattedMac)) {
      Alert.alert('Validation Error', 'Please enter a valid 12-character MAC address.');
      return;
    }

    const updated: DeviceConfig = {
      ...device,
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      macAddress: formattedMac,
      broadcastAddress: broadcastAddress.trim() || calculateSubnetBroadcast(ipAddress),
      port: portNumber,
      pin: pin.trim(),
    };

    await saveActiveDevice(updated);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onSave(updated);
    onBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={16} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Save size={14} color="#000000" />
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Profile Fields */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>DEVICE CONFIGURATION</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device Nickname</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. My PC"
              placeholderTextColor="#52525b"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PC Local IP</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="192.168.1.100"
              placeholderTextColor="#52525b"
              autoCapitalize="none"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MAC Address (for Wake-on-LAN)</Text>
            <TextInput
              style={styles.input}
              value={macAddress}
              onChangeText={(text) => setMacAddress(sanitizeMacAddress(text))}
              placeholder="9C:6B:00:E2:9C:24"
              placeholderTextColor="#52525b"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Broadcast Address</Text>
              <TouchableOpacity onPress={handleAutoFillSubnet}>
                <Text style={styles.autoActionText}>Auto-Fill</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={broadcastAddress}
              onChangeText={setBroadcastAddress}
              placeholder="192.168.1.255"
              placeholderTextColor="#52525b"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Port</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="5005"
                placeholderTextColor="#52525b"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>PIN</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="1234"
                placeholderTextColor="#52525b"
                secureTextEntry={false}
              />
            </View>
          </View>
        </View>

        {/* Diagnostics Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>CONNECTION TEST</Text>

          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestPing}
              disabled={isTestingPing}
              activeOpacity={0.7}
            >
              {isTestingPing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Zap size={14} color="#ffffff" />
                  <Text style={styles.testBtnText}>Test Agent Connection</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestWol}
              disabled={isTestingWol}
              activeOpacity={0.7}
            >
              {isTestingWol ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Radio size={14} color="#ffffff" />
                  <Text style={styles.testBtnText}>Test Wake Packet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Info Box */}
        <View style={styles.infoBox}>
          <Info size={14} color="#a1a1aa" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoText}>
              Run <Text style={styles.codeText}>server/install-startup.bat</Text> on your Windows machine to start the background agent.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  saveHeaderText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    backgroundColor: '#0d0d10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    gap: 10,
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 0.8,
  },
  inputGroup: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  autoActionText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  testButtonsRow: {
    gap: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#0d0d10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 16,
  },
  codeText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
