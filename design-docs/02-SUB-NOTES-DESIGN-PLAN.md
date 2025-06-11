# 📝 Sub-Notes System Design Master Plan

**Created:** 11 Haziran 2025  
**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Target:** Complete sub-notes hierarchy system with unlimited depth and independent content

---

## 🎯 **DESIGN OVERVIEW**

This document covers the complete implementation of the Sub-Notes system - a hierarchical note organization feature that allows users to create child notes under parent notes with unlimited nesting depth while maintaining complete independence.

### 📝 **Sub-Notes Target Features**
- **Independent Content**: Each sub-note has its own title, content, and date (never inherits from parent)
- **Home Screen Filtering**: Sub-notes NEVER appear on HomeScreen, only parent notes visible
- **NoteCard Badge**: Parent notes show "+X alt not" count only (no content preview of sub-notes)
- **Unlimited Hierarchy**: Sub-notes can have their own sub-notes (unlimited depth allowed)
- **Notification Support**: Sub-notes can have their own reminders independently
- **Detail Screen Only**: Sub-notes only visible and manageable in NoteDetailScreen

---

## ✅ **IMPLEMENTATION ROADMAP**

### ✅ **PHASE 1: DATA MODEL FOUNDATION** *(Day 1 - 6 hours)*

#### 1.1 Note Interface Enhancement
**File:** `/src/types/Note.ts`

**Current State:**
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  imageUris?: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Target State:**
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  imageUris?: string[];
  createdAt: string;
  updatedAt: string;
  
  // NEW SUB-NOTES FIELDS
  parentId?: string;           // If this is a sub-note, parent's ID
  reminders?: string[];        // Array of reminder IDs (for future notification system)
  scheduledDate?: string;      // For smart date suggestions (future)
}

// Helper type for better TypeScript support
type ParentNote = Note & { parentId: undefined };
type SubNote = Note & { parentId: string };
```

**Actions:**
- [ ] Add `parentId?: string` field to Note interface
- [ ] Add `reminders?: string[]` field for future notification integration
- [ ] Add `scheduledDate?: string` field for smart date features
- [ ] Create helper types for ParentNote and SubNote
- [ ] Ensure backward compatibility with existing notes

#### 1.2 Storage Service Enhancement
**File:** `/src/services/storage.ts`

**New Methods to Add:**
```typescript
class StorageService {
  // ...existing methods...
  
  // SUB-NOTES SPECIFIC METHODS
  
  /**
   * Get all parent notes (notes without parentId)
   * Used for HomeScreen display
   */
  async getParentNotes(): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => !note.parentId);
  }
  
  /**
   * Get all sub-notes for a specific parent
   */
  async getSubNotes(parentId: string): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    return allNotes
      .filter(note => note.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  /**
   * Get count of sub-notes for a parent
   * Used for badge display
   */
  async getSubNoteCount(parentId: string): Promise<number> {
    const subNotes = await this.getSubNotes(parentId);
    return subNotes.length;
  }
  
  /**
   * Create a new sub-note under a parent
   */
  async createSubNote(parentId: string, noteData: Partial<Note>): Promise<Note> {
    // Validate parent exists (unlimited depth allowed)
    const parentNote = await this.getNoteById(parentId);
    if (!parentNote) {
      throw new Error('Parent note not found');
    }
    
    const newSubNote: Note = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: noteData.title || '',
      content: noteData.content || '',
      date: noteData.date || new Date().toDateString(),
      tags: noteData.tags || [],
      imageUris: noteData.imageUris || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId, // Set parent relationship
    };
    
    const allNotes = await this.getAllNotes();
    allNotes.push(newSubNote);
    await this.saveNotes(allNotes);
    
    return newSubNote;
  }
  
  /**
   * Delete a sub-note
   */
  async deleteSubNote(subNoteId: string): Promise<void> {
    const allNotes = await this.getAllNotes();
    const subNote = allNotes.find(note => note.id === subNoteId);
    
    if (!subNote || !subNote.parentId) {
      throw new Error('Sub-note not found');
    }
    
    const updatedNotes = allNotes.filter(note => note.id !== subNoteId);
    await this.saveNotes(updatedNotes);
  }
  
  /**
   * Convert a regular note to a sub-note
   */
  async convertToSubNote(noteId: string, parentId: string): Promise<void> {
    const allNotes = await this.getAllNotes();
    const noteIndex = allNotes.findIndex(note => note.id === noteId);
    const parentNote = allNotes.find(note => note.id === parentId);
    
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }
    if (!parentNote) {
      throw new Error('Parent note not found');
    }
    if (allNotes[noteIndex].parentId) {
      throw new Error('Note is already a sub-note');
    }
    
    // Allow conversion even if note has sub-notes (unlimited depth)
    
    allNotes[noteIndex].parentId = parentId;
    allNotes[noteIndex].updatedAt = new Date().toISOString();
    
    await this.saveNotes(allNotes);
  }
  
  /**
   * Get all notes related to a parent (parent + all its sub-notes)
   */
  async getNoteFamily(parentId: string): Promise<{ parent: Note; subNotes: Note[] }> {
    const allNotes = await this.getAllNotes();
    const parent = allNotes.find(note => note.id === parentId && !note.parentId);
    const subNotes = allNotes.filter(note => note.parentId === parentId);
    
    if (!parent) {
      throw new Error('Parent note not found');
    }
    
    return { parent, subNotes };
  }
}
```

**Actions:**
- [ ] Implement all sub-note specific storage methods
- [ ] Add proper error handling and validation
- [ ] Ensure 2-level hierarchy enforcement
- [ ] Add TypeScript types for all new methods
- [ ] Test backward compatibility with existing notes

#### 1.3 Utility Functions
**File:** `/src/utils/subNoteUtils.ts` *(NEW FILE)*

**Target Implementation:**
```typescript
import { Note } from '../types/Note';

