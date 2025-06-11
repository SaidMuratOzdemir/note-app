import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout } from '../theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
}

export const FAB: React.FC<FABProps> = ({ 
  onPress, 
  icon = 'add',
  size = Layout.fabSize,
  backgroundColor = Colors.fabBlue,
  iconColor = Colors.neutral.white,
}) => {
  const fabStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
  };
  
  return (
    <TouchableOpacity 
      style={[styles.fab, fabStyle]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={size * 0.5} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Layout.fabPosition.right,
    bottom: Layout.fabPosition.bottom,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Layout.elevation.medium,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: Layout.elevation.high,
  },
});
