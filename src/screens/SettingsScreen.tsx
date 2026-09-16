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
import { saveActiveDevice, saveAllDevices } from '../services/storageService';
import { PCControlService } from '../services/pcControlService';
import {
  sanitizeMacAddress,
  isValidMacAddress,
  isValidIpv4,
  calculateSubnetBroadcast,
} from '../utils/networkUtils';
import {
  ArrowLeft,
  Save,
  Zap,
  Radio,
  Plus,
  Trash2,
  Check,
  Monitor,
} from 'lucide-react-native';

interface SettingsScreenProps {
  devices: DeviceConfig[];
  activeDevice: DeviceConfig;
  onUpdateDevices: (devices: DeviceConfig[], active: DeviceConfig) => void;
  onBack: () => void;
  initialNew?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  devices,
  activeDevice,
  onUpdateDevices,
  onBack,
  initialNew = false,
}) => {
  const [selectedId, setSelectedId] = useState(
    initialNew ? 'new' : activeDevice.id
  );

  const [name, setName] = useState(initialNew ? 'New PC' : activeDevice.name);
  const [ipAddress, setIpAddress] = useState(
    initialNew ? '192.168.1.100' : activeDevice.ipAddress
  );
  const [macAddress, setMacAddress] = useState(
    initialNew ? '' : activeDevice.macAddress
  );
  const [broadcastAddress, setBroadcastAddress] = useState(
    initialNew ? '192.168.1.255' : activeDevice.broadcastAddress
  );
  const [port, setPort] = useState(
    initialNew ? '5005' : activeDevice.port.toString()
  );
  const [pin, setPin] = useState(initialNew ? '1234' : activeDevice.pin);

  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingWol, setIsTestingWol] = useState(false);

  const handleSelectDeviceToEdit = (dev: DeviceConfig) => {
    setSelectedId(dev.id);
    setName(dev.name);
    setIpAddress(dev.ipAddress);
    setMacAddress(dev.macAddress);
    setBroadcastAddress(dev.broadcastAddress);
    setPort(dev.port.toString());
    setPin(dev.pin);
  };

  const handleAddNewDeviceForm = () => {
    const newId = `pc-${Date.now()}`;
    setSelectedId(newId);
    setName(`PC #${devices.length + 1}`);
    setIpAddress('192.168.1.100');
    setMacAddress('');
    setBroadcastAddress('192.168.1.255');
    setPort('5005');
    setPin('1234');
  };

  const handleDeleteDevice = (idToDelete: string) => {
    if (devices.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one PC configured.');
      return;
    }

    Alert.alert('Delete PC', 'Are you sure you want to remove this PC profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const filtered = devices.filter((d) => d.id !== idToDelete);
          const newActive =
            activeDevice.id === idToDelete ? filtered[0] : activeDevice;
          await saveAllDevices(filtered);
          await saveActiveDevice(newActive);
          onUpdateDevices(filtered, newActive);
          handleSelectDeviceToEdit(newActive);
        },
      },
    ]);
  };

  const handleAutoFillSubnet = () => {
    if (isValidIpv4(ipAddress)) {
      const calculated = calculateSubnetBroadcast(ipAddress);
      setBroadcastAddress(calculated);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } else {
      Alert.alert('Invalid IP', 'Enter a valid IPv4 address first (e.g. 192.168.1.100).');
    }
  };

  const handleTestPing = async () => {
    setIsTestingPing(true);
    const testConfig: DeviceConfig = {
      id: selectedId,
      name,
      ipAddress: ipAddress.trim(),
      macAddress: macAddress.trim(),
      broadcastAddress: broadcastAddress.trim(),
      port: parseInt(port, 10) || 5005,
      pin: pin.trim(),
      createdAt: Date.now(),
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
      id: selectedId,
      name,
      ipAddress: ipAddress.trim(),
      macAddress: formattedMac,
      broadcastAddress: broadcastAddress.trim() || '255.255.255.255',
      port: parseInt(port, 10) || 5005,
      pin: pin.trim(),
      createdAt: Date.now(),
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
      Alert.alert('Validation Error', 'Please enter a device nickname.');
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

    const updatedDevice: DeviceConfig = {
      id: selectedId === 'new' ? `pc-${Date.now()}` : selectedId,
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      macAddress: formattedMac,
      broadcastAddress:
        broadcastAddress.trim() || calculateSubnetBroadcast(ipAddress),
      port: portNumber,
      pin: pin.trim(),
      createdAt: Date.now(),
    };

    let updatedList: DeviceConfig[] = [];
    const existingIndex = devices.findIndex((d) => d.id === updatedDevice.id);

    if (existingIndex >= 0) {
      updatedList = [...devices];
      updatedList[existingIndex] = updatedDevice;
    } else {
      updatedList = [...devices, updatedDevice];
    }

    await saveAllDevices(updatedList);
    await saveActiveDevice(updatedDevice);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    onUpdateDevices(updatedList, updatedDevice);
    onBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={16} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE PCS</Text>
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
        {/* PC Profiles Tabs */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardSectionTitle}>SAVED COMPUTERS</Text>
            <TouchableOpacity
              style={styles.addMiniBtn}
              onPress={handleAddNewDeviceForm}
            >
              <Plus size={13} color="#ffffff" />
              <Text style={styles.addMiniText}>Add PC</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pcTabsContainer}
          >
            {devices.map((d) => {
              const isEditing = d.id === selectedId;
              const isActive = d.id === activeDevice.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.pcTab,
                    isEditing && styles.pcTabEditing,
                    isActive && styles.pcTabActive,
                  ]}
                  onPress={() => handleSelectDeviceToEdit(d)}
                  activeOpacity={0.7}
                >
                  <Monitor
                    size={14}
                    color={isEditing || isActive ? '#000000' : '#ffffff'}
                  />
                  <Text
                    style={[
                      styles.pcTabText,
                      (isEditing || isActive) && styles.pcTabTextActive,
                    ]}
                  >
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Device Profile Fields */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardSectionTitle}>CONFIGURATION</Text>
            {devices.length > 1 && selectedId !== 'new' && (
              <TouchableOpacity
                onPress={() => handleDeleteDevice(selectedId)}
                style={styles.deleteBtn}
              >
                <Trash2 size={13} color="#71717a" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PC Nickname</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Gaming Rig, Office PC"
              placeholderTextColor="#52525b"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PC Local IPv4 Address</Text>
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
            <Text style={styles.label}>NIC MAC Address (for Wake-on-LAN)</Text>
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

        {/* Connection Diagnostics */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>VERIFICATION</Text>

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
                  <Text style={styles.testBtnText}>Test Connection</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0d',
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
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  card: {
    backgroundColor: '#15151a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0c0c0f',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addMiniText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  pcTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  pcTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  pcTabEditing: {
    borderColor: '#ffffff',
  },
  pcTabActive: {
    backgroundColor: '#ffffff',
  },
  pcTabText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pcTabTextActive: {
    color: '#000000',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
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
    gap: 6,
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
