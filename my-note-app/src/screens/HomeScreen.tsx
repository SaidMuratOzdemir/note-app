import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { FAB } from '../components/FAB';
import { colors } from '../theme/colors';

export const HomeScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const load = navigation.addListener('focus', async () => {
      const all = await getNotes();
      const today = new Date().toISOString().split('T')[0];
      setNotes(all.filter(n => n.createdAt.startsWith(today)));
    });
    return load;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      <FlatList
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
      />
      <FAB onPress={() => navigation.navigate('NewNote')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  date: { fontSize: 24, fontWeight: 'bold', margin: 16 },
});
