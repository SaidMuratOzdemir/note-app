import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { FAB } from '../components/FAB';
import { EmptyState } from '../components/EmptyState';
import { Colors, Typography, Layout } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';
import { getTodayLocal, formatDateToLocal } from '../utils/dateUtils';

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
        renderItem={({ item, index }) => (
          <NoteCard 
            note={item} 
            index={index}
            onPress={() => navigation.navigate('Detail', { id: item.id })} 
          />
        )}
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
