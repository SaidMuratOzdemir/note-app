import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { SubNoteCard } from '../components/SubNoteCard';
import { EmptyState } from '../components/EmptyState';
import { Colors, Typography, Layout } from '../theme';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { formatRelativeDate } from '../utils/dateUtils';
import { RootStackParamList } from '../navigation/RootStack';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const navigation = useNavigation<SearchScreenNavigationProp>();

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchQuery, allNotes]);

  const loadNotes = async () => {
    const notes = await getNotes();
    setAllNotes(notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const filterNotes = () => {
    if (!searchQuery.trim()) {
      setFilteredNotes(allNotes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allNotes.filter(note => 
      note.title?.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
    setFilteredNotes(filtered);
  };

  const groupNotesByDate = (notes: Note[]) => {
    const grouped = notes.reduce((acc, note) => {
      const date = note.createdAt.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
    
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const formatDate = (dateString: string) => {
    return formatRelativeDate(dateString);
  };

  const renderSection = ({ item }: { item: [string, Note[]] }) => {
    const [date, notes] = item;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{formatDate(date)}</Text>
        {notes.map((note, index) => {
          const isSubNote = SubNoteUtils.isSubNote(note);
          
          if (isSubNote) {
            // Find parent note for context
            const parentNote = allNotes.find(n => n.id === note.parentId);
            if (!parentNote) return null;
            
            return (
              <SubNoteCard
                key={note.id}
                note={note}
                parentNote={parentNote}
                onPress={() => navigation.navigate('Detail', { id: note.id })}
              />
            );
          } else {
            // Regular note or parent note
            const subNoteCount = SubNoteUtils.getSubNoteCountFromArray(note.id, allNotes);
            
            return (
              <NoteCard 
                key={note.id} 
                note={note} 
                index={index}
                onPress={() => navigation.navigate('Detail', { id: note.id })}
                subNoteCount={subNoteCount}
                onSubNotesPress={() => navigation.navigate('Detail', { id: note.id })}
              />
            );
          }
        })}
      </View>
    );
  };

  const groupedNotes = groupNotesByDate(filteredNotes);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Notlarda ara..."
          placeholderTextColor={Colors.neutral.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>
      
      {searchQuery.trim() && (
        <Text style={styles.resultText}>
          {filteredNotes.length} sonuç bulundu
        </Text>
      )}
      
      <FlatList
        data={groupedNotes}
        renderItem={renderSection}
        keyExtractor={([date]) => date}
        contentContainerStyle={[
          styles.listContainer,
          groupedNotes.length === 0 && searchQuery.trim() && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.trim() ? (
            <EmptyState
              icon="search-outline"
              title="Sonuç bulunamadı"
              subtitle={`"${searchQuery}" için eşleşen not bulunamadı`}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Aramaya başlayın"
              subtitle="Notlarınızda arama yapmak için yukarıdaki alana yazın"
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
  },
  resultText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: Colors.neutral.darkGray,
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.darkGray,
    marginBottom: 8,
  },
});

export default React.memo(SearchScreen);
