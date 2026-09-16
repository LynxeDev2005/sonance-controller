import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DeviceConfig, PCStatus } from '../types';
import { GlassCard } from './GlassCard';
import { RefreshCw, Monitor, Zap, Clock, Cpu } from 'lucide-react-native';

interface StatusHeaderProps {
  device: DeviceConfig;
  status: PCStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  device,
  status,
  isLoading,
  onRefresh,
}) => {
  const isOnline = status?.online ?? false;

  return (
    <GlassCard variant={isOnline ? 'highlight' : 'default'} style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.deviceInfo}>
          <View style={styles.iconBadge}>
            <Monitor size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.deviceName}>{device.name || 'Target PC'}</Text>
            <Text style={styles.deviceAddress}>
              {device.ipAddress}:{device.port}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, isOnline && styles.statusBadgeOnline]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#ffffff' : '#52525b' },
              ]}
            />
            <Text style={[styles.statusText, isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RefreshCw size={13} color="#a1a1aa" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isOnline && (
        <View style={styles.metricsRow}>
          {status?.latencyMs !== undefined && (
            <View style={styles.metricItem}>
              <Zap size={11} color="#ffffff" />
              <Text style={styles.metricText}>{status.latencyMs}ms</Text>
            </View>
          )}

          {status?.uptimeHours && (
            <View style={styles.metricItem}>
              <Clock size={11} color="#ffffff" />
              <Text style={styles.metricText}>{status.uptimeHours}</Text>
            </View>
          )}

          {status?.memory && (
            <View style={styles.metricItem}>
              <Cpu size={11} color="#ffffff" />
              <Text style={styles.metricText}>{status.memory.free} Free</Text>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginVertical: 6,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  deviceAddress: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
  },
  statusBadgeOnline: {
    backgroundColor: '#27272a',
    borderColor: '#ffffff',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusTextOnline: {
    color: '#ffffff',
  },
  statusTextOffline: {
    color: '#71717a',
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    gap: 4,
  },
  metricText: {
    fontSize: 10,
    color: '#d4d4d8',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
