import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../theme';
import { Note } from '../types/Note';

interface SubNoteModalProps {
  visible: boolean;
  parentNote: Note;
  editingSubNote?: Note;
  onSave: (subNoteData: Partial<Note>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const SubNoteModal: React.FC<SubNoteModalProps> = ({
  visible,
  parentNote,
  editingSubNote,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const isEditing = !!editingSubNote;
  
  useEffect(() => {
    if (editingSubNote) {
      setTitle(editingSubNote.title || '');
      setContent(editingSubNote.content);
      setTags(editingSubNote.tags || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
    setTagInput('');
  }, [editingSubNote, visible]);
  
  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Hata', 'Alt not içeriği boş olamaz.');
      return;
    }
    
    const subNoteData: Partial<Note> = {
      title: title.trim() || undefined,
      content: content.trim(),
      tags,
    };
    
    if (isEditing && editingSubNote) {
      subNoteData.id = editingSubNote.id;
    }
    
    onSave(subNoteData);
  };
  
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase().replace('#', '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Alt Notu Sil',
      'Bu alt notu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: onDelete 
        }
      ]
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Alt Notu Düzenle' : 'Alt Not Ekle'}
            </Text>
            <Text style={styles.parentContext}>
              Ana Not: {parentNote.title || 'Başlıksız Not'}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Başlık (İsteğe Bağlı)</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Alt not başlığı..."
              placeholderTextColor={Colors.neutral.mediumGray}
              maxLength={100}
            />
          </View>
          
          {/* Content Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>İçerik *</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Alt not içeriğini buraya yazın..."
              placeholderTextColor={Colors.neutral.mediumGray}
              multiline
              textAlignVertical="top"
              autoFocus={!isEditing}
            />
          </View>
          
          {/* Tags Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Etiketler</Text>
            
            {/* Tag Input */}
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Etiket ekle..."
                placeholderTextColor={Colors.neutral.mediumGray}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={styles.addTagButton} 
                onPress={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Ionicons 
                  name="add" 
                  size={20} 
                  color={tagInput.trim() ? Colors.accent.darkBlue : Colors.neutral.mediumGray}
                />
              </TouchableOpacity>
            </View>
            
            {/* Tags Display */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Ionicons 
                      name="close" 
                      size={14} 
                      color={Colors.accent.darkBlue}
                      style={styles.tagRemove}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Delete Button (only when editing) */}
        {isEditing && onDelete && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.deleteText}>Alt Notu Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.h2,
    textAlign: 'center',
  },
  parentContext: {
    ...Typography.caption,
    color: Colors.textGray,
    textAlign: 'center',
    marginTop: 2,
  },
  cancelText: {
    ...Typography.button,
    color: Colors.textGray,
  },
  saveText: {
    ...Typography.button,
    color: Colors.accent.darkBlue,
  },
  content: {
    flex: 1,
    padding: Layout.screenPadding,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.neutral.darkGray,
  },
  titleInput: {
    ...Typography.bodyLarge,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.neutral.white,
  },
  contentInput: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    backgroundColor: Colors.neutral.white,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
    borderRadius: 8,
    backgroundColor: Colors.neutral.white,
  },
  tagInput: {
    ...Typography.body,
    flex: 1,
    padding: 12,
  },
  addTagButton: {
    padding: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.coral + '30',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    ...Typography.tag,
    color: Colors.accent.darkBlue,
  },
  tagRemove: {
    marginLeft: 4,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteText: {
    ...Typography.button,
    color: Colors.error,
    marginLeft: 8,
  },
});
