import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { HierarchyPerformanceOptimizer } from '../utils/hierarchyPerformanceOptimizer';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';

const NOTES_KEY = 'notes';

// Cache for storage validation to prevent repeated logging
let lastValidationLog = 0;
let invalidNoteCount = 0;

export async function getNotes(): Promise<Note[]> {
  try {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    
    if (!json) return [];
    
    const parsed = JSON.parse(json);
    
    if (!Array.isArray(parsed)) {
      logger.error('[Storage] Invalid data format - not an array, resetting to empty');
      return [];
    }
    
    // Enhanced validation with better logging and auto-cleanup
    const validNotes: Note[] = [];
    const invalidNotes: any[] = [];
    
    parsed.forEach(note => {
      // ✅ Fixed validation: title is optional, only check required fields
      if (!note || typeof note.id !== 'string' || typeof note.content !== 'string') {
        invalidNotes.push(note);
        return;
      }
      
      // Ensure required Note properties and migrate old data format
      const validatedNote: Note = {
        id: note.id,
        ...(note.title && { title: note.title }), // Only add title if exists
        content: note.content || '',
        createdAt: note.createdAt || new Date().toISOString(),
        tags: Array.isArray(note.tags) ? note.tags : [],
        imageUris: Array.isArray(note.imageUris) ? note.imageUris : (note.imageUri ? [note.imageUri] : []),
        ...(note.parentId && { parentId: note.parentId }),
        ...(note.lastAccessed && { lastAccessed: note.lastAccessed })
      };
      
      validNotes.push(validatedNote);
    });
    
    // Smart logging - only log once per minute and show summary
    const now = Date.now();
    if (invalidNotes.length > 0) {
      if (now - lastValidationLog > 60000) { // 1 minute throttle
        const uniqueInvalidTypes = [...new Set(invalidNotes.map(note => 
          !note ? 'null' : 
          !note.id ? 'missing-id' : 
          !note.title ? 'missing-title' : 'unknown'
        ))];
        
        logger.warn(`[Storage] 🧹 Found ${invalidNotes.length} invalid notes (types: ${uniqueInvalidTypes.join(', ')}). Valid notes: ${validNotes.length}`);
        lastValidationLog = now;
        invalidNoteCount = invalidNotes.length;
      }
    }
    
    return validNotes;
  } catch (error) {
    logger.error('[Storage] Failed to parse notes JSON:', error);
    
    // Backup corrupted data for recovery
    try {
      const json = await AsyncStorage.getItem(NOTES_KEY);
      if (json) {
        await AsyncStorage.setItem(`${NOTES_KEY}_corrupted_${Date.now()}`, json);
        logger.dev('[Storage] Backed up corrupted data');
      }
    } catch (backupError) {
      logger.error('[Storage] Failed to backup corrupted data:', backupError);
    }
    
    return [];
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  try {
    const json = JSON.stringify(notes);
    await AsyncStorage.setItem(NOTES_KEY, json);
  } catch (error) {
    throw error;
  }
}

export async function addNote(note: Note): Promise<string> {
  try {
    const notes = await getNotes();
    const noteToAdd = { ...note, id: note.id || uuid() };
    notes.push(noteToAdd);
    await saveNotes(notes);
    return noteToAdd.id;
  } catch (error) {
    logger.error('Error in addNote:', error);
    throw error;
  }
}

export async function updateNote(updatedNote: Note): Promise<void> {
  try {
    const notes = await getNotes();
    const index = notes.findIndex(note => note.id === updatedNote.id);
    
    if (index !== -1) {
      const oldNote = notes[index];
      notes[index] = updatedNote;
      await saveNotes(notes);
      
      // Invalidate cache for performance optimizer if hierarchy changed
      const optimizer = HierarchyPerformanceOptimizer.getInstance();
      if (oldNote.parentId && oldNote.parentId !== updatedNote.parentId) {
        optimizer.invalidateCache(oldNote.parentId, notes);
      }
      if (updatedNote.parentId && updatedNote.parentId !== oldNote.parentId) {
        optimizer.invalidateCache(updatedNote.parentId, notes);
      }
    }
  } catch (error) {
    throw error;
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    const notes = await getNotes();
    const noteToDelete = notes.find(note => note.id === id);
    const filteredNotes = notes.filter(note => note.id !== id);
    await saveNotes(filteredNotes);
    
    // Invalidate cache for performance optimizer
    const optimizer = HierarchyPerformanceOptimizer.getInstance();
    if (noteToDelete?.parentId) {
      optimizer.invalidateCache(noteToDelete.parentId, filteredNotes);
    }
    
    // Clean up related reminders
    try {
      const reminders = await AsyncStorage.getItem('reminders');
      if (reminders) {
        const reminderArray = JSON.parse(reminders);
        const filteredReminders = reminderArray.filter((reminder: any) => reminder.noteId !== id);
        await AsyncStorage.setItem('reminders', JSON.stringify(filteredReminders));
        logger.dev(`[Storage] Cleaned up reminders for deleted note: ${id}`);
      }
    } catch (reminderError) {
      logger.warn(`[Storage] Failed to clean up reminders for note ${id}:`, reminderError);
    }
    
  } catch (error) {
    logger.error('Error in deleteNote:', error);
    throw error;
  }
}

export async function deleteNoteAndChildren(noteId: string): Promise<void> {
  try {
    const notes = await getNotes();
    const noteIdsToDelete = [noteId];
    
    // Get all descendants recursively
    const getDescendantIds = (parentId: string): string[] => {
      const children = notes.filter(n => n.parentId === parentId);
      const descendantIds: string[] = [];
      
      for (const child of children) {
        descendantIds.push(child.id);
        descendantIds.push(...getDescendantIds(child.id));
      }
      
      return descendantIds;
    };
    
    noteIdsToDelete.push(...getDescendantIds(noteId));
    
    // Delete all notes and children
    const remainingNotes = notes.filter(note => !noteIdsToDelete.includes(note.id));
    await saveNotes(remainingNotes);
    
    // Invalidate cache for performance optimizer
    const optimizer = HierarchyPerformanceOptimizer.getInstance();
    const deletedNote = notes.find(n => n.id === noteId);
    if (deletedNote?.parentId) {
      optimizer.invalidateCache(deletedNote.parentId, remainingNotes);
    }
    
  } catch (error) {
    throw error;
  }
}

// Enhanced sub-note creation with better validation and error handling
export async function createSubNote(
  title: string,
  content: string,
  parentId: string,
  userId?: string
): Promise<string> {
  logger.dev('[Storage] 🆕 CREATING SUB-NOTE - Enhanced validation:', {
    title,
    contentLength: content.length,
    parentId,
    userId,
    timestamp: new Date().toISOString()
  });

  try {
    const allNotes = await getNotes();
    
    // Enhanced parent validation
    const parent = allNotes.find(note => note.id === parentId);
    if (!parent) {
      const error = new Error(`Parent note with ID ${parentId} not found`);
      logger.error('[Storage] ❌ Parent validation failed:', { parentId, error: error.message });
      throw error;
    }
    
    logger.dev('[Storage] ✅ Parent note found:', {
      parentTitle: parent.title,
      parentId: parent.id,
      parentHasChildren: allNotes.some(n => n.parentId === parentId)
    });

    // Comprehensive validation using SubNoteUtils
    const validation = SubNoteUtils.canCreateSubNote(parentId, allNotes);
    
    if (!validation.isValid) {
      logger.error('[Storage] ❌ VALIDATION FAILED:', {
        parentId,
        title,
        reason: validation.reason,
        warnings: validation.warnings,
        suggestions: validation.suggestions
      });
      throw new Error(`Sub-note creation failed: ${validation.reason}`);
    }
    
    if (validation.warnings && validation.warnings.length > 0) {
      logger.warn('[Storage] ⚠️ VALIDATION WARNINGS:', {
        parentId,
        title,
        warnings: validation.warnings,
        suggestions: validation.suggestions
      });
    }

    // Additional circular reference check
    if (SubNoteUtils.hasCircularReference(parentId, allNotes)) {
      logger.error('[Storage] ❌ CIRCULAR REFERENCE DETECTED:', { parentId });
      throw new Error('Circular reference detected in hierarchy');
    }

    // Create the sub-note
    const subNote: Note = {
      id: uuid(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      parentId: parentId,
      tags: [], // Initialize empty tags
      imageUris: [] // Initialize empty array
    };

    // Add to storage
    const savedNoteId = await addNote(subNote);
    
    // Invalidate performance cache for parent
    const optimizer = HierarchyPerformanceOptimizer.getInstance();
    optimizer.invalidateCache(parentId, [...allNotes, subNote]);
    
    logger.dev('[Storage] ✅ SUB-NOTE CREATED SUCCESSFULLY:', {
      subNoteId: savedNoteId,
      title: subNote.title,
      parentId: parentId,
      hierarchyDepth: SubNoteUtils.getNoteDepth(subNote, [...allNotes, subNote]),
      descendantCount: SubNoteUtils.getHierarchyStats(parentId, [...allNotes, subNote]).descendantCount,
      timestamp: new Date().toISOString()
    });

    return savedNoteId;

  } catch (error) {
    logger.error('[Storage] ❌ SUB-NOTE CREATION FAILED:', {
      parentId,
      title,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Utility function for one-time storage cleanup
export async function cleanupInvalidNotes(): Promise<{cleaned: number, remaining: number}> {
  try {
    logger.dev('[Storage] 🧹 Starting comprehensive storage cleanup...');
    
    const json = await AsyncStorage.getItem(NOTES_KEY);
    if (!json) return {cleaned: 0, remaining: 0};
    
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return {cleaned: 0, remaining: 0};
    
    const validNotes: Note[] = [];
    let cleanedCount = 0;
    
    parsed.forEach(note => {
      // ✅ Fixed validation: title is optional, only check required fields  
      if (!note || typeof note.id !== 'string' || typeof note.content !== 'string') {
        cleanedCount++;
        return;
      }
      
      // Normalize and validate note structure
      const cleanNote: Note = {
        id: note.id,
        ...(note.title && { title: note.title }), // Only add title if exists
        content: note.content || '',
        createdAt: note.createdAt || new Date().toISOString(),
        tags: Array.isArray(note.tags) ? note.tags : [],
        imageUris: Array.isArray(note.imageUris) ? note.imageUris : (note.imageUri ? [note.imageUri] : []),
        ...(note.parentId && { parentId: note.parentId }),
        ...(note.lastAccessed && { lastAccessed: note.lastAccessed })
      };
      
      validNotes.push(cleanNote);
    });
    
    if (cleanedCount > 0) {
      await saveNotes(validNotes);
      logger.dev(`[Storage] ✅ Cleanup complete: removed ${cleanedCount} invalid notes, kept ${validNotes.length} valid notes`);
    }
    
    return {cleaned: cleanedCount, remaining: validNotes.length};
  } catch (error) {
    logger.error('[Storage] Cleanup failed:', error);
    return {cleaned: 0, remaining: 0};
  }
}
