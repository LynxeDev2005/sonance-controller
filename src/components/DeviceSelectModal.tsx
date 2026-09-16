import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DeviceConfig } from '../types';
import { Monitor, Plus, Check, X, QrCode } from 'lucide-react-native';

interface DeviceSelectModalProps {
  visible: boolean;
  devices: DeviceConfig[];
  activeDeviceId: string;
  onSelectDevice: (device: DeviceConfig) => void;
  onAddNewDevice: () => void;
  onScanQR?: () => void;
  onClose: () => void;
}

export const DeviceSelectModal: React.FC<DeviceSelectModalProps> = ({
  visible,
  devices,
  activeDeviceId,
  onSelectDevice,
  onAddNewDevice,
  onScanQR,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>SELECT TARGET PC</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.devicesList} showsVerticalScrollIndicator={false}>
            {devices.map((dev) => {
              const isSelected = dev.id === activeDeviceId;
              return (
                <TouchableOpacity
                  key={dev.id}
                  style={[
                    styles.deviceItem,
                    isSelected && styles.deviceItemSelected,
                  ]}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch {}
                    onSelectDevice(dev);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceItemLeft}>
                    <View
                      style={[
                        styles.deviceIconBadge,
                        isSelected && styles.deviceIconBadgeSelected,
                      ]}
                    >
                      <Monitor size={16} color={isSelected ? '#000000' : '#ffffff'} />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.deviceName,
                          isSelected && styles.deviceNameSelected,
                        ]}
                      >
                        {dev.name}
                      </Text>
                      <Text style={styles.deviceSubtitle}>
                        {dev.ipAddress} &middot; {dev.macAddress}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={14} color="#000000" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalButtonsRow}>
            {onScanQR && (
              <TouchableOpacity
                style={styles.scanQrBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onClose();
                  onScanQR();
                }}
                activeOpacity={0.75}
              >
                <QrCode size={14} color="#ffffff" />
                <Text style={styles.scanQrBtnText}>Scan QR</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.addBtn, onScanQR && { flex: 1, marginTop: 0 }]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
                onAddNewDevice();
              }}
              activeOpacity={0.75}
            >
              <Plus size={15} color="#000000" />
              <Text style={styles.addBtnText}>Add PC</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#09090b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
  },
  devicesList: {
    maxHeight: 280,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  deviceItemSelected: {
    backgroundColor: '#18181c',
    borderColor: '#ffffff',
  },
  deviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deviceIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconBadgeSelected: {
    backgroundColor: '#ffffff',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  deviceNameSelected: {
    color: '#ffffff',
  },
  deviceSubtitle: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  scanQrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  scanQrBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});
