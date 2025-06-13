import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Note } from '../types/Note';
import { getNotes, deleteNote } from '../services/storage';
import { TagPill } from './TagPill';
import { ReminderForm } from './ReminderForm';
import { ReminderList } from './ReminderList';
import { Colors } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/dateUtils';

type BaseNoteDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;

interface BaseNoteDetailProps {
  note: Note | null;
  onNoteLoaded?: (note: Note) => void;
  renderHeaderContent?: () => React.ReactNode;
  renderFooterContent?: () => React.ReactNode;
  showHeaderButtons?: boolean;
}

export const BaseNoteDetail: React.FC<BaseNoteDetailProps> = ({
  note,
  onNoteLoaded,
  renderHeaderContent,
  renderFooterContent,
  showHeaderButtons = true,
}) => {
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(undefined); // TODO: Define proper Reminder type
  
  const navigation = useNavigation<BaseNoteDetailNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (note && showHeaderButtons) {
      setupHeaderButtons();
    }
  }, [note, showHeaderButtons]);

  const setupHeaderButtons = () => {
    if (!note) return;
    
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setShowReminderForm(true)} 
            style={styles.headerButton}
          >
            <Text style={styles.reminderIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditNote', { id: note.id })} 
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
    if (!note) return;
    
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
    if (!note) return;
    
    await deleteNote(note.id);
    navigation.goBack();
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
        {/* Header Content (Parent context, etc.) */}
        {renderHeaderContent && renderHeaderContent()}

        {/* Note Title */}
        {note.title && (
          <Text style={styles.title}>{note.title}</Text>
        )}
        
        {/* Note Date */}
        <Text style={styles.time}>{formatDateTime(note.createdAt)}</Text>
        
        {/* Note Images */}
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
        
        {/* Note Content */}
        <Text style={styles.noteContent}>{note.content}</Text>
        
        {/* Note Tags */}
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

        {/* Reminders Section */}
        <View style={styles.remindersSection}>
          <ReminderList
            noteId={note.id}
            onEditReminder={(reminder) => {
              setEditingReminder(reminder);
              setShowReminderForm(true);
            }}
            maxVisible={3}
            showCompleted={false}
          />
        </View>

        {/* Footer Content (Sub-notes section, etc.) */}
        {renderFooterContent && renderFooterContent()}
      </View>

      {/* Reminder Form Modal */}
      {showReminderForm && (
        <ReminderForm
          note={note}
          visible={showReminderForm}
          editingReminder={editingReminder}
          onSave={(reminder) => {
            logger.dev('[BaseNoteDetail] Reminder saved:', reminder);
            setShowReminderForm(false);
            setEditingReminder(undefined);
          }}
          onCancel={() => {
            logger.dev('[BaseNoteDetail] Reminder form cancelled');
            setShowReminderForm(false);
            setEditingReminder(undefined);
          }}
        />
      )}
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
  remindersSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray2,
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
  reminderIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    fontSize: 20,
  },
});

export default React.memo(BaseNoteDetail);
