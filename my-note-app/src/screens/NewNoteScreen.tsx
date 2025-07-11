import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { addNote, createSubNote, getNotes } from '../services/storage';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { logger } from '../utils/logger';
import { TagService } from '../services/tagService';
import { ReminderService } from '../services/reminderService';
import { Note } from '../types/Note';
import { ReminderForm } from '../components/ReminderForm';
import { v4 as uuid } from 'uuid';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/RootStack';

type NewNoteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewNote'>;
type NewNoteScreenRouteProp = RouteProp<RootStackParamList, 'NewNote'>;

export const NewNoteScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [parentNote, setParentNote] = useState<Note | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [savedNote, setSavedNote] = useState<Note | null>(null);
  const [tempNoteId] = useState(() => uuid()); // Geçici ID, component mount'ta oluştur
  const [hasUnsavedReminders, setHasUnsavedReminders] = useState(false); // Track if reminders were created
  
  const navigation = useNavigation<NewNoteScreenNavigationProp>();
  const route = useRoute<NewNoteScreenRouteProp>();
  const selectedDate = route.params?.selectedDate;
  const parentNoteId = route.params?.parentNoteId;
  
  const isSubNote = !!parentNoteId;

  // Geçici note objesi oluştur (reminder formu için)
  const createTempNote = useCallback((): Note => {
    const now = new Date();
    let noteDateTime: Date;

    if (selectedDate) {
      const timePart = now.toTimeString().split(' ')[0];
      noteDateTime = new Date(`${selectedDate}T${timePart}`);
    } else {
      noteDateTime = now;
    }

    const parsedTags = tags
      .split(/[\s,#]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag !== '#');

    return {
      id: tempNoteId, // Geçici ID kullan
      content: content.trim(),
      createdAt: noteDateTime.toISOString(),
      title: title.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      imageUris: imageUris.length > 0 ? imageUris : undefined,
    };
  }, [tempNoteId, content, title, tags, imageUris, selectedDate]);

  // Cleanup temp reminders when component unmounts
  useEffect(() => {
    return () => {
      // Only cleanup if note wasn't saved (meaning we have unsaved reminders)
      if (hasUnsavedReminders && !savedNote) {
        logger.log('[NewNoteScreen] 🧹 Scheduling cleanup for temp reminders on unmount:', {
          tempNoteId,
          hasUnsavedReminders,
          savedNote: !!savedNote
        });
        
        // ✅ FIX: Use setTimeout instead of async function in cleanup
        setTimeout(() => {
          const cleanupReminders = async () => {
            try {
              const reminderService = ReminderService.getInstance();
              await reminderService.deleteRemindersForNote(tempNoteId);
              logger.log('[NewNoteScreen] ✅ Temp reminders cleaned up successfully');
            } catch (error) {
              logger.error('[NewNoteScreen] ❌ Error cleaning up temp reminders:', error);
            }
          };
          
          cleanupReminders();
        }, 0);
      }
    };
  }, [tempNoteId, hasUnsavedReminders, savedNote]);

  // Load parent note if creating a sub-note
  useEffect(() => {
    const loadParentNote = async () => {
      if (parentNoteId) {
        try {
          const allNotes = await getNotes();
          const parent = allNotes.find(note => note.id === parentNoteId);
          setParentNote(parent || null);
        } catch (error) {
          logger.error('Error loading parent note:', error);
        }
      }
    };
    
    loadParentNote();
  }, [parentNoteId]);

  // Handle navigation events for cleanup
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If note is already saved, allow navigation
      if (savedNote || !hasUnsavedReminders) {
        return;
      }

      // We have unsaved reminders, cleanup before leaving
      logger.log('[NewNoteScreen] 🚨 Navigation detected with unsaved reminders, cleaning up...');
      
      const cleanupAndNavigate = async () => {
        try {
          const reminderService = ReminderService.getInstance();
          await reminderService.deleteRemindersForNote(tempNoteId);
          logger.log('[NewNoteScreen] ✅ Cleaned up temp reminders before navigation');
        } catch (error) {
          logger.error('[NewNoteScreen] ❌ Error cleaning up before navigation:', error);
        }
      };
      
      cleanupAndNavigate();
    });

    return unsubscribe;
  }, [navigation, savedNote, hasUnsavedReminders, tempNoteId]);

  // Helper function: Validate sub-note creation
  const validateSubNoteCreation = useCallback(async (parentId: string): Promise<{ isValid: boolean; shouldProceed: boolean }> => {
    const allNotes = await getNotes();
    const validation = SubNoteUtils.canCreateSubNote(parentId, allNotes);
    
    if (!validation.isValid) {
      Alert.alert(
        'Alt Not Oluşturulamıyor',
        validation.reason || 'Bu not için alt not oluşturulamıyor.',
        [{ text: 'Tamam' }]
      );
      return { isValid: false, shouldProceed: false };
    }

    // Show warnings if any (but allow creation)
    if (validation.warnings && validation.warnings.length > 0) {
      return new Promise(resolve => {
        Alert.alert(
          'Uyarı',
          validation.warnings!.join('\n\n') + '\n\nDevam etmek istiyor musunuz?',
          [
            { text: 'İptal', style: 'cancel', onPress: () => resolve({ isValid: true, shouldProceed: false }) },
            { text: 'Devam Et', onPress: () => resolve({ isValid: true, shouldProceed: true }) }
          ]
        );
      });
    }

    return { isValid: true, shouldProceed: true };
  }, []);

  // Helper function: Process post-creation tasks
  const processPostCreation = useCallback(async (savedNoteId: string, parsedTags: string[]) => {
    // Update reminder noteIds if any reminders were created for temp note
    try {
      const reminderService = ReminderService.getInstance();
      await reminderService.updateReminderNoteId(tempNoteId, savedNoteId);
      setHasUnsavedReminders(false);
      logger.log('[NewNoteScreen] ✅ Updated reminder noteIds:', { tempNoteId, realNoteId: savedNoteId });
    } catch (reminderError) {
      logger.warn('[NewNoteScreen] ⚠️ Error updating reminder noteIds (continuing):', reminderError);
    }
    
    // Update tag cache if note has tags
    if (parsedTags.length > 0) {
      const tagService = TagService.getInstance();
      tagService.updateCache();
    }
  }, [tempNoteId]);

  // Helper function: Create note data
  const createNoteData = useCallback((): { noteData: Partial<Note>; parsedTags: string[]; noteDateTime: Date } => {
    const parsedTags = tags
      .split(/[\s,#]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag !== '#');

    const now = new Date();
    const noteDateTime = selectedDate 
      ? new Date(`${selectedDate}T${now.toTimeString().split(' ')[0]}`)
      : now;

    const noteData: Partial<Note> = {
      title: title.trim() || undefined,
      content: content.trim(),
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      imageUris: imageUris.length > 0 ? imageUris : undefined,
    };

    return { noteData, parsedTags, noteDateTime };
  }, [title, content, tags, imageUris, selectedDate]);

  const save = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('Hata', 'Not içeriği boş olamaz');
      return;
    }

    const { noteData, parsedTags, noteDateTime } = createNoteData();
    
    try {
      let savedNoteId: string;
      let createdNote: Note;
      
      if (isSubNote && parentNoteId) {
        const validation = await validateSubNoteCreation(parentNoteId);
        if (!validation.isValid || !validation.shouldProceed) {
          return;
        }

        const createdSubNoteId = await createSubNote(title.trim(), content.trim(), parentNoteId);
        savedNoteId = createdSubNoteId;
        
        // Create note object for local state
        const subNote: Note = {
          id: createdSubNoteId,
          content: content.trim(),
          createdAt: new Date().toISOString(),
          title: title.trim() || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
          imageUris: imageUris.length > 0 ? imageUris : undefined,
          parentId: parentNoteId,
        };
        
        createdNote = subNote;
        setSavedNote(subNote);
        logger.dev('[NewNoteScreen] ✅ Created sub-note:', savedNoteId);
      } else {
        const note: Note = {
          id: uuid(),
          content: content.trim(),
          createdAt: noteDateTime.toISOString(),
          title: title.trim() || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
          imageUris: imageUris.length > 0 ? imageUris : undefined,
        };
        await addNote(note);
        savedNoteId = note.id;
        createdNote = note;
        setSavedNote(note);
        logger.dev('[NewNoteScreen] ✅ Created note:', savedNoteId);
      }

      await processPostCreation(savedNoteId, parsedTags);
      navigation.goBack();
    } catch (error) {
      logger.error('[NewNoteScreen] ❌ Error saving note:', error);
      Alert.alert('Hata', 'Not kaydedilirken bir hata oluştu');
    }
  }, [content, createNoteData, isSubNote, parentNoteId, validateSubNoteCreation, processPostCreation, navigation]);

  useEffect(() => {
    setupHeaderButtons();
    setupHeaderTitle();
  }, [save, content, isSubNote, parentNote]);

  const setupHeaderTitle = () => {
    navigation.setOptions({
      title: isSubNote ? `Alt Not Ekle` : 'Yeni Not',
    });
  };

  const setupHeaderButtons = () => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {/* Reminder Button - only show if note has content */}
          {content.trim() && (
            <TouchableOpacity 
              onPress={() => {
                logger.dev('[NewNoteScreen] 🔔 Reminder button pressed');
                setShowReminderForm(true);
              }}
              style={[styles.headerButton, { marginRight: 8 }]}
            >
              <Text style={styles.headerButtonText}>🔔</Text>
            </TouchableOpacity>
          )}
          
          {/* Save Button */}
          <TouchableOpacity 
            onPress={save} 
            style={[styles.headerButton, !content.trim() && styles.headerButtonDisabled]}
            disabled={!content.trim()}
          >
            <Text style={[styles.headerButtonText, !content.trim() && styles.headerButtonTextDisabled]}>
              Kaydet
            </Text>
          </TouchableOpacity>
        </View>
      ),
    });
  };

  const handleSave = () => {
    save();
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImageUris(prev => [...prev, ...newUris]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    Alert.alert(
      'Fotoğrafı Kaldır',
      'Bu fotoğrafı kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Kaldır', 
          style: 'destructive', 
          onPress: () => setImageUris(prev => prev.filter((_, index) => index !== indexToRemove))
        },
      ]
    );
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Parent Note Context - only show for sub-notes */}
          {isSubNote && parentNote && (
            <View style={styles.parentContext}>
              <Text style={styles.parentContextLabel}>Ana Not:</Text>
              <Text style={styles.parentContextTitle} numberOfLines={2}>
                {parentNote.title || 'Başlıksız Not'}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.titleInput}
            placeholder={isSubNote ? "Alt not başlığı (isteğe bağlı)" : "Başlık (isteğe bağlı)"}
            placeholderTextColor={Colors.neutral.darkGray}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <TextInput
            style={styles.contentInput}
            placeholder={isSubNote ? "Alt not içeriğini buraya yazın..." : "Bugün neler yaşandı?"}
            placeholderTextColor={Colors.neutral.darkGray}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <TextInput
            style={styles.tagsInput}
            placeholder="Etiketler (örn: #iş #önemli #fikir)"
            placeholderTextColor={Colors.neutral.darkGray}
            value={tags}
            onChangeText={setTags}
          />

          <View style={styles.imageSection}>
            {imageUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                {imageUris.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} contentFit="cover" />
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Text style={styles.addImageText}>
                📷 {imageUris.length > 0 ? 'Fotoğraf Ekle' : 'Fotoğraf Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Reminder Form Modal - çalışır eğer content varsa */}
      {showReminderForm && content.trim() && (
        <ReminderForm
          note={savedNote || createTempNote()} // Kaydedilmiş not varsa onu kullan, yoksa geçici not oluştur
          visible={showReminderForm}
          editingReminder={undefined}
          onSave={(reminder) => {
            logger.dev('[NewNoteScreen] ✅ Reminder created:', reminder);
            setHasUnsavedReminders(true); // Mark that we have unsaved reminders
            setShowReminderForm(false);
            Alert.alert('Başarılı', 'Hatırlatıcı oluşturuldu!', [
              { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);
          }}
          onCancel={() => {
            logger.dev('[NewNoteScreen] ❌ Reminder cancelled');
            setShowReminderForm(false);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  form: {
    padding: 16,
  },
  parentContext: {
    backgroundColor: Colors.accent.coral + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.coral,
  },
  parentContextLabel: {
    fontSize: 12,
    color: Colors.neutral.darkGray,
    marginBottom: 4,
    fontWeight: '600',
  },
  parentContextTitle: {
    fontSize: 14,
    color: Colors.accent.darkBlue,
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.darkGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
    paddingVertical: 12,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    color: Colors.neutral.darkGray,
    minHeight: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
    marginBottom: 16,
  },
  tagsInput: {
    fontSize: 14,
    color: Colors.neutral.darkGray,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
    marginBottom: 16,
  },
  imageSection: {
    marginTop: 8,
  },
  imagesScrollView: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
    width: 120,
    height: 120,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addImageButton: {
    backgroundColor: Colors.primaryPastels[1],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addImageText: {
    color: Colors.neutral.darkGray,
    fontSize: 16,
    fontWeight: '500',
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    color: Colors.accent.darkBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonTextDisabled: {
    color: Colors.neutral.darkGray,
  },
});
