import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { FAB } from '../components/FAB';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/RootStack';

type DateNotesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DateNotes'>;
type DateNotesScreenRouteProp = RouteProp<RootStackParamList, 'DateNotes'>;

export const DateNotesScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigation = useNavigation<DateNotesScreenNavigationProp>();
  const route = useRoute<DateNotesScreenRouteProp>();
  const selectedDate = route.params.date;

  useEffect(() => {
    setupHeader();
    const load = navigation.addListener('focus', loadNotes);
    loadNotes();
    return load;
  }, [navigation, selectedDate]);

  const setupHeader = () => {
    const date = new Date(selectedDate);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let title = '';
    if (selectedDate === today) {
      title = 'Bugün';
    } else if (selectedDate === yesterday) {
      title = 'Dün';
    } else {
      title = date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    navigation.setOptions({ title });
  };

  const loadNotes = async () => {
    const all = await getNotes();
    const dateNotes = all
      .filter(n => n.createdAt.startsWith(selectedDate))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotes(dateNotes);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateTitle}>Bu tarihte henüz not yok</Text>
      <Text style={styles.emptyStateSubtitle}>Yeni bir not eklemek için + butonuna dokunun</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
      
      <FAB onPress={() => navigation.navigate('NewNote', { selectedDate })} />
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
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
});
