import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { FAB } from '../components/FAB';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/RootStack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    setupHeaderButtons();
    const load = navigation.addListener('focus', async () => {
      const all = await getNotes();
      const today = new Date().toISOString().split('T')[0];
      const todaysNotes = all
        .filter(n => n.createdAt.startsWith(today))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(todaysNotes);
    });
    return load;
  }, [navigation]);

  const setupHeaderButtons = () => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      ),
    });
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateTitle}>Henüz bugün bir not yazmadınız</Text>
      <Text style={styles.emptyStateSubtitle}>Bugünün anılarını kaydetmek için + butonuna dokunun</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate()}</Text>
        {notes.length > 0 && (
          <Text style={styles.noteCount}>
            {notes.length} not
          </Text>
        )}
      </View>
      
      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <NoteCard 
            note={item} 
            onPress={() => navigation.navigate('Detail', { id: item.id })} 
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          notes.length === 0 && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
      
      <FAB onPress={() => navigation.navigate('NewNote')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  date: { 
    ...typography.title,
    fontSize: 24, 
    marginBottom: 4,
  },
  noteCount: {
    fontSize: 14,
    color: colors.placeholder,
  },
  listContainer: {
    padding: 16,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.placeholder,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  searchIcon: {
    fontSize: 20,
  },
});
