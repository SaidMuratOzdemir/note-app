export interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string; // ISO 8601
  tags?: string[];
  imageUris?: string[]; // Multiple images support
  
  // Sub-notes system fields
  parentId?: string;           // If this is a sub-note, parent's ID
  reminders?: string[];        // Array of reminder IDs (for future notification system)
  scheduledDate?: string;      // For smart date suggestions (future)
}

// Helper types for better TypeScript support
export type ParentNote = Note & { parentId: undefined };
export type SubNote = Note & { parentId: string };
