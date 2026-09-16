import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  variant?: 'default' | 'elevated' | 'highlight';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderColor = 'rgba(255, 255, 255, 0.12)',
  variant = 'default',
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'highlight' && styles.highlight,
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
    backgroundColor: '#0d0d10',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  elevated: {
    backgroundColor: '#141418',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  highlight: {
    backgroundColor: '#18181c',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});
