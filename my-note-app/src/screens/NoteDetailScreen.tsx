import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Note } from '../types/Note';
import { Reminder } from '../types/Reminder';
import { getNotes, deleteNote, getSubNotes, createSubNote, updateNote, deleteSubNote } from '../services/storage';
import { TagPill } from '../components/TagPill';
import { SubNoteCard } from '../components/SubNoteCard';
import { SubNoteModal } from '../components/SubNoteModal';
import { ReminderService } from '../services/reminderService';
import { Colors, Typography, Layout } from '../theme';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { RootStackParamList } from '../navigation/RootStack';

type NoteDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type NoteDetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export const NoteDetailScreen: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [subNotes, setSubNotes] = useState<Note[]>([]);
  const [showSubNoteModal, setShowSubNoteModal] = useState(false);
  const [editingSubNote, setEditingSubNote] = useState<Note | undefined>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const navigation = useNavigation<NoteDetailScreenNavigationProp>();
  const route = useRoute<NoteDetailScreenRouteProp>();

  const isParentNote = note && !note.parentId;

  useEffect(() => {
    loadNote();
    setupHeaderButtons();
  }, []);

  useEffect(() => {
    if (isParentNote && note) {
      loadSubNotes();
    }
  }, [note?.id, isParentNote]);

  const loadNote = async () => {
    const all = await getNotes();
    const foundNote = all.find(n => n.id === route.params.id);
    setNote(foundNote || null);
  };

  const loadSubNotes = async () => {
    if (!note) return;
    try {
      const noteSubNotes = await getSubNotes(note.id);
      setSubNotes(noteSubNotes);
    } catch (error) {
      console.error('Error loading sub-notes:', error);
    }
  };

  const setupHeaderButtons = () => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditNote', { id: route.params.id })} 
            style={styles.headerButton}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.headerButton}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Notu Sil',
      'Bu notu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    await deleteNote(route.params.id);
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const noteDate = dateString.split('T')[0];
    
    let datePrefix = '';
    if (noteDate === today) {
      datePrefix = 'Bugün, ';
    } else if (noteDate === yesterday) {
      datePrefix = 'Dün, ';
    } else {
      datePrefix = date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }) + ', ';
    }
    
    const time = date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return datePrefix + time;
  };

  const handleCreateSubNote = () => {
    setEditingSubNote(undefined);
    setShowSubNoteModal(true);
  };

  const handleEditSubNote = (subNote: Note) => {
    setEditingSubNote(subNote);
    setShowSubNoteModal(true);
  };

  const handleSaveSubNote = async (subNoteData: Partial<Note>) => {
    if (!note) return;
    
    try {
      if (editingSubNote) {
        // Update existing sub-note
        const updatedSubNote: Note = {
          ...editingSubNote,
          ...subNoteData,
        };
        await updateNote(updatedSubNote);
      } else {
        // Create new sub-note
        await createSubNote(note.id, subNoteData);
      }
      
      await loadSubNotes();
      setShowSubNoteModal(false);
      setEditingSubNote(undefined);
    } catch (error) {
      console.error('Error saving sub-note:', error);
      Alert.alert('Hata', 'Alt not kaydedilemedi.');
    }
  };

  const handleDeleteSubNote = async () => {
    if (!editingSubNote) return;
    
    try {
      await deleteSubNote(editingSubNote.id);
      await loadSubNotes();
      setShowSubNoteModal(false);
      setEditingSubNote(undefined);
    } catch (error) {
      console.error('Error deleting sub-note:', error);
      Alert.alert('Hata', 'Alt not silinemedi.');
    }
  };

  if (!note) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Not bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {note.title && (
          <Text style={styles.title}>{note.title}</Text>
        )}
        
        <Text style={styles.time}>{formatDate(note.createdAt)}</Text>
        
        {note.imageUris && note.imageUris.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {note.imageUris.map((uri, index) => (
                <Image 
                  key={index} 
                  source={{ uri }} 
                  style={[styles.image, index > 0 && styles.imageMargin]} 
                  contentFit="cover" 
                />
              ))}
            </ScrollView>
          </View>
        )}
        
        <Text style={styles.noteContent}>{note.content}</Text>
        
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Etiketler:</Text>
            <View style={styles.tags}>
              {note.tags.map(tag => (
                <TagPill key={tag} label={`#${tag}`} />
              ))}
            </View>
          </View>
        )}

        {/* Sub-Notes Section - Only for parent notes */}
        {isParentNote && (
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
                    onLongPress={() => handleEditSubNote(subNote)}
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
        )}
      </View>

      {/* Sub-Note Modal */}
      <SubNoteModal
        visible={showSubNoteModal}
        parentNote={note}
        editingSubNote={editingSubNote}
        onSave={handleSaveSubNote}
        onCancel={() => {
          setShowSubNoteModal(false);
          setEditingSubNote(undefined);
        }}
        onDelete={editingSubNote ? handleDeleteSubNote : undefined}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.neutral.white 
  },
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
  content: {
    padding: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold',
    color: Colors.neutral.darkGray,
    marginBottom: 8,
    lineHeight: 34,
  },
  time: { 
    fontSize: 14, 
    color: Colors.neutral.darkGray, 
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageMargin: {
    marginLeft: 12,
  },
  noteContent: { 
    fontSize: 16,
    color: Colors.neutral.darkGray,
    lineHeight: 24,
    marginBottom: 20,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 14,
    color: Colors.neutral.darkGray,
    marginBottom: 8,
    fontWeight: '500',
  },
  tags: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  editIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    fontSize: 20,
  },
  subNotesSection: {
    marginTop: 24,
    paddingHorizontal: Layout.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h2,
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
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    fontWeight: '600',
    marginLeft: 4,
  },
  subNotesList: {
    marginTop: 8,
  },
  emptySubNotes: {
    padding: 20,
    alignItems: 'center',
  },
  emptySubNotesText: {
    ...Typography.body,
    color: Colors.textGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
