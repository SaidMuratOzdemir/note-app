/**
 * Advanced Notification and Reminder System - Data Models
 * 
 * This module defines all TypeScript interfaces and types for the notification system.
 * Supports multiple reminders per note, recurring notifications, and smart date suggestions.
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @created 2025-06-11
 */

/**
 * Frequency options for recurring reminders
 */
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Types of smart date suggestions the system can provide
 */
export type SmartDateSuggestionType = 'move_note_date' | 'common_time' | 'relative_date';

/**
 * Main reminder data structure
 * Represents a single reminder/notification for a note
 */
export interface Reminder {
  /** Unique reminder identifier */
  id: string;
  
  /** ID of the parent note this reminder belongs to */
  noteId: string;
  
  /** Display title for the reminder (defaults to note title) */
  title: string;
  
  /** Optional custom notification message */
  message?: string;
  
  /** ISO date string when reminder should trigger */
  scheduledDate: string;
  
  /** How often the reminder should repeat */
  frequency: ReminderFrequency;
  
  /** Whether the reminder is currently active */
  isActive: boolean;
  
  /** Whether the reminder has been acknowledged by user */
  isCompleted: boolean;
  
  /** When the reminder was created (ISO string) */
  createdAt: string;
  
  /** When the reminder was last modified (ISO string) */
  updatedAt: string;
  
  /** When the reminder last fired (ISO string) - for recurring reminders */
  lastTriggered?: string;
  
  /** When the reminder will next fire (ISO string) - calculated for recurring reminders */
  nextTrigger?: string;
  
  /** Platform-specific notification ID for cancellation */
  notificationId?: string;
}

/**
 * Data payload sent with push notifications
 */
export interface NotificationPayload {
  /** ID of the reminder that triggered this notification */
  reminderId: string;
  
  /** ID of the associated note */
  noteId: string;
  
  /** Notification title */
  title: string;
  
  /** Notification message body */
  message: string;
  
  /** Original scheduled date */
  scheduledDate: string;
  
  /** Reminder frequency type */
  frequency: ReminderFrequency;
  
  /** Additional metadata for deep linking */
  metadata?: {
    noteTitle?: string;
    notePreview?: string;
    actionButtons?: string[];
  };
}

/**
 * Data structure for creating new reminders
 */
export interface ReminderCreationData {
  /** ID of the note to attach reminder to */
  noteId: string;
  
  /** Optional custom title (defaults to note title) */
  title?: string;
  
  /** Optional custom notification message */
  message?: string;
  
  /** When the reminder should trigger (ISO string) */
  scheduledDate: string;
  
  /** Frequency for recurring reminders (defaults to 'once') */
  frequency?: ReminderFrequency;
  
  /** Whether reminder should be active immediately (defaults to true) */
  isActive?: boolean;
}

/**
 * Smart date suggestion provided by the system
 */
export interface SmartDateSuggestion {
  /** Type category of the suggestion */
  type: SmartDateSuggestionType;
  
  /** Human-readable label for the suggestion */
  label: string;
  
  /** Calculated date for this suggestion (ISO string) */
  suggestedDate: string;
  
  /** Explanation text for the user */
  description: string;
  
  /** Optional icon name for UI display */
  icon?: string;
  
  /** Whether this suggestion requires additional user confirmation */
  requiresConfirmation?: boolean;
}

/**
 * Reminder statistics and analytics data
 */
export interface ReminderAnalytics {
  /** Total number of active reminders */
  totalActive: number;
  
  /** Total number of completed reminders */
  totalCompleted: number;
  
  /** Number of overdue reminders */
  overdueCount: number;
  
  /** Number of reminders due today */
  dueTodayCount: number;
  
  /** Number of reminders due this week */
  dueThisWeekCount: number;
  
  /** Most used frequency type */
  mostUsedFrequency: ReminderFrequency;
  
  /** Average time between reminder creation and completion */
  averageCompletionTime?: number;
}

/**
 * Configuration options for the reminder service
 */
export interface ReminderServiceConfig {
  /** Maximum number of reminders per note */
  maxRemindersPerNote: number;
  
  /** Default reminder frequency */
  defaultFrequency: ReminderFrequency;
  
  /** Enable smart date suggestions */
  enableSmartSuggestions: boolean;
  
  /** Enable recurring reminder notifications */
  enableRecurringReminders: boolean;
  
  /** How many days ahead to calculate next triggers */
  nextTriggerLookaheadDays: number;
  
  /** Cache expiry time for analytics (milliseconds) */
  analyticsCacheExpiryMs: number;
}

/**
 * Filter options for querying reminders
 */
export interface ReminderQueryFilter {
  /** Filter by note ID */
  noteId?: string;
  
  /** Filter by active status */
  isActive?: boolean;
  
  /** Filter by completed status */
  isCompleted?: boolean;
  
  /** Filter by frequency type */
  frequency?: ReminderFrequency;
  
  /** Filter by date range - start date */
  dateFrom?: string;
  
  /** Filter by date range - end date */
  dateTo?: string;
  
  /** Filter overdue reminders only */
  overdueOnly?: boolean;
}

/**
 * Sort options for reminder queries
 */
export interface ReminderSortOptions {
  /** Field to sort by */
  field: 'scheduledDate' | 'createdAt' | 'updatedAt' | 'title';
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Bulk operation result for multiple reminders
 */
export interface BulkReminderOperation {
  /** Number of successfully processed reminders */
  successCount: number;
  
  /** Number of failed operations */
  failureCount: number;
  
  /** List of reminder IDs that failed */
  failedIds: string[];
  
  /** Error messages for failed operations */
  errors: string[];
}

/**
 * Notification permission status and settings
 */
export interface NotificationSettings {
  /** Whether notifications are enabled globally */
  enabled: boolean;
  
  /** Whether sound is enabled for notifications */
  soundEnabled: boolean;
  
  /** Whether vibration is enabled */
  vibrationEnabled: boolean;
  
  /** Whether badge count is enabled */
  badgeEnabled: boolean;
  
  /** Default notification sound */
  defaultSound?: string;
  
  /** Quiet hours configuration */
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
}

/**
 * Storage keys for persistence
 */
export const REMINDER_STORAGE_KEYS = {
  REMINDERS: '@note_app_reminders_v1',
  ANALYTICS: '@note_app_reminder_analytics_v1',
  SETTINGS: '@note_app_notification_settings_v1',
  CONFIG: '@note_app_reminder_config_v1',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_REMINDER_CONFIG: ReminderServiceConfig = {
  maxRemindersPerNote: 10,
  defaultFrequency: 'once',
  enableSmartSuggestions: true,
  enableRecurringReminders: true,
  nextTriggerLookaheadDays: 30,
  analyticsCacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};
