import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DeviceConfig, PCStatus, PowerAction } from '../types';
import { PCControlService } from '../services/pcControlService';
import { StatusHeader } from '../components/StatusHeader';
import { ActionCard } from '../components/ActionCard';
import { VoiceModal } from '../components/VoiceModal';
import { Mic, CheckCircle2, AlertCircle } from 'lucide-react-native';

interface DashboardScreenProps {
  device: DeviceConfig;
  onOpenSettings: () => void;
  onOpenSiriGuide: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  device,
  onOpenSettings,
  onOpenSiriGuide,
}) => {
  const [status, setStatus] = useState<PCStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeActionLoading, setActiveActionLoading] = useState<PowerAction | null>(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [lastNotification, setLastNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await PCControlService.checkStatus(device);
      setStatus(res);
    } catch (e) {
      setStatus({ online: false, lastChecked: Date.now() });
    } finally {
      setIsRefreshing(false);
    }
  }, [device]);

  useEffect(() => {
    refreshStatus();
    // Poll every 8 seconds
    const interval = setInterval(refreshStatus, 8000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setLastNotification({ type, message });
    setTimeout(() => {
      setLastNotification(null);
    }, 4500);
  };

  const handleExecuteAction = async (action: PowerAction) => {
    setActiveActionLoading(action);
    try {
      const result = await PCControlService.executePowerAction(device, action);

      if (result.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        showBanner('success', result.message);
        // Refresh status after short delay
        setTimeout(refreshStatus, 1500);
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

  return (
    <SafeAreaView style={styles.safeArea}>
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
        >
          <Mic size={18} color="#38bdf8" />
          <Text style={styles.voiceTriggerText}>Voice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Status & Ping */}
        <StatusHeader
          device={device}
          status={status}
          isLoading={isRefreshing}
          onRefresh={refreshStatus}
        />

        {/* Action Feedback Banner */}
        {lastNotification && (
          <View
            style={[
              styles.feedbackBanner,
              lastNotification.type === 'success'
                ? styles.bannerSuccess
                : styles.bannerError,
            ]}
          >
            {lastNotification.type === 'success' ? (
              <CheckCircle2 size={16} color="#4ade80" />
            ) : (
              <AlertCircle size={16} color="#f87171" />
            )}
            <Text
              style={[
                styles.bannerText,
                lastNotification.type === 'success'
                  ? styles.bannerTextSuccess
                  : styles.bannerTextError,
              ]}
            >
              {lastNotification.message}
            </Text>
          </View>
        )}

        {/* Power Action Cards */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>POWER CONTROLS</Text>

          {/* Turn On (Wake-on-LAN) */}
          <ActionCard
            action="wake"
            title="Turn On PC"
            subtitle={`Broadcast Magic Packet (${device.macAddress})`}
            iconName="radio"
            color="#059669"
            glowColor="rgba(16, 185, 129, 0.25)"
            isLoading={activeActionLoading === 'wake'}
            onPress={handleExecuteAction}
          />

          {/* Restart */}
          <ActionCard
            action="restart"
            title="Restart PC"
            subtitle="Reboot Windows workstation"
            iconName="rotate-ccw"
            color="#d97706"
            glowColor="rgba(245, 158, 11, 0.25)"
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
            color="#dc2626"
            glowColor="rgba(239, 68, 68, 0.25)"
            isLoading={activeActionLoading === 'shutdown'}
            onPress={handleExecuteAction}
            requiresConfirmation={true}
          />

          {/* Sleep */}
          <ActionCard
            action="sleep"
            title="Sleep PC"
            subtitle="Suspend Windows session to RAM"
            iconName="moon"
            color="#6366f1"
            glowColor="rgba(99, 102, 241, 0.25)"
            isLoading={activeActionLoading === 'sleep'}
            onPress={handleExecuteAction}
          />

          {/* Lock */}
          <ActionCard
            action="lock"
            title="Lock Workstation"
            subtitle="Lock screen immediately"
            iconName="lock"
            color="#0284c7"
            glowColor="rgba(56, 189, 248, 0.25)"
            isLoading={activeActionLoading === 'lock'}
            onPress={handleExecuteAction}
          />
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={onOpenSiriGuide}
          >
            <Text style={styles.quickLinkText}>🎙️ Siri Shortcuts Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={onOpenSettings}
          >
            <Text style={styles.quickLinkText}>⚙️ Device Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Big Voice Mic Button */}
      <TouchableOpacity
        style={styles.fabMic}
        activeOpacity={0.85}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          setVoiceModalVisible(true);
        }}
      >
        <Mic size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Voice Control Modal */}
      <VoiceModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onExecuteAction={handleExecuteAction}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  brandContainer: {
    justifyContent: 'center',
  },
  logoImage: {
    width: 140,
    height: 32,
    alignSelf: 'flex-start',
  },
  appSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  voiceTriggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  voiceTriggerText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  bannerTextSuccess: {
    color: '#4ade80',
  },
  bannerTextError: {
    color: '#f87171',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  quickLinkBtn: {
    flex: 1,
    backgroundColor: '#131927',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickLinkText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  fabMic: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
