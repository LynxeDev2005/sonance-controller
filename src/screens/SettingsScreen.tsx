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
        'Connection Successful! 🟢',
        `Connected to ${status.hostname || 'PC'} in ${status.latencyMs}ms.\nOS: ${status.platform || 'Windows'}\nUptime: ${status.uptimeHours || 'N/A'}`
      );
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert(
        'Connection Failed 🔴',
        `Could not connect to ${testConfig.ipAddress}:${testConfig.port}.\n\nEnsure:\n1. PC is powered on\n2. "node server/agent.js" is running\n3. Phone is connected to the same Wi-Fi network.`
      );
    }
  };

  const handleTestWol = async () => {
    const formattedMac = sanitizeMacAddress(macAddress);
    if (!isValidMacAddress(formattedMac)) {
      Alert.alert('Invalid MAC', 'Please enter a valid 12-character MAC address (e.g. 9C:6B:00:E2:9C:24).');
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
      Alert.alert('WOL Packet Sent ⚡', `Magic packet broadcasted to ${testConfig.macAddress} on ${testConfig.broadcastAddress}:9.`);
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
          <ArrowLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Configuration</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Save size={18} color="#38bdf8" />
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
          <Text style={styles.cardSectionTitle}>TARGET PC DETAILS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device Label / Nickname</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. My Gaming PC"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PC Local IPv4 Address</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="192.168.1.100"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NIC MAC Address (for Wake-on-LAN)</Text>
            <TextInput
              style={styles.input}
              value={macAddress}
              onChangeText={(text) => setMacAddress(sanitizeMacAddress(text))}
              placeholder="9C:6B:00:E2:9C:24"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Subnet Broadcast Address</Text>
              <TouchableOpacity onPress={handleAutoFillSubnet}>
                <Text style={styles.autoActionText}>Auto-Calculate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={broadcastAddress}
              onChangeText={setBroadcastAddress}
              placeholder="192.168.1.255 or 255.255.255.255"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Agent Port</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="5005"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Security PIN</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="1234"
                placeholderTextColor="#64748b"
                secureTextEntry={false}
              />
            </View>
          </View>
        </View>

        {/* Diagnostics & Test Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>DIAGNOSTICS & VERIFICATION</Text>

          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestPing}
              disabled={isTestingPing}
              activeOpacity={0.7}
            >
              {isTestingPing ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <>
                  <Zap size={16} color="#38bdf8" />
                  <Text style={styles.testBtnText}>Test Agent Connection</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, styles.testBtnWol]}
              onPress={handleTestWol}
              disabled={isTestingWol}
              activeOpacity={0.7}
            >
              {isTestingWol ? (
                <ActivityIndicator size="small" color="#4ade80" />
              ) : (
                <>
                  <Radio size={16} color="#4ade80" />
                  <Text style={[styles.testBtnText, { color: '#4ade80' }]}>
                    Test Wake Packet
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info / Guide Box */}
        <View style={styles.infoBox}>
          <Info size={18} color="#38bdf8" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>How to find your PC details:</Text>
            <Text style={styles.infoText}>
              1. Open a terminal on your PC and run: <Text style={styles.codeText}>node server/agent.js</Text>
              {'\n'}2. The agent will display your exact IP & MAC addresses on the screen!
              {'\n'}3. Double-click <Text style={styles.codeText}>server/install-startup.bat</Text> so the agent runs automatically whenever Windows starts.
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
    backgroundColor: '#0b0f19',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  saveHeaderText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#131927',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    gap: 14,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  autoActionText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0b0f19',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  testButtonsRow: {
    gap: 10,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  testBtnWol: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  testBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  codeText: {
    color: '#f1f5f9',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
