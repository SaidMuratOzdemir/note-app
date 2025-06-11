import { Reminder } from './Reminder';

export interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string; // ISO 8601
  tags?: string[];
  imageUris?: string[]; // Multiple images support
  
  // Sub-notes system fields
  parentId?: string;           // If this is a sub-note, parent's ID
  
  // Advanced notification system fields
  reminders?: Reminder[];      // Array of full reminder objects for this note
  reminderCount?: number;      // Cached count for UI performance optimization
  hasActiveReminders?: boolean; // Quick check for active reminders without array iteration
  nextReminderDate?: string;   // ISO string of the next upcoming reminder for quick sorting
  
  // Smart date functionality
  scheduledDate?: string;      // For smart date suggestions and note organization
}

// Helper types for better TypeScript support
export type ParentNote = Note & { parentId: undefined };
export type SubNote = Note & { parentId: string };
