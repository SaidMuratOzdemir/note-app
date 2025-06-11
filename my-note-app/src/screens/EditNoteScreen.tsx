import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Note } from '../types/Note';
import { Reminder } from '../types/Reminder';
import { getNotes, updateNote } from '../services/storage';
import { TagService } from '../services/tagService';
import { ReminderService } from '../services/reminderService';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/RootStack';

type EditNoteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditNote'>;
type EditNoteScreenRouteProp = RouteProp<RootStackParamList, 'EditNote'>;

export const EditNoteScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [originalNote, setOriginalNote] = useState<Note | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  
  const navigation = useNavigation<EditNoteScreenNavigationProp>();
  const route = useRoute<EditNoteScreenRouteProp>();
  const reminderService = ReminderService.getInstance();

  const loadNote = async () => {
    const notes = await getNotes();
    const note = notes.find(n => n.id === route.params.id);
    if (note) {
      setOriginalNote(note);
      setTitle(note.title || '');
      setContent(note.content);
      setTags(note.tags?.join(' ') || ''); // Join with spaces instead of #
      setImageUris(note.imageUris || []);
    }
  };

  const save = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('Hata', 'Not içeriği boş olamaz');
      return;
    }

    if (!originalNote) return;

    // Better tag parsing - handle both #tag and tag formats
    const parsedTags = tags
      .split(/[\s,#]+/) // Split by spaces, commas, or hashtags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag !== '#');

    const updatedNote: Note = {
      ...originalNote,
      title: title.trim() || undefined,
      content: content.trim(),
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      imageUris: imageUris.length > 0 ? imageUris : undefined,
    };

    await updateNote(updatedNote);
    
    // Update tag cache if note has tags (new or modified)
    const originalTags = originalNote?.tags || [];
    const newTags = parsedTags || [];
    if (originalTags.length > 0 || newTags.length > 0) {
      const tagService = TagService.getInstance();
      tagService.updateCache();
    }
    
    navigation.goBack();
  }, [title, content, tags, imageUris, originalNote, navigation]);

  const setupHeaderButtons = () => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            onPress={() => setShowReminderForm(true)} 
            style={[styles.headerButton, { marginRight: 8 }]}
          >
            <Text style={styles.headerButtonText}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  };

  useEffect(() => {
    loadNote();
  }, []);

  useEffect(() => {
    setupHeaderButtons();
  }, [save, content]);

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <TextInput
          style={styles.titleInput}
          placeholder="Başlık (isteğe bağlı)"
          placeholderTextColor={Colors.neutral.darkGray}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Bugün neler yaşandı?"
          placeholderTextColor={Colors.neutral.darkGray}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
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

        {/* Simple Reminder Indicator */}
        {originalNote && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: Colors.primaryPastels[1], borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: Colors.accent.darkBlue }}>
              📝 Hatırlatıcı ayarlamak için yukarıdaki 🔔 butonuna dokunun
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
});
