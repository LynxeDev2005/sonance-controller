import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DeviceConfig, PCStatus, PowerAction } from '../types';
import { PCControlService } from '../services/pcControlService';
import { ActionCard } from '../components/ActionCard';
import { VoiceModal } from '../components/VoiceModal';
import { DeviceCardCarousel } from '../components/DeviceCardCarousel';
import { QRScannerModal } from '../components/QRScannerModal';
import {
  Mic,
  CheckCircle2,
  AlertCircle,
  Sliders,
  BookOpen,
  QrCode,
  Plus,
  Monitor,
} from 'lucide-react-native';

interface DashboardScreenProps {
  device: DeviceConfig | null;
  devices: DeviceConfig[];
  onSelectDevice: (device: DeviceConfig) => void;
  onAddNewDevice: () => void;
  onOpenSettings: () => void;
  onOpenSiriGuide: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  device,
  devices,
  onSelectDevice,
  onAddNewDevice,
  onOpenSettings,
  onOpenSiriGuide,
}) => {
  const [statuses, setStatuses] = useState<Record<string, PCStatus | null>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeActionLoading, setActiveActionLoading] = useState<PowerAction | null>(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [lastNotification, setLastNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const refreshAllStatuses = useCallback(async () => {
    if (devices.length === 0) return;
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled(
        devices.map(async (d) => {
          try {
            const res = await PCControlService.checkStatus(d);
            return { id: d.id, status: res };
          } catch {
            return { id: d.id, status: { online: false, lastChecked: Date.now() } };
          }
        })
      );

      const newStatuses: Record<string, PCStatus | null> = {};
      results.forEach((r, idx) => {
        const dev = devices[idx];
        if (r.status === 'fulfilled' && r.value) {
          newStatuses[r.value.id] = r.value.status;
        } else {
          newStatuses[dev.id] = { online: false, lastChecked: Date.now() };
        }
      });
      setStatuses(newStatuses);
    } finally {
      setIsRefreshing(false);
    }
  }, [devices]);

  useEffect(() => {
    refreshAllStatuses();
    const interval = setInterval(refreshAllStatuses, 8000);
    return () => clearInterval(interval);
  }, [refreshAllStatuses]);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setLastNotification({ type, message });
    setTimeout(() => {
      setLastNotification(null);
    }, 4000);
  };

  const handleExecuteAction = async (action: PowerAction) => {
    if (!device) {
      showBanner('error', 'No PC selected. Please add or select a PC first.');
      return;
    }
    setActiveActionLoading(action);
    try {
      const result = await PCControlService.executePowerAction(device, action);

      if (result.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        showBanner('success', result.message);
        setTimeout(refreshAllStatuses, 1500);
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        showBanner('error', result.message);
      }
    } catch (error: any) {
      showBanner('error', error.message || 'Execution error');
    } finally {
      setActiveActionLoading(null);
    }
  };

  const handleQrScanSuccess = (newDevice: DeviceConfig) => {
    onSelectDevice(newDevice);
    showBanner('success', `Added "${newDevice.name}" (${newDevice.ipAddress})`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Clean Neumorphic Top Header */}
      <View style={styles.headerBar}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/sonance-logo-white.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appSubtitle}>YOUR PC COMPANION</Text>
        </View>

        <TouchableOpacity
          style={styles.voiceTriggerHeader}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            setVoiceModalVisible(true);
          }}
          activeOpacity={0.75}
        >
          <Mic size={14} color="#000000" />
          <Text style={styles.voiceTriggerText}>Voice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontal Square Device Card Deck with Add Button */}
        {devices.length > 0 && device && (
          <DeviceCardCarousel
            devices={devices}
            activeDeviceId={device.id}
            statuses={statuses}
            onSelectDevice={onSelectDevice}
            onAddNewDevice={onAddNewDevice}
          />
        )}

        {/* Feedback Banner */}
        {lastNotification && (
          <View style={styles.feedbackBanner}>
            {lastNotification.type === 'success' ? (
              <CheckCircle2 size={14} color="#ffffff" />
            ) : (
              <AlertCircle size={14} color="#a1a1aa" />
            )}
            <Text style={styles.bannerText}>
              {lastNotification.message}
            </Text>
          </View>
        )}

        {/* Empty State when no PC configured */}
        {!device || devices.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWell}>
              <Monitor size={32} color="#ffffff" />
            </View>
            <Text style={styles.emptyTitle}>NO PC CONNECTED YET</Text>
            <Text style={styles.emptyDesc}>
              Pair your Windows computer instantly by scanning the QR code in the Sonance PC Companion desktop app, or add your device manually.
            </Text>

            <TouchableOpacity
              style={styles.emptyScanBtn}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                setQrModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <QrCode size={18} color="#000000" />
              <Text style={styles.emptyScanBtnText}>Scan PC Companion QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onAddNewDevice();
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.emptyAddBtnText}>Add PC Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Neumorphic Power Actions List */
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>COMMANDS &middot; {device.name.toUpperCase()}</Text>

            {/* Turn On (Wake-on-LAN) - Primary Action */}
            <ActionCard
              action="wake"
              title={`Turn On ${device.name}`}
              subtitle={`Wake-on-LAN (${device.macAddress})`}
              iconName="radio"
              isLoading={activeActionLoading === 'wake'}
              onPress={handleExecuteAction}
              isPrimary={true}
            />

            {/* Restart */}
            <ActionCard
              action="restart"
              title="Restart PC"
              subtitle="Reboot Windows workstation"
              iconName="rotate-ccw"
              isLoading={activeActionLoading === 'restart'}
              onPress={handleExecuteAction}
              requiresConfirmation={true}
            />

            {/* Shutdown */}
            <ActionCard
              action="shutdown"
              title="Shutdown PC"
              subtitle="Power off target machine"
              iconName="power"
              isLoading={activeActionLoading === 'shutdown'}
              onPress={handleExecuteAction}
              requiresConfirmation={true}
            />

            {/* Sleep */}
            <ActionCard
              action="sleep"
              title="Sleep PC"
              subtitle="Suspend Windows session"
              iconName="moon"
              isLoading={activeActionLoading === 'sleep'}
              onPress={handleExecuteAction}
            />

            {/* Lock */}
            <ActionCard
              action="lock"
              title="Lock Workstation"
              subtitle="Lock screen immediately"
              iconName="lock"
              isLoading={activeActionLoading === 'lock'}
              onPress={handleExecuteAction}
            />
          </View>
        )}

        {/* Neumorphic Quick Links */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={onOpenSiriGuide}
            activeOpacity={0.75}
          >
            <BookOpen size={13} color="#a1a1aa" />
            <Text style={styles.quickLinkText}>Siri Setup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={onOpenSettings}
            activeOpacity={0.75}
          >
            <Sliders size={13} color="#a1a1aa" />
            <Text style={styles.quickLinkText}>Manage PCs ({devices.length})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Voice Control Modal */}
      <VoiceModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onExecuteAction={handleExecuteAction}
      />

      {/* Direct QR Scanner Modal */}
      <QRScannerModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        onScanSuccess={handleQrScanSuccess}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandContainer: {
    justifyContent: 'center',
  },
  logoImage: {
    width: 125,
    height: 28,
    alignSelf: 'flex-start',
  },
  appSubtitle: {
    fontSize: 9,
    color: '#71717a',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  voiceTriggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  voiceTriggerText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 2,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },
  quickLinkBtn: {
    flex: 1,
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  quickLinkText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#15151a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyIconWell: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyScanBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