/**
 * Utility functions for sub-note operations
 */
export class SubNoteUtils {
  
  /**
   * Check if a note is a sub-note
   */
  static isSubNote(note: Note): boolean {
    return !!note.parentId;
  }
  
  /**
   * Check if a note is a parent note (has sub-notes)
   */
  static isParentNote(note: Note, allNotes: Note[]): boolean {
    return !note.parentId && allNotes.some(n => n.parentId === note.id);
  }
  
  /**
   * Get sub-notes for a parent from a notes array
   */
  static getSubNotesFromArray(parentId: string, allNotes: Note[]): Note[] {
    return allNotes
      .filter(note => note.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  /**
   * Get sub-note count for a parent from a notes array
   */
  static getSubNoteCountFromArray(parentId: string, allNotes: Note[]): number {
    return allNotes.filter(note => note.parentId === parentId).length;
  }
  
  /**
   * Filter out sub-notes from a notes array (for HomeScreen)
   */
  static filterParentNotes(allNotes: Note[]): Note[] {
    return allNotes.filter(note => !note.parentId);
  }
  
  /**
   * Validate if a note can become a sub-note of another note
   */
  static canBecomeSubNote(noteId: string, parentId: string, allNotes: Note[]): {
    valid: boolean;
    reason?: string;
  } {
    const note = allNotes.find(n => n.id === noteId);
    const parent = allNotes.find(n => n.id === parentId);
    
    if (!note) return { valid: false, reason: 'Note not found' };
    if (!parent) return { valid: false, reason: 'Parent note not found' };
    if (note.id === parent.id) return { valid: false, reason: 'Note cannot be its own parent' };
    
    // Check for circular dependency: prevent making a parent into a sub-note of its descendant
    if (this.isDescendantOf(parentId, noteId, allNotes)) {
      return { valid: false, reason: 'Cannot create circular dependency' };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if a note is a descendant of another note (to prevent circular dependencies)
   */
  static isDescendantOf(noteId: string, potentialAncestorId: string, allNotes: Note[]): boolean {
    const note = allNotes.find(n => n.id === noteId);
    if (!note || !note.parentId) return false;
    
    if (note.parentId === potentialAncestorId) return true;
    
    return this.isDescendantOf(note.parentId, potentialAncestorId, allNotes);
  }
  
  /**
   * Generate sub-note display text for badges
   */
  static generateSubNoteBadgeText(count: number): string {
    return `+${count} alt not`;
  }
  
  /**
   * Get the hierarchy path for a note (for breadcrumbs)
   */
  static getNotePath(note: Note, allNotes: Note[]): Note[] {
    const path: Note[] = [];
    
    // Recursively build path from note to root
    const buildPath = (currentNote: Note) => {
      path.unshift(currentNote);
      if (currentNote.parentId) {
        const parent = allNotes.find(n => n.id === currentNote.parentId);
        if (parent) {
          buildPath(parent);
        }
      }
    };
    
    buildPath(note);
    return path;
  }
  
  /**
   * Get full hierarchy level (depth) of a note
   */
  static getNoteDepth(note: Note, allNotes: Note[]): number {
    let depth = 0;
    let currentNote = note;
    
    while (currentNote.parentId) {
      depth++;
      const parent = allNotes.find(n => n.id === currentNote.parentId);
      if (!parent) break;
      currentNote = parent;
    }
    
    return depth;
  }
  
  /**
   * Get all descendant notes (children, grandchildren, etc.)
   */
  static getAllDescendants(parentId: string, allNotes: Note[]): Note[] {
    const descendants: Note[] = [];
    
    const findDescendants = (currentParentId: string) => {
      const children = allNotes.filter(note => note.parentId === currentParentId);
      for (const child of children) {
        descendants.push(child);
        findDescendants(child.id); // Recursively find sub-children
      }
    };
    
    findDescendants(parentId);
    return descendants;
  }
}
```

**Actions:**
- [ ] Create subNoteUtils.ts with all utility functions
- [ ] Add comprehensive TypeScript types
- [ ] Include validation functions for all operations
- [ ] Add unit tests for utility functions

---

### ✅ **PHASE 2: UI COMPONENTS DEVELOPMENT** *(Day 2 - 8 hours)*

#### 2.1 SubNoteBadge Component
**File:** `/src/components/SubNoteBadge.tsx` *(NEW FILE)*

**Target Implementation:**
```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../theme';

interface SubNoteBadgeProps {
  count: number;
  onPress: () => void;
  style?: any;
}

export const SubNoteBadge: React.FC<SubNoteBadgeProps> = ({ 
  count, 
  onPress, 
  style 
}) => {
  if (count === 0) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.badge, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons 
          name="document-text-outline" 
          size={12} 
          color={Colors.accent.darkBlue} 
          style={styles.icon}
        />
        <Text style={styles.text}>+{count} alt not</Text>
        <Ionicons 
          name="chevron-forward" 
          size={12} 
          color={Colors.accent.darkBlue}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.neutral.lightGray1,
    borderColor: Colors.accent.darkBlue,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    fontWeight: '600',
    marginRight: 4,
  },
});
```

**Actions:**
- [ ] Create SubNoteBadge component with proper styling
- [ ] Add Ionicons for visual hierarchy
- [ ] Implement touch feedback and proper accessibility
- [ ] Test with various count numbers

#### 2.2 SubNoteCard Component
**File:** `/src/components/SubNoteCard.tsx` *(NEW FILE)*

**Target Implementation:**
```typescript
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../theme';
import { Note } from '../types/Note';
import { formatTime } from '../utils/dateUtils';

interface SubNoteCardProps {
  note: Note;
  parentNote: Note;
  onPress: () => void;
  onLongPress?: () => void;
}

export const SubNoteCard: React.FC<SubNoteCardProps> = ({ 
  note, 
  parentNote,
  onPress, 
  onLongPress 
}) => {
  const hasImages = note.imageUris && note.imageUris.length > 0;
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* Sub-note indicator */}
      <View style={styles.indicator} />
      
      {/* Header with parent context */}
      <View style={styles.header}>
        <View style={styles.parentContext}>
          <Ionicons name="chevron-up" size={12} color={Colors.textGray} />
          <Text style={styles.parentTitle} numberOfLines={1}>
            {parentNote.title || 'Ana Not'}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(note.createdAt)}</Text>
      </View>
      
