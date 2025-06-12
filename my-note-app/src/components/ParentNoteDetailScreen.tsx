import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { getSubNotes } from '../services/storage';
import { BaseNoteDetail } from './BaseNoteDetail';
import { SubNoteCard } from './SubNoteCard';
import { Colors, Typography, Layout } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';

type ParentNoteDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;

interface ParentNoteDetailScreenProps {
  note: Note;
}

export const ParentNoteDetailScreen: React.FC<ParentNoteDetailScreenProps> = ({ note }) => {
  const [subNotes, setSubNotes] = useState<Note[]>([]);
  const navigation = useNavigation<ParentNoteDetailNavigationProp>();

  useEffect(() => {
    loadSubNotes();
  }, [note.id]);

  const loadSubNotes = async () => {
    try {
      const noteSubNotes = await getSubNotes(note.id);
      setSubNotes(noteSubNotes);
    } catch (error) {
      console.error('Error loading sub-notes:', error);
    }
  };

  const handleCreateSubNote = () => {
    navigation.navigate('NewNote', { parentNoteId: note.id });
  };

  const renderFooterContent = () => (
    <View style={styles.subNotesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alt Notlar ({subNotes.length})</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateSubNote}
        >
          <Ionicons name="add" size={20} color={Colors.accent.darkBlue} />
          <Text style={styles.addButtonText}>Alt Not Ekle</Text>
        </TouchableOpacity>
      </View>
      
      {subNotes.length > 0 ? (
        <View style={styles.subNotesList}>
          {subNotes.map((subNote) => (
            <SubNoteCard
              key={subNote.id}
              note={subNote}
              parentNote={note}
              onPress={() => navigation.navigate('Detail', { id: subNote.id })}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptySubNotes}>
          <Text style={styles.emptySubNotesText}>
            Henüz alt not eklenmemiş. Alt not eklemek için yukarıdaki butonu kullanın.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <BaseNoteDetail
      note={note}
      renderFooterContent={renderFooterContent}
    />
  );
};

const styles = {
  subNotesSection: {
    marginTop: 24,
    paddingHorizontal: Layout.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h2,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent.coral + '20',
    borderRadius: 16,
  },
  addButtonText: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  subNotesList: {
    marginTop: 8,
  },
  emptySubNotes: {
    padding: 20,
    alignItems: 'center' as const,
  },
  emptySubNotesText: {
    ...Typography.body,
    color: Colors.textGray,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
};
