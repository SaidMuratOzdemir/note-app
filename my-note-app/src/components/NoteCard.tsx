import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Note } from '../types/Note';
import { TagPill } from './TagPill';

interface Props {
  note: Note;
  onPress: () => void;
}

export const NoteCard: React.FC<Props> = ({ note, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    {note.title ? <Text style={styles.title}>{note.title}</Text> : null}
    <Text style={styles.time}>{new Date(note.createdAt).toLocaleTimeString()}</Text>
    <Text numberOfLines={2} style={styles.content}>{note.content}</Text>
    <View style={styles.tags}>
      {note.tags?.map(tag => <TagPill key={tag} label={tag} />)}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFCDB2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  time: { fontSize: 12, color: '#666' },
  content: { marginTop: 4 },
  tags: { flexDirection: 'row', marginTop: 4 },
});
