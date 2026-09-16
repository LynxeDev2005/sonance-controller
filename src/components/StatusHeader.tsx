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
    <GlassCard variant={isOnline ? 'glow' : 'default'} style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.deviceInfo}>
          <View style={styles.iconBadge}>
            <Monitor size={20} color={isOnline ? '#38bdf8' : '#94a3b8'} />
          </View>
          <View>
            <Text style={styles.deviceName}>{device.name || 'Target PC'}</Text>
            <Text style={styles.deviceAddress}>
              {device.ipAddress}:{device.port}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#38bdf8" />
          ) : (
            <RefreshCw size={16} color="#94a3b8" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#22c55e' : '#ef4444' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? '#4ade80' : '#f87171' },
            ]}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>

        {isOnline && status?.latencyMs !== undefined && (
          <View style={styles.metricBadge}>
            <Zap size={12} color="#38bdf8" />
            <Text style={styles.metricText}>{status.latencyMs}ms</Text>
          </View>
        )}

        {isOnline && status?.uptimeHours && (
          <View style={styles.metricBadge}>
            <Clock size={12} color="#a855f7" />
            <Text style={styles.metricText}>{status.uptimeHours}</Text>
          </View>
        )}

        {isOnline && status?.memory && (
          <View style={styles.metricBadge}>
            <Cpu size={12} color="#eab308" />
            <Text style={styles.metricText}>
              {status.memory.free} Free
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  metricText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});
