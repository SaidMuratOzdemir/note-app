import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  iconSize?: number;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  iconSize = 64,
  iconColor = Colors.neutral.mediumGray,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color={iconColor} 
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.neutral.darkGray,
  },
});
