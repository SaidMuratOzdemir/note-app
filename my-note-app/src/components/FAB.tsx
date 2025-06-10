import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';

interface Props {
  onPress: () => void;
}

export const FAB: React.FC<Props> = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress}>
    <Text style={styles.text}>+</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CDB4DB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  text: { fontSize: 32, color: '#fff' },
});
