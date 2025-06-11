import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { SubNoteCard } from '../components/SubNoteCard';
import { FAB } from '../components/FAB';
import { EmptyState } from '../components/EmptyState';
import { Colors, Typography, Layout } from '../theme';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { RootStackParamList } from '../navigation/RootStack';
import { getTodayLocal, formatDateToLocal } from '../utils/dateUtils';

type DateNotesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DateNotes'>;
type DateNotesScreenRouteProp = RouteProp<RootStackParamList, 'DateNotes'>;

export const DateNotesScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
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
    const today = getTodayLocal();
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayString = formatDateToLocal(yesterday);
    
    let title = '';
    if (selectedDate === today) {
      title = 'Bugün';
    } else if (selectedDate === yesterdayString) {
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
    setAllNotes(all);
    const dateNotes = all
      .filter(n => n.createdAt.startsWith(selectedDate))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotes(dateNotes);
  };

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
        renderItem={({ item, index }) => {
          const isSubNote = SubNoteUtils.isSubNote(item);
          
          if (isSubNote) {
            // Find parent note for context
            const parentNote = allNotes.find(n => n.id === item.parentId);
            if (!parentNote) return null;
            
            return (
              <SubNoteCard
                note={item}
                parentNote={parentNote}
                onPress={() => navigation.navigate('Detail', { id: item.id })}
              />
            );
          } else {
            // Regular note or parent note
            const subNoteCount = SubNoteUtils.getSubNoteCountFromArray(item.id, allNotes);
            
            return (
              <NoteCard 
                note={item} 
                index={index}
                onPress={() => navigation.navigate('Detail', { id: item.id })}
                subNoteCount={subNoteCount}
                onSubNotesPress={() => navigation.navigate('Detail', { id: item.id })}
              />
            );
          }
        }}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          notes.length === 0 && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Bu tarihte henüz not yok"
            subtitle="Yeni bir not eklemek için + butonuna dokunun"
          />
        }
      />
      
      <FAB onPress={() => navigation.navigate('NewNote', { selectedDate })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.neutral.white 
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
    backgroundColor: 'white',
  },
  noteCount: {
    fontSize: 14,
    color: Colors.neutral.darkGray,
  },
  listContainer: {
    padding: 16,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
});
