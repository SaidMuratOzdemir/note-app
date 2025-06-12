import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { BaseNoteDetail } from './BaseNoteDetail';
import { Colors } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';

type SubNoteDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;

interface SubNoteDetailScreenProps {
  note: Note;
}

export const SubNoteDetailScreen: React.FC<SubNoteDetailScreenProps> = ({ note }) => {
  const [parentNote, setParentNote] = useState<Note | null>(null);
  const navigation = useNavigation<SubNoteDetailNavigationProp>();

  const loadParentNote = useCallback(async () => {
    if (!note.parentId) return;
    try {
      const all = await getNotes();
      const parent = all.find(n => n.id === note.parentId);
      setParentNote(parent || null);
    } catch (error) {
      console.error('Error loading parent note:', error);
    }
  }, [note.parentId]);

  useEffect(() => {
    loadParentNote();
  }, [loadParentNote]);

  // Reload parent note when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadParentNote();
    }, [loadParentNote])
  );

  const renderHeaderContent = () => {
    if (!parentNote) return null;
    
    return (
      <View style={styles.parentContext}>
        <Text style={styles.parentContextLabel}>Ana Not:</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Detail', { id: parentNote.id })}>
          <Text style={styles.parentContextTitle} numberOfLines={2}>
            {parentNote.title || 'Başlıksız Not'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BaseNoteDetail
      note={note}
      renderHeaderContent={renderHeaderContent}
    />
  );
};

const styles = {
  parentContext: {
    backgroundColor: Colors.accent.coral + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.coral,
  },
  parentContextLabel: {
    fontSize: 12,
    color: Colors.textGray,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  parentContextTitle: {
    fontSize: 14,
    color: Colors.accent.darkBlue,
    fontWeight: '500' as const,
  },
};