      {/* Sub-note title */}
      {note.title && (
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>
      )}
      
      {/* Content with limited lines when images present */}
      <Text 
        style={styles.content} 
        numberOfLines={hasImages ? 2 : 3}
      >
        {note.content}
      </Text>
      
      {/* Images preview (if any) */}
      {hasImages && (
        <View style={styles.imagesContainer}>
          <Image 
            source={{ uri: note.imageUris![0] }} 
            style={styles.previewImage}
          />
          {note.imageUris!.length > 1 && (
            <View style={styles.moreImagesIndicator}>
              <Text style={styles.moreImagesText}>
                +{note.imageUris!.length - 1}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Tags (simplified for sub-notes) */}
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{note.tags.length - 2}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.coral,
    marginLeft: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  indicator: {
    position: 'absolute',
    left: -3,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.accent.coral,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  parentContext: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentTitle: {
    ...Typography.caption,
    color: Colors.textGray,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    ...Typography.timestamp,
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: 4,
  },
  content: {
    ...Typography.body,
    color: Colors.neutral.darkGray,
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  moreImagesIndicator: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 4,
  },
  moreImagesText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.accent.coral + '30',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    ...Typography.tag,
    color: Colors.accent.darkBlue,
  },
  moreTagsText: {
    ...Typography.caption,
    color: Colors.textGray,
    fontWeight: '600',
  },
});
```

**Actions:**
- [ ] Create SubNoteCard with distinct visual hierarchy
- [ ] Add parent note context display
- [ ] Implement left border indicator for sub-note identification
- [ ] Test with various content lengths and image counts

#### 2.3 SubNoteModal Component
**File:** `/src/components/SubNoteModal.tsx` *(NEW FILE)*

**Target Implementation:**
```typescript
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
  Keyboard,
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
      setTitle(editingSubNote.title);
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
      title: title.trim(),
      content: content.trim(),
      tags,
      date: new Date().toDateString(),
    };
    
