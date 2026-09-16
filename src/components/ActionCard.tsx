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
  isLoading: boolean;
  onPress: (action: PowerAction) => void;
  isPrimary?: boolean;
  requiresConfirmation?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  title,
  subtitle,
  iconName,
  isLoading,
  onPress,
  isPrimary = false,
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
    const iconColor = isPrimary ? '#000000' : '#ffffff';
    const props = { size: 18, color: iconColor };
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
        isPrimary ? styles.cardPrimary : styles.cardSecondary,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrapper, isPrimary ? styles.iconPrimary : styles.iconSecondary]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isPrimary ? '#000000' : '#ffffff'} />
        ) : (
          renderIcon()
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, isPrimary && styles.titlePrimary]}>{title}</Text>
        <Text style={[styles.subtitle, isPrimary && styles.subtitlePrimary]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  cardPrimary: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  cardSecondary: {
    backgroundColor: '#0f0f12',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPrimary: {
    backgroundColor: '#f4f4f5',
  },
  iconSecondary: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  titlePrimary: {
    color: '#000000',
  },
  subtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  subtitlePrimary: {
    color: '#3f3f46',
  },
});
