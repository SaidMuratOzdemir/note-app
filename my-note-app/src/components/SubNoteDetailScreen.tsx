import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { getNotes, createSubNote } from '../services/storage';
import { SubNoteUtils, HIERARCHY_CONFIG } from '../utils/subNoteUtils';
import { logger } from '../utils/logger';
import { SubNoteCard } from './SubNoteCard';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { ErrorBoundary } from './ErrorBoundary';
import { BaseNoteDetail } from './BaseNoteDetail';
import { Colors } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';

type SubNoteDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;

interface SubNoteDetailScreenProps {
  note: Note;
}

export const SubNoteDetailScreen: React.FC<SubNoteDetailScreenProps> = ({ note }) => {
  const [parentNote, setParentNote] = useState<Note | null>(null);
  const [subNotes, setSubNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<SubNoteDetailNavigationProp>();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getNotes();
      setAllNotes(all);
      
      // Load parent note if exists
      if (note.parentId) {
        const parent = all.find(n => n.id === note.parentId);
        setParentNote(parent || null);
      }
      
      // Load sub-notes
      const noteSubNotes = SubNoteUtils.getSubNotesFromArray(note.id, all);
      setSubNotes(noteSubNotes);
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [note.id, note.parentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCreateSubNote = () => {
    logger.log('[SubNoteDetailScreen] 🔄 Creating sub-note for:', note.id);
    
    // Check validation before navigation
    const validation = SubNoteUtils.canCreateSubNote(note.id, allNotes);
    
    if (!validation.isValid) {
      Alert.alert(
        'Alt Not Oluşturulamıyor', 
        validation.reason || 'Bu not için alt not oluşturulamıyor.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      Alert.alert(
        'Uyarı',
        validation.warnings.join('\n\n'),
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Devam Et', 
            onPress: () => navigation.navigate('NewNote', { parentNoteId: note.id })
          }
        ]
      );
      return;
    }

    // Direct navigation if no warnings
    navigation.navigate('NewNote', { parentNoteId: note.id });
  };

  const renderBreadcrumb = () => {
    if (isLoading || allNotes.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      );
    }
    
    return (
      <BreadcrumbNavigation
        currentNote={note}
        allNotes={allNotes}
        onNotePress={(noteId) => navigation.navigate('Detail', { id: noteId })}
        maxVisible={4}
      />
    );
  };

  const renderSubNotesSection = () => {
    const canCreateMore = SubNoteUtils.canCreateSubNote(note.id, allNotes);
    
    return (
      <View style={styles.subNotesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alt Notlar ({subNotes.length})</Text>
          {canCreateMore.isValid && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleCreateSubNote}
            >
              <Ionicons name="add" size={16} color={Colors.accent.darkBlue} />
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          )}
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
              {canCreateMore.isValid 
                ? 'Henüz alt not yok. Yukarıdaki butona tıklayarak ekleyebilirsiniz.' 
                : 'Bu not için alt not oluşturulamıyor.'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <BaseNoteDetail
        note={note}
        renderHeaderContent={renderBreadcrumb}
        renderFooterContent={renderSubNotesSection}
      />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.neutral.darkGray,
    fontStyle: 'italic' as const,
  },
  subNotesSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.neutral.darkGray,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent.coral + '20',
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 12,
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
    fontSize: 14,
    color: Colors.neutral.darkGray,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
});
