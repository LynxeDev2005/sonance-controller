import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PowerAction } from '../types';
import { Power, RotateCcw, Moon, Lock, Radio } from 'lucide-react-native';

interface ActionCardProps {
  action: PowerAction;
  title: string;
  subtitle: string;
  iconName: 'power' | 'rotate-ccw' | 'moon' | 'lock' | 'radio';
  color: string;
  glowColor: string;
  isLoading: boolean;
  onPress: (action: PowerAction) => void;
  requiresConfirmation?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  title,
  subtitle,
  iconName,
  color,
  glowColor,
  isLoading,
  onPress,
  requiresConfirmation = false,
}) => {
  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (requiresConfirmation) {
      Alert.alert(
        `Confirm ${title}`,
        `Are you sure you want to trigger "${title}" on your target PC?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: title,
            style: action === 'shutdown' ? 'destructive' : 'default',
            onPress: () => {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch {}
              onPress(action);
            },
          },
        ]
      );
    } else {
      onPress(action);
    }
  };

  const renderIcon = () => {
    const props = { size: 28, color: '#ffffff' };
    switch (iconName) {
      case 'power':
        return <Power {...props} />;
      case 'rotate-ccw':
        return <RotateCcw {...props} />;
      case 'moon':
        return <Moon {...props} />;
      case 'lock':
        return <Lock {...props} />;
      case 'radio':
      default:
        return <Radio {...props} />;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: glowColor,
          shadowColor: glowColor,
        },
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrapper, { backgroundColor: color }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          renderIcon()
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131927',
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },
});
