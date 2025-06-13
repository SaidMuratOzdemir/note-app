import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Colors, Typography } from '../theme';

interface Props { label: string; }

export const TagPill: React.FC<Props> = ({ label }) => (
  <View style={styles.pill}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.accent.fuchsia,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  text: { 
    ...Typography.tag,
    color: Colors.neutral.darkGray,
  },
});

export default React.memo(TagPill);
