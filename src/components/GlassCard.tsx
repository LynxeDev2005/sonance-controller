import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  variant?: 'default' | 'elevated' | 'glow';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderColor = 'rgba(255, 255, 255, 0.08)',
  variant = 'default',
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'glow' && styles.glow,
        { borderColor },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131927',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  elevated: {
    backgroundColor: '#172033',
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  glow: {
    backgroundColor: '#141d30',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#0284c7',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
});
