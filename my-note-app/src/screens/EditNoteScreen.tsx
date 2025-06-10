import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Note } from '../types/Note';
import { getNotes, updateNote } from '../services/storage';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/RootStack';

type EditNoteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditNote'>;
type EditNoteScreenRouteProp = RouteProp<RootStackParamList, 'EditNote'>;

export const EditNoteScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [originalNote, setOriginalNote] = useState<Note | null>(null);
  
  const navigation = useNavigation<EditNoteScreenNavigationProp>();
  const route = useRoute<EditNoteScreenRouteProp>();

  const loadNote = async () => {
    const notes = await getNotes();
    const note = notes.find(n => n.id === route.params.id);
    if (note) {
      setOriginalNote(note);
      setTitle(note.title || '');
      setContent(note.content);
      setTags(note.tags?.join(' ') || ''); // Join with spaces instead of #
      setImageUri(note.imageUri);
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
      imageUri,
    };

    await updateNote(updatedNote);
    navigation.goBack();
  }, [title, content, tags, imageUri, originalNote, navigation]);

  const setupHeaderButtons = () => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={save} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Kaydet</Text>
        </TouchableOpacity>
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Fotoğrafı Kaldır',
      'Bu fotoğrafı kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kaldır', style: 'destructive', onPress: () => setImageUri(undefined) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <TextInput
          style={styles.titleInput}
          placeholder="Başlık (isteğe bağlı)"
          placeholderTextColor={colors.placeholder}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Bugün neler yaşandı?"
          placeholderTextColor={colors.placeholder}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TextInput
          style={styles.tagsInput}
          placeholder="Etiketler (örn: #iş #önemli #fikir)"
          placeholderTextColor={colors.placeholder}
          value={tags}
          onChangeText={setTags}
        />

        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Text style={styles.addImageText}>📷 Fotoğraf Ekle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    color: colors.text,
    minHeight: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tagsInput: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  imageSection: {
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
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
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addImageText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});