    if (isEditing) {
      subNoteData.id = editingSubNote!.id;
      subNoteData.updatedAt = new Date().toISOString();
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
```

**Actions:**
- [ ] Create SubNoteModal with complete form functionality
- [ ] Add proper keyboard handling and input validation
- [ ] Implement tag management within the modal
- [ ] Add delete functionality for editing mode

---

### ✅ **PHASE 3: SCREEN INTEGRATION** *(Day 3 - 8 hours)*

#### 3.1 HomeScreen Enhancement
**File:** `/src/screens/HomeScreen.tsx`

**Key Changes Needed:**
1. Load only parent notes (filter out sub-notes)
2. Add sub-note count badges to NoteCards
3. Handle sub-note badge navigation

**Implementation Plan:**
```typescript
// HomeScreen.tsx updates
import { SubNoteUtils } from '../utils/subNoteUtils';
import { StorageService } from '../services/storage';

const HomeScreen: React.FC = () => {
  const [parentNotes, setParentNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadNotes = async () => {
    try {
      const storageService = new StorageService();
      const allNotesData = await storageService.getAllNotes();
      const todayParentNotes = allNotesData
        .filter(note => 
          note.date === new Date().toDateString() && 
          !SubNoteUtils.isSubNote(note)
        );
      
      setAllNotes(allNotesData);
      setParentNotes(todayParentNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };
  
  const getSubNoteCount = (parentId: string): number => {
    return SubNoteUtils.getSubNoteCountFromArray(parentId, allNotes);
  };
  
  const handleSubNotesBadgePress = (parentNote: Note) => {
    navigation.navigate('NoteDetail', { note: parentNote, focusSubNotes: true });
  };
  
  // In render function:
  return (
    <View style={styles.container}>
      {/* ...existing header and date section... */}
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {parentNotes.length > 0 ? (
          parentNotes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              index={index}
              onPress={() => navigation.navigate('NoteDetail', { note })}
              subNoteCount={getSubNoteCount(note.id)}
              onSubNotesPress={() => handleSubNotesBadgePress(note)}
            />
          ))
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="Henüz bugün bir not yazmadınız"
            subtitle="Bugünün anılarını kaydetmek için + butonuna dokunun"
          />
        )}
      </ScrollView>
      
      <FAB onPress={() => navigation.navigate('NewNote')} />
    </View>
  );
};
```

**Actions:**
- [ ] Update HomeScreen to filter parent notes only
- [ ] Add sub-note count calculation and badge handling
- [ ] Implement sub-note badge navigation
- [ ] Test performance with large note collections

#### 3.2 NoteCard Component Enhancement
**File:** `/src/components/NoteCard.tsx`

**Key Changes Needed:**
1. Add SubNoteBadge when sub-note count > 0
2. Modify content preview when sub-notes exist
3. Handle badge press events

**Implementation Updates:**
```typescript
import { SubNoteBadge } from './SubNoteBadge';

interface NoteCardProps {
  note: Note;
  index: number;
  onPress: () => void;
  subNoteCount?: number;        // NEW
  onSubNotesPress?: () => void; // NEW
  showSubNoteBadge?: boolean;   // NEW (default true)
}

export const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  index, 
  onPress,
  subNoteCount = 0,
  onSubNotesPress,
  showSubNoteBadge = true,
}) => {
  const backgroundColor = Colors.primaryPastels[index % 4];
  const hasImages = note.imageUris && note.imageUris.length > 0;
  const hasSubNotes = subNoteCount > 0;
  
  // Reduce content lines when sub-notes exist
  const contentLines = hasSubNotes ? (hasImages ? 1 : 2) : (hasImages ? 2 : 3);
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* ...existing header section... */}
      
