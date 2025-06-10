import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

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
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.fab,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  text: { 
    fontSize: 28, 
    color: '#fff',
    fontWeight: '300',
  },
});
