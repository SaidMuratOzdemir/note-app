import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { ParentNoteDetailScreen } from '../components/ParentNoteDetailScreen';
import { SubNoteDetailScreen } from '../components/SubNoteDetailScreen';
import { Colors } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';

type NoteDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type NoteDetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export const NoteDetailScreen: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  
  const navigation = useNavigation<NoteDetailScreenNavigationProp>();
  const route = useRoute<NoteDetailScreenRouteProp>();

  const isParentNote = note && !note.parentId;
  const isSubNote = note && !!note.parentId;

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    const all = await getNotes();
    const foundNote = all.find(n => n.id === route.params.id);
    setNote(foundNote || null);
  };

  if (!note) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Not bulunamadı</Text>
      </View>
    );
  }

  // Render appropriate component based on note type
  if (isParentNote) {
    return <ParentNoteDetailScreen note={note} />;
  } else if (isSubNote) {
    return <SubNoteDetailScreen note={note} />;
  }

  // Fallback (shouldn't happen)
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Not türü belirlenemedi</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.darkGray,
  },
});
