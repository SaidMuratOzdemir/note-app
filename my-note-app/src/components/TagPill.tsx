import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface Props { label: string; }

export const TagPill: React.FC<Props> = ({ label }) => (
  <View style={styles.pill}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#CDB4DB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  text: { color: '#333', fontSize: 12 },
});