      {/* ...existing images section... */}
      
      {/* Content - reduced lines when sub-notes exist */}
      <Text 
        style={styles.content} 
        numberOfLines={contentLines}
      >
        {note.content}
      </Text>
      
      {/* ...existing tags section... */}
      
      {/* Sub-Notes Badge */}
      {showSubNoteBadge && hasSubNotes && onSubNotesPress && (
        <SubNoteBadge 
          count={subNoteCount}
          onPress={onSubNotesPress}
          style={styles.subNoteBadge}
        />
      )}
    </TouchableOpacity>
  );
};

// Add to styles:
const styles = StyleSheet.create({
  // ...existing styles...
  subNoteBadge: {
    marginTop: 8,
  },
});
```

**Actions:**
- [ ] Add SubNoteBadge integration to NoteCard
- [ ] Adjust content preview lines based on sub-note presence
- [ ] Test badge positioning and touch handling
- [ ] Ensure backward compatibility with existing note cards

#### 3.3 NoteDetailScreen Enhancement
**File:** `/src/screens/NoteDetailScreen.tsx`

**Key Changes Needed:**
1. Add sub-notes section
2. Sub-note creation and management
3. Sub-note list display
4. Sub-note modal integration

**Implementation Plan:**
```typescript
import { SubNoteCard } from '../components/SubNoteCard';
import { SubNoteModal } from '../components/SubNoteModal';
import { SubNoteUtils } from '../utils/subNoteUtils';

interface NoteDetailScreenProps {
  route: RouteProp<{
    params: {
      note: Note;
      focusSubNotes?: boolean; // NEW - for navigation from badge
    };
  }>;
  navigation: NavigationProp<any>;
}

