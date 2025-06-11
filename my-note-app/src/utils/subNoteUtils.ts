import { Note, ParentNote, SubNote } from '../types/Note';

/**
 * Utility functions for sub-notes management
 */
export class SubNoteUtils {
  /**
   * Check if a note is a sub-note (has parentId)
   */
  static isSubNote(note: Note): note is SubNote {
    return !!note.parentId;
  }

  /**
   * Check if a note is a parent note (no parentId)
   */
  static isParentNote(note: Note): note is ParentNote {
    return !note.parentId;
  }

  /**
   * Get sub-note count for a specific parent from an array
   */
  static getSubNoteCountFromArray(parentId: string, notes: Note[]): number {
    return notes.filter(note => note.parentId === parentId).length;
  }

  /**
   * Get sub-notes for a specific parent from an array
   */
  static getSubNotesFromArray(parentId: string, notes: Note[]): Note[] {
    return notes
      .filter(note => note.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get only parent notes from an array (for HomeScreen)
   */
  static getParentNotesFromArray(notes: Note[]): Note[] {
    return notes.filter(note => !note.parentId);
  }

  /**
   * Get the hierarchy path from a note to its root parent
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

  /**
   * Validate if a note can be made a sub-note of another
   */
  static canMakeSubNote(noteId: string, parentId: string, allNotes: Note[]): boolean {
    // Can't make a note a sub-note of itself
    if (noteId === parentId) return false;
    
    // Can't make a note a sub-note of its own descendant (would create cycle)
    const descendants = this.getAllDescendants(noteId, allNotes);
    return !descendants.some(desc => desc.id === parentId);
  }
}
