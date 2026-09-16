import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DeviceConfig, PCStatus } from '../types';
import { Monitor, Plus } from 'lucide-react-native';

interface DeviceCardCarouselProps {
  devices: DeviceConfig[];
  activeDeviceId: string | null;
  statuses: Record<string, PCStatus | null>;
  onSelectDevice: (device: DeviceConfig) => void;
  onAddNewDevice: () => void;
}

export const DeviceCardCarousel: React.FC<DeviceCardCarouselProps> = ({
  devices,
  activeDeviceId,
  statuses,
  onSelectDevice,
  onAddNewDevice,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>YOUR COMPUTERS ({devices.length})</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {devices.map((device) => {
          const isActive = device.id === activeDeviceId;
          const status = statuses[device.id];
          const isOnline = status?.online ?? false;

          return (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.squareCard,
                isActive ? styles.cardActive : styles.cardInactive,
              ]}
              onPress={() => {
                if (!isActive) {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {}
                  onSelectDevice(device);
                }
              }}
              activeOpacity={0.8}
            >
              {/* Top Row: Icon Well & Status Pill */}
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.iconWell,
                    isActive ? styles.iconWellActive : styles.iconWellInactive,
                  ]}
                >
                  <Monitor size={15} color={isActive ? '#000000' : '#ffffff'} />
                </View>

                <View
                  style={[
                    styles.statusPill,
                    isActive ? styles.statusPillActive : styles.statusPillInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isOnline
                          ? isActive
                            ? '#000000'
                            : '#ffffff'
                          : '#52525b',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isActive ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>

              {/* Bottom: Device Name & IP */}
              <View style={styles.cardBottom}>
                <Text
                  style={[
                    styles.deviceName,
                    isActive && styles.deviceNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {device.name}
                </Text>
                <Text
                  style={[
                    styles.deviceIp,
                    isActive && styles.deviceIpActive,
                  ]}
                  numberOfLines={1}
                >
                  {device.ipAddress}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Square + Add PC Card */}
        <TouchableOpacity
          style={styles.addSquareCard}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            onAddNewDevice();
          }}
          activeOpacity={0.75}
        >
          <View style={styles.addIconWell}>
            <Plus size={20} color="#ffffff" />
          </View>
          <Text style={styles.addCardText}>Add PC</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const CARD_SIZE = 126;

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1.1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  squareCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 20,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  cardInactive: {
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWell: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellActive: {
    backgroundColor: '#f4f4f5',
  },
  iconWellInactive: {
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  statusPillInactive: {
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusTextActive: {
    color: '#000000',
  },
  statusTextInactive: {
    color: '#71717a',
  },
  cardBottom: {
    gap: 1.5,
  },
  deviceName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  deviceNameActive: {
    color: '#000000',
  },
  deviceIp: {
    fontSize: 9.5,
    color: '#71717a',
    fontFamily: 'monospace',
  },
  deviceIpActive: {
    color: '#52525b',
  },
  addSquareCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 20,
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  addIconWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4d4d8',
    letterSpacing: 0.3,
  },
});