const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({ route, navigation }) => {
  const [note, setNote] = useState<Note>(route.params.note);
  const [subNotes, setSubNotes] = useState<Note[]>([]);
  const [showSubNoteModal, setShowSubNoteModal] = useState(false);
  const [editingSubNote, setEditingSubNote] = useState<Note | undefined>();
  
  const isParentNote = !SubNoteUtils.isSubNote(note);
  const { focusSubNotes = false } = route.params;
  
  useEffect(() => {
    if (isParentNote) {
      loadSubNotes();
    }
  }, [note.id, isParentNote]);
  
  useEffect(() => {
    // Auto-scroll to sub-notes section if navigated from badge
    if (focusSubNotes && subNotesRef.current) {
      setTimeout(() => {
        subNotesRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [focusSubNotes, subNotes]);
  
  const loadSubNotes = async () => {
    try {
      const storageService = new StorageService();
      const noteSubNotes = await storageService.getSubNotes(note.id);
      setSubNotes(noteSubNotes);
    } catch (error) {
      console.error('Error loading sub-notes:', error);
    }
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
    try {
      const storageService = new StorageService();
      
      if (editingSubNote) {
        // Update existing sub-note
        await storageService.updateNote({
          ...editingSubNote,
          ...subNoteData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new sub-note
        await storageService.createSubNote(note.id, subNoteData);
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
      const storageService = new StorageService();
      await storageService.deleteSubNote(editingSubNote.id);
      await loadSubNotes();
      setShowSubNoteModal(false);
      setEditingSubNote(undefined);
    } catch (error) {
      console.error('Error deleting sub-note:', error);
      Alert.alert('Hata', 'Alt not silinemedi.');
    }
  };
  
  // In render function:
  const renderSubNotesSection = () => {
    if (!isParentNote) return null;
    
    return (
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
                onPress={() => navigation.navigate('NoteDetail', { note: subNote })}
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
    );
  };
  
  return (
    <ScrollView ref={subNotesRef} style={styles.container}>
      {/* ...existing note content sections... */}
      
      {/* Sub-Notes Section */}
      {renderSubNotesSection()}
      
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

// Additional styles:
const styles = StyleSheet.create({
  // ...existing styles...
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
```

**Actions:**
- [ ] Add sub-notes section to NoteDetailScreen
- [ ] Implement sub-note creation, editing, and deletion
- [ ] Add auto-scroll functionality for badge navigation
- [ ] Test complete sub-note management flow

---

## 🔧 **TESTING & VALIDATION**

### ✅ **Test Scenarios**

#### **Basic Functionality Tests**
- [ ] Create parent note → appears on HomeScreen
- [ ] Create sub-note → does NOT appear on HomeScreen
- [ ] Parent note shows correct "+X alt not" badge
- [ ] Sub-note badge is clickable and navigates correctly
- [ ] Sub-note has independent title, content, date

#### **Hierarchy Enforcement Tests**
- [ ] Cannot create sub-note under another sub-note (2-level max)
- [ ] Cannot convert note with sub-notes to become a sub-note
- [ ] Parent deletion handling (what happens to sub-notes?)
- [ ] Sub-note deletion doesn't affect parent or siblings

#### **UI/UX Tests**
- [ ] SubNoteCard visually distinct from regular NoteCard
- [ ] Parent context displayed clearly in sub-notes
- [ ] Modal form validation works correctly
- [ ] Badge positioning and styling consistent
- [ ] Performance with many sub-notes

#### **Edge Cases**
- [ ] Empty sub-note content handling
- [ ] Very long sub-note titles/content
- [ ] Sub-notes with many images/tags
- [ ] Rapid creation/deletion of sub-notes
- [ ] App restart with sub-notes data integrity

### ✅ **Performance Considerations**

#### **Memory Management**
- Sub-note counts calculated efficiently
- Lazy loading for large sub-note collections
- Proper cleanup of modal states

#### **Storage Optimization**
- Batch operations for multiple sub-note changes
- Efficient parent-child relationship queries
- Proper indexing for sub-note lookups

---

## 🚀 **SUCCESS CRITERIA**

### ✅ **Core Requirements Met**
- [ ] Sub-notes have completely independent content, title, and date
- [ ] Sub-notes never appear on HomeScreen (filtered out)
- [ ] Parent notes show "+X alt not" badge without content preview
- [ ] Maximum 2-level hierarchy strictly enforced
- [ ] Sub-note creation, editing, deletion all functional
- [ ] Visual hierarchy clear and intuitive

### ✅ **User Experience Excellence**
- [ ] Intuitive sub-note creation flow
- [ ] Clear parent-child relationship visualization
- [ ] Smooth navigation between parent and sub-notes
- [ ] Helpful empty states and loading indicators
- [ ] Consistent design language throughout

### ✅ **Technical Excellence**
- [ ] Robust data model with proper validation
- [ ] Efficient storage and retrieval operations
- [ ] Clean component architecture
- [ ] Comprehensive error handling
- [ ] Backward compatibility maintained

---

## 🔄 **NEXT STEPS**

1. **Begin Implementation**: Start with Phase 1 - Data Model Foundation
2. **Iterative Testing**: Test each phase thoroughly before proceeding
3. **User Feedback**: Gather feedback on sub-note UX patterns
4. **Integration Prep**: Prepare for notification system integration
5. **Performance Monitoring**: Watch for any performance impacts

---

**Implementation Status:** 🚀 **READY TO START**  
**Estimated Completion:** 3 days  
**Next Action:** Begin Phase 1 - Update Note interface and storage service
