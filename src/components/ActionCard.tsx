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
    const props = { size: 18, color: '#ffffff' };
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
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4.5,
  },
  cardPrimary: {
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  cardSecondary: {
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPrimary: {
    backgroundColor: '#000000',
  },
  iconSecondary: {
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
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
    color: '#52525b',
  },
});
