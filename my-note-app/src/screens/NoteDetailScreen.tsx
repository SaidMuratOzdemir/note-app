import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Note } from '../types/Note';
import { getNotes, deleteNote } from '../services/storage';
import { TagPill } from '../components/TagPill';

interface Params { id: string; }

export const NoteDetailScreen: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: Params }, 'params'>>();

  useEffect(() => {
    (async () => {
      const all = await getNotes();
      setNote(all.find(n => n.id === route.params.id) || null);
    })();
  }, [route.params.id]);

  const remove = async () => {
    await deleteNote(route.params.id);
    navigation.goBack();
  };

  if (!note) return null;

  return (
    <View style={styles.container}>
      {note.title ? <Text style={styles.title}>{note.title}</Text> : null}
      <Text style={styles.time}>{new Date(note.createdAt).toLocaleString()}</Text>
      <Text style={styles.content}>{note.content}</Text>
      <View style={styles.tags}>{note.tags?.map(tag => <TagPill key={tag} label={tag} />)}</View>
      <Button title="Sil" onPress={remove} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  time: { fontSize: 12, color: '#666', marginVertical: 4 },
  content: { marginVertical: 8 },
  tags: { flexDirection: 'row', marginVertical: 4 },
});
