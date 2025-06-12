import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { v4 as uuid } from 'uuid';

const NOTES_KEY = 'notes';

export async function getNotes(): Promise<Note[]> {
  try {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    if (!json) return [];
    
    const parsed = JSON.parse(json);
    
    // Type validation - ensure it's an array
    if (!Array.isArray(parsed)) {
      console.error('[Storage] Invalid data format - not an array, resetting to empty');
      await AsyncStorage.removeItem(NOTES_KEY);
      return [];
    }
    
    // Validate each note has required fields
    const validNotes = parsed.filter((note: any) => {
      if (!note.id || !note.createdAt) {
        console.warn('[Storage] Skipping invalid note:', note);
        return false;
      }
      return true;
    });
    
    return validNotes;
  } catch (error) {
    console.error('[Storage] Failed to parse notes JSON:', error);
    // Backup corrupted data and reset
    try {
      const corruptedData = await AsyncStorage.getItem(NOTES_KEY);
      if (corruptedData) {
        await AsyncStorage.setItem(`${NOTES_KEY}_corrupted_${Date.now()}`, corruptedData);
        console.log('[Storage] Backed up corrupted data');
      }
    } catch (backupError) {
      console.error('[Storage] Failed to backup corrupted data:', backupError);
    }
    
    await AsyncStorage.removeItem(NOTES_KEY);
    return [];
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function addNote(note: Note): Promise<void> {
  try {
    const notes = await getNotes();
    notes.push(note);
    await saveNotes(notes);
  } catch (error) {
    console.error('Error in addNote:', error);
    throw error;
  }
}

export async function updateNote(note: Note): Promise<void> {
  const notes = await getNotes();
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx !== -1) {
    notes[idx] = note;
    await saveNotes(notes);
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    const notes = await getNotes();
    const filtered = notes.filter(n => n.id !== id);
    await saveNotes(filtered);

    // Clean up reminders for deleted note
    try {
      const { ReminderService } = await import('./reminderService');
      const reminderService = ReminderService.getInstance();
      await reminderService.deleteRemindersForNote(id);
      console.log(`[Storage] Cleaned up reminders for deleted note: ${id}`);
    } catch (reminderError) {
      console.warn(`[Storage] Failed to clean up reminders for note ${id}:`, reminderError);
      // Don't throw here - note deletion should succeed even if reminder cleanup fails
    }
  } catch (error) {
    console.error('Error in deleteNote:', error);
    throw error;
  }
}

// SUB-NOTES SPECIFIC FUNCTIONS

/**
 * Get all parent notes (notes without parentId)
 * Used for HomeScreen display
 */
export async function getParentNotes(): Promise<Note[]> {
  const allNotes = await getNotes();
  return SubNoteUtils.getParentNotesFromArray(allNotes);
}

/**
 * Get all sub-notes for a specific parent
 */
export async function getSubNotes(parentId: string): Promise<Note[]> {
  const allNotes = await getNotes();
  return SubNoteUtils.getSubNotesFromArray(parentId, allNotes);
}

/**
 * Get count of sub-notes for a parent
 * Used for badge display
 */
export async function getSubNoteCount(parentId: string): Promise<number> {
  const allNotes = await getNotes();
  return SubNoteUtils.getSubNoteCountFromArray(parentId, allNotes);
}

/**
 * Get a note by ID
 */
export async function getNoteById(id: string): Promise<Note | null> {
  const notes = await getNotes();
  return notes.find(note => note.id === id) || null;
}

/**
 * Create a new sub-note under a parent
 */
export async function createSubNote(parentId: string, noteData: Partial<Note>): Promise<Note> {
  // Validate parent exists
  const parentNote = await getNoteById(parentId);
  if (!parentNote) {
    throw new Error('Parent note not found');
  }
  
  const newSubNote: Note = {
    id: uuid(),
    title: noteData.title || '',
    content: noteData.content || '',
    createdAt: new Date().toISOString(),
    tags: noteData.tags || [],
    imageUris: noteData.imageUris || [],
    parentId, // Set parent relationship
    reminders: noteData.reminders || [],
    scheduledDate: noteData.scheduledDate,
  };
  
  const allNotes = await getNotes();
  allNotes.push(newSubNote);
  await saveNotes(allNotes);
  
  return newSubNote;
}

/**
 * Delete a sub-note and all its descendants
 */
export async function deleteSubNote(subNoteId: string): Promise<void> {
  const allNotes = await getNotes();
  const subNote = allNotes.find(note => note.id === subNoteId);
  
  if (!subNote || !subNote.parentId) {
    throw new Error('Sub-note not found');
  }
  
  // Get all descendants that need to be deleted too
  const descendants = SubNoteUtils.getAllDescendants(subNoteId, allNotes);
  const idsToDelete = [subNoteId, ...descendants.map(d => d.id)];
  
  const updatedNotes = allNotes.filter(note => !idsToDelete.includes(note.id));
  await saveNotes(updatedNotes);
}

/**
 * Convert a regular note to a sub-note
 */
export async function convertToSubNote(noteId: string, parentId: string): Promise<void> {
  const allNotes = await getNotes();
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
  
  // Validate no cycles would be created
  if (!SubNoteUtils.canMakeSubNote(noteId, parentId, allNotes)) {
    throw new Error('Cannot create sub-note: would create circular dependency');
  }
  
  allNotes[noteIndex].parentId = parentId;
  await saveNotes(allNotes);
}

/**
 * Get all notes related to a parent (parent + all its sub-notes)
 */
export async function getNoteFamily(parentId: string): Promise<{ parent: Note; subNotes: Note[] }> {
  const allNotes = await getNotes();
  const parent = allNotes.find(note => note.id === parentId && !note.parentId);
  const subNotes = SubNoteUtils.getSubNotesFromArray(parentId, allNotes);
  
  if (!parent) {
    throw new Error('Parent note not found');
  }
  
  return { parent, subNotes };
}
