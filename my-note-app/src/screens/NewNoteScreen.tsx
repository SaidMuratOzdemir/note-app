import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { addNote } from '../services/storage';
import { Note } from '../types/Note';
import { v4 as uuid } from 'uuid';

export const NewNoteScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigation = useNavigation();

  const save = async () => {
    const note: Note = {
      id: uuid(),
      title: title || undefined,
      content,
      createdAt: new Date().toISOString(),
    };
    await addNote(note);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Başlık" value={title} onChangeText={setTitle} style={styles.title} />
      <TextInput placeholder="Not" value={content} onChangeText={setContent} style={styles.content} multiline />
      <Button title="Kaydet" onPress={save} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, marginBottom: 8 },
  content: { flex: 1, textAlignVertical: 'top', marginBottom: 16 },
});
