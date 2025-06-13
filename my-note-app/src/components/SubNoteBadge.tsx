import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../theme';

interface SubNoteBadgeProps {
  count: number;
  onPress: () => void;
  style?: any;
}

export const SubNoteBadge: React.FC<SubNoteBadgeProps> = ({ 
  count, 
  onPress, 
  style 
}) => {
  if (count === 0) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.badge, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons 
          name="document-text-outline" 
          size={12} 
          color={Colors.accent.darkBlue} 
          style={styles.icon}
        />
        <Text style={styles.text}>+{count} alt not</Text>
        <Ionicons 
          name="chevron-forward" 
          size={12} 
          color={Colors.accent.darkBlue}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.neutral.lightGray1,
    borderColor: Colors.accent.darkBlue,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default React.memo(SubNoteBadge);
