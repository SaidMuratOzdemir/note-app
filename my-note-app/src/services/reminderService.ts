/**
 * Advanced Reminder Service - Core Implementation
 * 
 * A comprehensive, enterprise-grade reminder service that provides:
 * - Multiple reminders per note with smart scheduling
 * - Recurring notifications with intelligent next-trigger calculation
 * - Smart date suggestions with note date movement capabilities
 * - Performance-optimized caching and batch operations
 * - Rich analytics and notification management
 * 
 * Architecture:
 * - Singleton pattern for global state management
 * - Event-driven updates with debounced persistence
 * - Memory-first caching with async storage backup
 * - Comprehensive error handling and logging
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @created 2025-06-11
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  Reminder,
  ReminderCreationData,
  NotificationPayload,
  SmartDateSuggestion,
  ReminderAnalytics,
  ReminderServiceConfig,
  ReminderQueryFilter,
  ReminderSortOptions,
  BulkReminderOperation,
  NotificationSettings,
  ReminderFrequency,
  REMINDER_STORAGE_KEYS,
  DEFAULT_REMINDER_CONFIG,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../types/Reminder';
import { Note } from '../types/Note';
import { logger } from '../utils/logger';

/**
 * Core reminder service class implementing the singleton pattern
 * Manages all reminder operations, notifications, and smart features
 */
export class ReminderService {
  private static instance: ReminderService;
  
  // Core state management
  private reminders: Map<string, Reminder> = new Map();
  private isInitialized = false;
  private config: ReminderServiceConfig = DEFAULT_REMINDER_CONFIG;
  private settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
  
  // Performance optimization
  private analyticsCache: ReminderAnalytics | null = null;
  private analyticsCacheTime = 0;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  
  // Event listeners for real-time updates
  private listeners: Map<string, (reminders: Reminder[]) => void> = new Map();

  private constructor() {
    this.setupNotificationHandlers();
  }

  /**
   * Get singleton instance of the reminder service
   */
  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * Cleanup all timers and listeners (for testing/memory management)
   */
  public cleanup(): void {
    logger.dev('[ReminderService] 🧹 Cleaning up timers and listeners...');
    
    // Clear debounce timer
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    
    // Clear all listeners
    this.listeners.clear();
    
    // Reset initialization state
    this.isInitialized = false;
    
    logger.dev('[ReminderService] ✅ Cleanup completed');
  }

  /**
   * Initialize the service and load existing data
   * Must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.dev('[ReminderService] 🔄 Already initialized, skipping...');
      return;
    }

    try {
      logger.dev('[ReminderService] 🚀 Starting initialization...');
      const startTime = Date.now();
      
      // Load configuration and settings
      logger.dev('[ReminderService] 📋 Loading configuration and settings...');
      await Promise.all([
        this.loadConfig(),
        this.loadSettings(),
        this.loadReminders(),
      ]);
      logger.dev('[ReminderService] ✅ Configuration and data loaded successfully');

      // Setup notification permissions and handlers
      logger.dev('[ReminderService] 🔔 Setting up notifications...');
      await this.setupNotifications();
      logger.dev('[ReminderService] ✅ Notifications setup completed');
      
      // Schedule all active reminders
      logger.dev('[ReminderService] ⏰ Rescheduling active reminders...');
      await this.rescheduleAllActiveReminders();
      logger.dev('[ReminderService] ✅ Active reminders rescheduled');
      
      // Cleanup expired/completed reminders
      logger.dev('[ReminderService] 🧹 Cleaning up expired reminders...');
      await this.cleanupExpiredReminders();
      logger.dev('[ReminderService] ✅ Cleanup completed');
      
      const endTime = Date.now();
      const initTime = endTime - startTime;
      
      this.isInitialized = true;
      logger.dev(`[ReminderService] ✅ INITIALIZATION COMPLETE - Duration: ${initTime}ms`);
      logger.dev(`[ReminderService] 📊 Final Statistics:`, {
        totalReminders: this.reminders.size,
        activeReminders: Array.from(this.reminders.values()).filter(r => r.isActive && !r.isCompleted).length,
        completedReminders: Array.from(this.reminders.values()).filter(r => r.isCompleted).length,
        overdueReminders: Array.from(this.reminders.values()).filter(r => {
          const now = new Date().toISOString();
          return r.isActive && !r.isCompleted && r.scheduledDate < now;
        }).length,
        recurringReminders: Array.from(this.reminders.values()).filter(r => r.frequency !== 'once').length
      });
      
    } catch (error) {
      logger.error('[ReminderService] ❌ INITIALIZATION FAILED:', error);
      logger.error('[ReminderService] 🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to initialize ReminderService: ${error}`);
    }
  }

  // ==========================================
  // REMINDER CRUD OPERATIONS
  // ==========================================

  /**
   * Create a new reminder with validation and smart features
   */
  async createReminder(data: ReminderCreationData): Promise<Reminder> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 🆕 CREATING REMINDER - Start operation:', {
      noteId: data.noteId,
      title: data.title,
      scheduledDate: data.scheduledDate,
      frequency: data.frequency || 'once',
      isActive: data.isActive !== false,
      hasMessage: !!data.message,
      messageLength: data.message?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.ensureInitialized();
      logger.dev('[ReminderService] ✅ Service initialization confirmed');
      
      // Validation with detailed logging
      logger.dev('[ReminderService] 🔍 Starting validation process...');
      await this.validateReminderCreation(data);
      logger.dev('[ReminderService] ✅ Validation passed successfully');

      // Generate unique ID and log generation process
      const reminderId = this.generateUniqueId('reminder');
      logger.dev('[ReminderService] 🆔 Generated unique ID:', reminderId);

      const reminder: Reminder = {
        id: reminderId,
        noteId: data.noteId,
        title: data.title || 'Note Reminder',
        message: data.message,
        scheduledDate: data.scheduledDate,
        frequency: data.frequency || this.config.defaultFrequency,
        isActive: data.isActive !== false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.dev('[ReminderService] 📋 Reminder object created:', {
        id: reminder.id,
        title: reminder.title,
        scheduledDate: reminder.scheduledDate,
        frequency: reminder.frequency,
        isActive: reminder.isActive,
        hasMessage: !!reminder.message,
        createdAt: reminder.createdAt
      });

      // Calculate next trigger for recurring reminders
      if (reminder.frequency !== 'once') {
        logger.dev('[ReminderService] 🔄 Calculating next trigger for recurring reminder...');
        reminder.nextTrigger = this.calculateNextTrigger(reminder);
        logger.dev('[ReminderService] ⏰ Next trigger calculated:', {
          frequency: reminder.frequency,
          originalDate: reminder.scheduledDate,
          nextTrigger: reminder.nextTrigger,
          timeDifference: reminder.nextTrigger ? 
            new Date(reminder.nextTrigger).getTime() - new Date(reminder.scheduledDate).getTime() : 0
        });
      } else {
        logger.dev('[ReminderService] 🔁 One-time reminder, no next trigger calculation needed');
      }

      // Store in memory
      const beforeCount = this.reminders.size;
      this.reminders.set(reminder.id, reminder);
      const afterCount = this.reminders.size;
      logger.dev('[ReminderService] 💾 Stored reminder in memory:', {
        reminderId: reminder.id,
        beforeCount,
        afterCount,
        totalActive: Array.from(this.reminders.values()).filter(r => r.isActive && !r.isCompleted).length,
        totalCompleted: Array.from(this.reminders.values()).filter(r => r.isCompleted).length
      });
      
      // Schedule notification if appropriate
      if (reminder.isActive && !reminder.isCompleted) {
        logger.dev('[ReminderService] 📅 Scheduling notification for active reminder...');
        await this.scheduleNotification(reminder);
        logger.dev('[ReminderService] ✅ Notification scheduling completed');
      } else {
        logger.dev('[ReminderService] ⏸️ Skipping notification scheduling:', {
          isActive: reminder.isActive,
          isCompleted: reminder.isCompleted,
          reason: !reminder.isActive ? 'reminder inactive' : 'reminder completed'
        });
      }

      // Debounced save and notify listeners
      logger.dev('[ReminderService] 💾 Triggering debounced save...');
      await this.debouncedSave();
      
      logger.dev('[ReminderService] 📢 Notifying listeners...');
      this.notifyListeners();
      
      logger.dev('[ReminderService] 🗃️ Invalidating analytics cache...');
      this.invalidateAnalyticsCache();

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ REMINDER CREATION COMPLETE:', {
        reminderId: reminder.id,
        reminderTitle: reminder.title,
        noteId: reminder.noteId,
        duration: `${duration}ms`,
        hasNotificationId: !!reminder.notificationId,
        totalReminders: this.reminders.size,
        success: true
      });
      
      return reminder;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ REMINDER CREATION FAILED:', {
        noteId: data.noteId,
        title: data.title,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to maintain error handling upstream
    }
  }

  /**
   * Get all reminders for a specific note with sorting
   */
  async getRemindersForNote(
    noteId: string, 
    sortOptions?: ReminderSortOptions
  ): Promise<Reminder[]> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 📋 GETTING REMINDERS FOR NOTE - Start operation:', {
      noteId,
      sortOptions: sortOptions || 'default',
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.ensureInitialized();
      logger.dev('[ReminderService] ✅ Service initialization confirmed');
      
      const allReminders = Array.from(this.reminders.values());
      const noteReminders = allReminders.filter(reminder => reminder.noteId === noteId);

      logger.dev('[ReminderService] 🔍 Found reminders for note:', {
        noteId,
        totalReminders: allReminders.length,
        matchingReminders: noteReminders.length,
        activeMatching: noteReminders.filter(r => r.isActive && !r.isCompleted).length,
        completedMatching: noteReminders.filter(r => r.isCompleted).length,
        inactiveMatching: noteReminders.filter(r => !r.isActive && !r.isCompleted).length,
        recurringMatching: noteReminders.filter(r => r.frequency !== 'once').length,
        overdueMatching: noteReminders.filter(r => {
          const now = new Date().toISOString();
          return r.isActive && !r.isCompleted && r.scheduledDate < now;
        }).length
      });

      const sortedReminders = this.sortReminders(noteReminders, sortOptions);
      
      logger.dev('[ReminderService] 🔀 Applied sorting:', {
        sortField: sortOptions?.field || 'scheduledDate (default)',
        sortDirection: sortOptions?.direction || 'asc (default)',
        originalOrder: noteReminders.slice(0, 3).map(r => r.id),
        sortedOrder: sortedReminders.slice(0, 3).map(r => r.id),
        orderChanged: JSON.stringify(noteReminders.map(r => r.id)) !== JSON.stringify(sortedReminders.map(r => r.id))
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ GET REMINDERS FOR NOTE COMPLETE:', {
        noteId,
        resultCount: sortedReminders.length,
        duration: `${duration}ms`,
        sortingApplied: !!sortOptions,
        success: true
      });
      
      return sortedReminders;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ GET REMINDERS FOR NOTE FAILED:', {
        noteId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to maintain error handling upstream
    }
  }

  /**
   * Get filtered reminders with advanced query options
   */
  async getReminders(
    filter?: ReminderQueryFilter,
    sortOptions?: ReminderSortOptions
  ): Promise<Reminder[]> {
    await this.ensureInitialized();
    
    let filteredReminders = Array.from(this.reminders.values());

    // Apply filters
    if (filter) {
      filteredReminders = this.applyFilter(filteredReminders, filter);
    }

    return this.sortReminders(filteredReminders, sortOptions);
  }

  /**
   * Update an existing reminder with validation
   */
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<Reminder> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 🔄 UPDATING REMINDER - Start operation:', {
      reminderId,
      updateKeys: Object.keys(updates),
      updateValues: updates,
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.ensureInitialized();
      logger.dev('[ReminderService] ✅ Service initialization confirmed');
      
      const existingReminder = this.reminders.get(reminderId);
      if (!existingReminder) {
        logger.error('[ReminderService] ❌ REMINDER NOT FOUND:', {
          reminderId,
          totalReminders: this.reminders.size,
          availableIds: Array.from(this.reminders.keys()).slice(0, 5), // Show first 5 IDs
          searchAttempted: true
        });
        throw new Error(`Reminder not found: ${reminderId}`);
      }

      logger.dev('[ReminderService] 📋 Found existing reminder:', {
        id: existingReminder.id,
        title: existingReminder.title,
        currentActive: existingReminder.isActive,
        currentCompleted: existingReminder.isCompleted,
        currentScheduledDate: existingReminder.scheduledDate,
        currentFrequency: existingReminder.frequency,
        hasNotificationId: !!existingReminder.notificationId
      });

      // Create updated reminder
      const updatedReminder: Reminder = {
        ...existingReminder,
        ...updates,
        id: reminderId, // Ensure ID cannot be changed
        updatedAt: new Date().toISOString(),
      };

      logger.dev('[ReminderService] 🔧 Applied updates to reminder:', {
        reminderId,
        changedFields: Object.keys(updates),
        before: {
          isActive: existingReminder.isActive,
          isCompleted: existingReminder.isCompleted,
          scheduledDate: existingReminder.scheduledDate,
          frequency: existingReminder.frequency
        },
        after: {
          isActive: updatedReminder.isActive,
          isCompleted: updatedReminder.isCompleted,
          scheduledDate: updatedReminder.scheduledDate,
          frequency: updatedReminder.frequency
        }
      });

      // Recalculate next trigger if frequency or date changed
      const needsRecalculation = updates.frequency || updates.scheduledDate;
      if (needsRecalculation) {
        logger.dev('[ReminderService] 🔄 Recalculating next trigger due to frequency/date change...');
        const oldNextTrigger = updatedReminder.nextTrigger;
        
        updatedReminder.nextTrigger = updatedReminder.frequency !== 'once' 
          ? this.calculateNextTrigger(updatedReminder)
          : undefined;
          
        logger.dev('[ReminderService] ⏰ Next trigger recalculation result:', {
          reminderId,
          frequency: updatedReminder.frequency,
          oldNextTrigger,
          newNextTrigger: updatedReminder.nextTrigger,
          calculationNeeded: updatedReminder.frequency !== 'once'
        });
      } else {
        logger.dev('[ReminderService] ⏸️ Next trigger recalculation not needed');
      }

      // Update storage
      this.reminders.set(reminderId, updatedReminder);
      logger.dev('[ReminderService] 💾 Updated reminder in memory storage');
      
      // Handle notification rescheduling
      logger.dev('[ReminderService] 🔔 Managing notification rescheduling...');
      try {
        logger.dev('[ReminderService] 🔕 Cancelling existing notification...');
        await this.cancelNotification(reminderId);
        logger.dev('[ReminderService] ✅ Existing notification cancelled');
        
        if (updatedReminder.isActive && !updatedReminder.isCompleted) {
          logger.dev('[ReminderService] 📅 Scheduling new notification for updated reminder...');
          await this.scheduleNotification(updatedReminder);
          logger.dev('[ReminderService] ✅ New notification scheduled');
        } else {
          logger.dev('[ReminderService] ⏸️ Not scheduling notification:', {
            isActive: updatedReminder.isActive,
            isCompleted: updatedReminder.isCompleted,
            reason: !updatedReminder.isActive ? 'reminder inactive' : 'reminder completed'
          });
        }
      } catch (notificationError) {
        logger.error('[ReminderService] ⚠️ Notification management error (continuing):', {
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
          reminderId,
          operation: 'notification rescheduling'
        });
      }

      // Save and notify
      logger.dev('[ReminderService] 💾 Triggering debounced save...');
      await this.debouncedSave();
      
      logger.dev('[ReminderService] 📢 Notifying listeners...');
      this.notifyListeners();
      
      logger.dev('[ReminderService] 🗃️ Invalidating analytics cache...');
      this.invalidateAnalyticsCache();

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ REMINDER UPDATE COMPLETE:', {
        reminderId,
        reminderTitle: updatedReminder.title,
        changedFields: Object.keys(updates),
        duration: `${duration}ms`,
        hasNotificationId: !!updatedReminder.notificationId,
        isActive: updatedReminder.isActive,
        isCompleted: updatedReminder.isCompleted,
        success: true
      });

      return updatedReminder;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ REMINDER UPDATE FAILED:', {
        reminderId,
        updates,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to maintain error handling upstream
    }
  }

  /**
   * Delete a reminder permanently
   */
  async deleteReminder(reminderId: string): Promise<void> {
    logger.dev('[ReminderService] 🗑️ Starting delete operation for reminder:', reminderId);
    
    await this.ensureInitialized();
    
    if (!this.reminders.has(reminderId)) {
      logger.error('[ReminderService] ❌ Delete failed - reminder not found:', reminderId);
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    const reminder = this.reminders.get(reminderId);
    logger.dev('[ReminderService] 📋 Deleting reminder details:', {
      id: reminder?.id,
      title: reminder?.title,
      noteId: reminder?.noteId,
      isActive: reminder?.isActive,
      hasNotification: !!reminder?.notificationId
    });

    // Cancel notification and remove from storage
    try {
      logger.dev('[ReminderService] 🔕 Cancelling notification for deleted reminder...');
      await this.cancelNotification(reminderId);
      logger.dev('[ReminderService] ✅ Notification cancelled successfully');
    } catch (error) {
      logger.error('[ReminderService] ⚠️ Error cancelling notification (proceeding with delete):', error);
    }

    this.reminders.delete(reminderId);
    logger.dev('[ReminderService] 🗃️ Removed from memory, remaining count:', this.reminders.size);

    try {
      await this.debouncedSave();
      logger.dev('[ReminderService] 💾 Saved changes to storage');
    } catch (error) {
      logger.error('[ReminderService] ❌ Error saving after delete:', error);
    }

    this.notifyListeners();
    this.invalidateAnalyticsCache();
    logger.dev('[ReminderService] 📢 Notified listeners and invalidated cache');

    logger.dev(`[ReminderService] ✅ Successfully deleted reminder: ${reminderId}`);
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId: string): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] ✅ COMPLETING REMINDER - Start operation:', {
      reminderId,
      timestamp: new Date().toISOString()
    });
    
    try {
      const now = new Date().toISOString();
      logger.dev('[ReminderService] 🕐 Completion timestamp:', now);
      
      const existingReminder = this.reminders.get(reminderId);
      if (!existingReminder) {
        logger.warn('[ReminderService] ⚠️ COMPLETE SKIPPED - reminder not found (likely race condition):', {
          reminderId,
          totalReminders: this.reminders.size,
          availableIds: Array.from(this.reminders.keys()).slice(0, 5),
          likelyReason: 'Reminder was deleted or completed by another operation',
          gracefulFail: true
        });
        // Don't throw error - this is likely a race condition where reminder was deleted
        logger.dev('[ReminderService] ✅ COMPLETE GRACEFULLY HANDLED - operation skipped due to missing reminder');
        return;
      }

      logger.dev('[ReminderService] 📋 Found reminder to complete:', {
        id: existingReminder.id,
        title: existingReminder.title,
        noteId: existingReminder.noteId,
        frequency: existingReminder.frequency,
        wasActive: existingReminder.isActive,
        wasCompleted: existingReminder.isCompleted,
        scheduledDate: existingReminder.scheduledDate,
        hasNotification: !!existingReminder.notificationId,
        lastTriggered: existingReminder.lastTriggered
      });

      // Check if already completed
      if (existingReminder.isCompleted) {
        logger.dev('[ReminderService] ℹ️ Reminder already completed:', {
          reminderId,
          completedAt: existingReminder.lastTriggered,
          skippingUpdate: true
        });
        return;
      }
      
      // Use updateReminder to handle completion with full logging
      logger.dev('[ReminderService] 🔄 Delegating to updateReminder for completion...');
      await this.updateReminder(reminderId, {
        isCompleted: true,
        lastTriggered: now,
        isActive: false, // Disable further notifications
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ REMINDER COMPLETION SUCCESSFUL:', {
        reminderId,
        reminderTitle: existingReminder.title,
        completedAt: now,
        duration: `${duration}ms`,
        wasRecurring: existingReminder.frequency !== 'once',
        totalActive: Array.from(this.reminders.values()).filter(r => r.isActive && !r.isCompleted).length,
        totalCompleted: Array.from(this.reminders.values()).filter(r => r.isCompleted).length
      });
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ REMINDER COMPLETION FAILED:', {
        reminderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to maintain error handling upstream
    }
  }

  /**
   * Bulk operations for multiple reminders
   */
  async bulkDeleteReminders(reminderIds: string[]): Promise<BulkReminderOperation> {
    const result: BulkReminderOperation = {
      successCount: 0,
      failureCount: 0,
      failedIds: [],
      errors: [],
    };

    for (const id of reminderIds) {
      try {
        await this.deleteReminder(id);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.failedIds.push(id);
        result.errors.push(`${id}: ${error}`);
      }
    }

    return result;
  }



  /**
   * Update reminder's noteId (for when temp note becomes real note)
   */
  async updateReminderNoteId(oldNoteId: string, newNoteId: string): Promise<void> {
    logger.dev('[ReminderService] 🔄 Updating reminder noteId:', {
      oldNoteId,
      newNoteId,
      timestamp: new Date().toISOString()
    });

    try {
      await this.ensureInitialized();
      
      const remindersToUpdate = Array.from(this.reminders.values())
        .filter(reminder => reminder.noteId === oldNoteId);

      if (remindersToUpdate.length === 0) {
        logger.dev('[ReminderService] ℹ️ No reminders found for noteId update:', {
          oldNoteId,
          newNoteId,
          totalReminders: this.reminders.size
        });
        return;
      }

      logger.dev('[ReminderService] 📋 Found reminders to update:', {
        count: remindersToUpdate.length,
        reminderIds: remindersToUpdate.map(r => r.id),
        oldNoteId,
        newNoteId
      });

      // Update each reminder's noteId
      for (const reminder of remindersToUpdate) {
        const updatedReminder = { ...reminder, noteId: newNoteId };
        this.reminders.set(reminder.id, updatedReminder);
        
        logger.dev('[ReminderService] ✅ Updated reminder noteId:', {
          reminderId: reminder.id,
          reminderTitle: reminder.title,
          oldNoteId: reminder.noteId,
          newNoteId: updatedReminder.noteId
        });
      }

      // Save changes
      await this.debouncedSave();
      this.notifyListeners();

      logger.dev('[ReminderService] ✅ All reminder noteIds updated successfully:', {
        updatedCount: remindersToUpdate.length,
        oldNoteId,
        newNoteId
      });

    } catch (error) {
      logger.error('[ReminderService] ❌ Failed to update reminder noteIds:', {
        oldNoteId,
        newNoteId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  // ==========================================
  // SMART FEATURES
  // ==========================================

  /**
   * Generate intelligent date suggestions based on note content and patterns
   */
  generateSmartDateSuggestions(note: Note): SmartDateSuggestion[] {
    if (!this.config.enableSmartSuggestions) return [];

    const now = new Date();
    const suggestions: SmartDateSuggestion[] = [];

    // Common time suggestions
    suggestions.push(
      ...this.generateCommonTimeSuggestions(now),
      ...this.generateRelativeDateSuggestions(now),
      ...this.generateContextualSuggestions(note, now)
    );

    return suggestions.slice(0, 6); // Limit to 6 suggestions for UI
  }

  /**
   * Move note's creation date to match reminder date (smart feature)
   */
  async moveNoteToReminderDate(noteId: string, reminderDate: string): Promise<void> {
    logger.dev(`[ReminderService] Moving note ${noteId} to date ${reminderDate}`);
    
    // This will be integrated with StorageService to update the note
    // For now, we emit an event that the UI can listen to
    this.emitEvent('noteMovedToReminderDate', { noteId, reminderDate });
  }

  // ==========================================
  // ANALYTICS AND STATISTICS
  // ==========================================

  /**
   * Get comprehensive reminder analytics with caching
   */
  async getAnalytics(): Promise<ReminderAnalytics> {
    await this.ensureInitialized();
    
    // Return cached analytics if still valid
    const now = Date.now();
    if (this.analyticsCache && (now - this.analyticsCacheTime) < this.config.analyticsCacheExpiryMs) {
      return this.analyticsCache;
    }

    // Calculate fresh analytics
    const allReminders = Array.from(this.reminders.values());
    const now_iso = new Date().toISOString();
    
    const analytics: ReminderAnalytics = {
      totalActive: allReminders.filter(r => r.isActive && !r.isCompleted).length,
      totalCompleted: allReminders.filter(r => r.isCompleted).length,
      overdueCount: allReminders.filter(r => 
        r.isActive && !r.isCompleted && r.scheduledDate < now_iso
      ).length,
      dueTodayCount: this.getRemindersForDateRange(
        this.getStartOfDay(new Date()),
        this.getEndOfDay(new Date())
      ).length,
      dueThisWeekCount: this.getRemindersForDateRange(
        this.getStartOfDay(new Date()),
        this.getEndOfWeek(new Date())
      ).length,
      mostUsedFrequency: this.calculateMostUsedFrequency(allReminders),
    };

    // Cache the results
    this.analyticsCache = analytics;
    this.analyticsCacheTime = now;

    return analytics;
  }

  // ==========================================
  // NOTIFICATION MANAGEMENT
  // ==========================================

  /**
   * Setup notification permissions and handlers
   */
  private async setupNotifications(): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 🔔 SETTING UP NOTIFICATIONS - Start operation:', {
      platform: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    try {
      // Request permissions
      logger.dev('[ReminderService] 🔐 Requesting notification permissions...');
      const permissionResult = await Notifications.requestPermissionsAsync();
      
      logger.dev('[ReminderService] 📋 Permission request result:', {
        status: permissionResult.status,
        granted: permissionResult.status === 'granted',
        canAskAgain: permissionResult.canAskAgain,
        expires: permissionResult.expires,
        ios: permissionResult.ios ? {
          status: permissionResult.ios.status,
          allowsAlert: permissionResult.ios.allowsAlert,
          allowsBadge: permissionResult.ios.allowsBadge,
          allowsSound: permissionResult.ios.allowsSound
        } : 'N/A (not iOS)'
      });
      
      if (permissionResult.status !== 'granted') {
        logger.warn('[ReminderService] ⚠️ Notification permissions not granted:', {
          status: permissionResult.status,
          canAskAgain: permissionResult.canAskAgain,
          impact: 'Notifications will not work',
          recommendation: 'User should enable notifications in device settings'
        });
        return;
      }

      logger.dev('[ReminderService] ✅ Notification permissions granted, configuring behavior...');

      // Configure notification behavior
      const notificationHandler = {
        shouldShowAlert: this.settings.enabled,
        shouldPlaySound: this.settings.soundEnabled,
        shouldSetBadge: this.settings.badgeEnabled,
        shouldShowBanner: this.settings.enabled,
        shouldShowList: this.settings.enabled,
      };
      
      logger.dev('[ReminderService] ⚙️ Configuring notification handler:', {
        shouldShowAlert: notificationHandler.shouldShowAlert,
        shouldPlaySound: notificationHandler.shouldPlaySound,
        shouldSetBadge: notificationHandler.shouldSetBadge,
        shouldShowBanner: notificationHandler.shouldShowBanner,
        shouldShowList: notificationHandler.shouldShowList,
        settingsEnabled: this.settings.enabled,
        soundEnabled: this.settings.soundEnabled,
        badgeEnabled: this.settings.badgeEnabled
      });

      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          logger.dev('[ReminderService] 📨 Handling incoming notification:', {
            identifier: notification.request.identifier,
            title: notification.request.content.title,
            body: notification.request.content.body,
            data: notification.request.content.data,
            trigger: notification.request.trigger,
            date: notification.date
          });
          return notificationHandler;
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ NOTIFICATION SETUP COMPLETE:', {
        permissionStatus: permissionResult.status,
        handlerConfigured: true,
        duration: `${duration}ms`,
        settingsApplied: this.settings,
        success: true
      });
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ NOTIFICATION SETUP FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        impact: 'Notifications will not work',
        timestamp: new Date().toISOString()
      });
      
      // Don't throw - continue initialization without notifications
      logger.dev('[ReminderService] 🔄 Continuing initialization without notifications...');
    }
  }

  /**
   * Setup notification event handlers
   */
  private setupNotificationHandlers(): void {
    logger.dev('[ReminderService] 🎧 Setting up notification event handlers...');
    
    // Handle notification received while app is in foreground
    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      logger.dev('[ReminderService] 📨 NOTIFICATION RECEIVED (foreground):', {
        identifier: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        date: notification.date,
        trigger: notification.request.trigger,
        timestamp: new Date().toISOString()
      });
      
      try {
        this.handleNotificationReceived(notification);
        logger.dev('[ReminderService] ✅ Notification received handler completed');
      } catch (error) {
        logger.error('[ReminderService] ❌ Error in notification received handler:', {
          error: error instanceof Error ? error.message : String(error),
          notificationId: notification.request.identifier
        });
      }
    });

    // Handle notification tapped
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      logger.dev('[ReminderService] 👆 NOTIFICATION TAPPED (user interaction):', {
        notificationId: response.notification.request.identifier,
        actionIdentifier: response.actionIdentifier,
        userText: response.userText,
        notification: {
          title: response.notification.request.content.title,
          body: response.notification.request.content.body,
          data: response.notification.request.content.data
        },
        timestamp: new Date().toISOString()
      });
      
      try {
        this.handleNotificationTapped(response);
        logger.dev('[ReminderService] ✅ Notification tapped handler completed');
      } catch (error) {
        logger.error('[ReminderService] ❌ Error in notification tapped handler:', {
          error: error instanceof Error ? error.message : String(error),
          notificationId: response.notification.request.identifier,
          actionIdentifier: response.actionIdentifier
        });
      }
    });

    logger.dev('[ReminderService] ✅ Notification event handlers setup complete:', {
      receivedListenerActive: !!receivedListener,
      responseListenerActive: !!responseListener,
      handlersConfigured: 2
    });
  }

  /**
   * Schedule a notification for a reminder
   */
  private async scheduleNotification(reminder: Reminder): Promise<void> {
    logger.dev('[ReminderService] 📅 Starting notification scheduling for reminder:', {
      reminderId: reminder.id,
      title: reminder.title,
      scheduledDate: reminder.scheduledDate,
      frequency: reminder.frequency,
      isActive: reminder.isActive,
      isCompleted: reminder.isCompleted,
      settingsEnabled: this.settings.enabled
    });

    if (!this.settings.enabled) {
      logger.dev('[ReminderService] 🔕 Notifications disabled in settings, skipping scheduling');
      return;
    }

    if (!reminder.isActive) {
      logger.dev('[ReminderService] ⏸️ Reminder is inactive, skipping scheduling');
      return;
    }

    if (reminder.isCompleted) {
      logger.dev('[ReminderService] ✅ Reminder is completed, skipping scheduling');
      return;
    }

    try {
      const scheduledDate = new Date(reminder.scheduledDate);
      const now = new Date();
      
      logger.dev('[ReminderService] 🕐 Time comparison:', {
        scheduledDate: scheduledDate.toISOString(),
        currentTime: now.toISOString(),
        isPastDate: scheduledDate <= now,
        timeDifference: scheduledDate.getTime() - now.getTime()
      });
      
      // Don't schedule notifications for past dates
      if (scheduledDate <= now) {
        logger.warn(`[ReminderService] ⚠️ Skipping notification for past date:`, {
          reminderId: reminder.id,
          scheduledDate: scheduledDate.toISOString(),
          currentTime: now.toISOString(),
          pastBy: now.getTime() - scheduledDate.getTime()
        });
        return;
      }

      const notificationContent = {
        title: reminder.title,
        body: reminder.message || `Reminder for: ${reminder.title}`,
        data: {
          reminderId: reminder.id,
          noteId: reminder.noteId,
          frequency: reminder.frequency,
          createdAt: reminder.createdAt,
        },
      };

      logger.dev('[ReminderService] 📧 Notification content prepared:', {
        title: notificationContent.title,
        body: notificationContent.body,
        dataKeys: Object.keys(notificationContent.data),
        contentSize: JSON.stringify(notificationContent).length
      });
      
      const secondsUntilTrigger = Math.floor((scheduledDate.getTime() - Date.now()) / 1000);
      const minutesUntilTrigger = Math.floor(secondsUntilTrigger / 60);
      const hoursUntilTrigger = Math.floor(minutesUntilTrigger / 60);
      
      logger.dev('[ReminderService] ⏱️ Trigger timing:', {
        secondsUntilTrigger,
        minutesUntilTrigger,
        hoursUntilTrigger,
        humanReadable: hoursUntilTrigger > 0 
          ? `${hoursUntilTrigger}h ${minutesUntilTrigger % 60}m`
          : minutesUntilTrigger > 0 
            ? `${minutesUntilTrigger}m ${secondsUntilTrigger % 60}s`
            : `${secondsUntilTrigger}s`
      });
      
      // Prepare proper notification trigger
      let trigger: any = null;
      
      if (secondsUntilTrigger > 1) {
        trigger = { seconds: secondsUntilTrigger };
      } else {
        // For past dates or very near future (< 1 second), trigger immediately
        trigger = null;
      }
      
      logger.dev('[ReminderService] 📅 Using notification trigger:', {
        triggerType: trigger ? 'scheduled' : 'immediate',
        trigger,
        scheduledForFuture: secondsUntilTrigger > 1
      });
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      // Store notification ID for later cancellation
      reminder.notificationId = notificationId;
      
      logger.dev('[ReminderService] ✅ Notification scheduled successfully:', {
        notificationId,
        reminderId: reminder.id,
        reminderTitle: reminder.title,
        scheduledFor: scheduledDate.toISOString(),
        timeUntilTrigger: `${hoursUntilTrigger}h ${minutesUntilTrigger % 60}m`,
        notificationIdType: typeof notificationId
      });
      
    } catch (error) {
      logger.error(`[ReminderService] ❌ NOTIFICATION SCHEDULING FAILED for reminder ${reminder.id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        reminderId: reminder.id,
        reminderTitle: reminder.title,
        scheduledDate: reminder.scheduledDate,
        timestamp: new Date().toISOString()
      });
      
      // Don't throw - continue with other operations
      logger.dev('[ReminderService] 🔄 Continuing despite notification scheduling failure...');
    }
  }

  /**
   * Cancel a notification for a reminder
   */
  private async cancelNotification(reminderId: string): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 🔕 CANCELLING NOTIFICATION - Start operation:', {
      reminderId,
      timestamp: new Date().toISOString()
    });
    
    try {
      const reminder = this.reminders.get(reminderId);
      if (!reminder) {
        logger.dev('[ReminderService] ℹ️ Reminder not found in memory, cannot cancel notification:', {
          reminderId,
          totalReminders: this.reminders.size,
          searchResult: 'not found'
        });
        return;
      }

      if (!reminder.notificationId) {
        logger.dev('[ReminderService] ℹ️ No notification to cancel (no notification ID):', {
          reminderId,
          reminderTitle: reminder.title,
          notificationId: null,
          skippingCancel: true
        });
        return;
      }

      logger.dev('[ReminderService] 🎯 Found notification to cancel:', {
        reminderId,
        reminderTitle: reminder.title,
        notificationId: reminder.notificationId,
        notificationIdType: typeof reminder.notificationId,
        reminderActive: reminder.isActive,
        reminderCompleted: reminder.isCompleted
      });

      logger.dev('[ReminderService] 🚫 Calling Notifications.cancelScheduledNotificationAsync...');
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      
      // Clear notification ID from reminder
      const oldNotificationId = reminder.notificationId;
      reminder.notificationId = undefined;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ NOTIFICATION CANCELLATION SUCCESSFUL:', {
        reminderId,
        reminderTitle: reminder.title,
        cancelledNotificationId: oldNotificationId,
        duration: `${duration}ms`,
        notificationIdCleared: reminder.notificationId === undefined
      });
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ NOTIFICATION CANCELLATION FAILED:', {
        reminderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        continuingOperation: true
      });
      
      // Don't throw - this is a cleanup operation that shouldn't block other operations
      logger.dev('[ReminderService] 🔄 Continuing despite notification cancellation failure...');
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Calculate next trigger date for recurring reminders
   */
  private calculateNextTrigger(reminder: Reminder): string {
    const scheduledDate = new Date(reminder.scheduledDate);
    const now = new Date();
    
    let nextDate = new Date(scheduledDate);

    switch (reminder.frequency) {
      case 'daily':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      case 'weekly':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;
      case 'monthly':
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'yearly':
        while (nextDate <= now) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        break;
      default:
        return reminder.scheduledDate;
    }

    return nextDate.toISOString();
  }

  /**
   * Generate common time suggestions
   */
  private generateCommonTimeSuggestions(now: Date): SmartDateSuggestion[] {
    const suggestions: SmartDateSuggestion[] = [];

    // Tomorrow 9 AM
    const tomorrow9AM = new Date(now);
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    
    suggestions.push({
      type: 'common_time',
      label: 'Tomorrow 9 AM',
      suggestedDate: tomorrow9AM.toISOString(),
      description: 'Remind me tomorrow morning',
      icon: 'sunny-outline',
    });

    // This evening 6 PM
    const today6PM = new Date(now);
    today6PM.setHours(18, 0, 0, 0);
    
    if (today6PM > now) {
      suggestions.push({
        type: 'common_time',
        label: 'This evening 6 PM',
        suggestedDate: today6PM.toISOString(),
        description: 'Remind me this evening',
        icon: 'moon-outline',
      });
    }

    return suggestions;
  }

  /**
   * Generate relative date suggestions
   */
  private generateRelativeDateSuggestions(now: Date): SmartDateSuggestion[] {
    const suggestions: SmartDateSuggestion[] = [];

    // In 1 week
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    suggestions.push({
      type: 'relative_date',
      label: 'In 1 week',
      suggestedDate: nextWeek.toISOString(),
      description: 'Remind me next week',
      icon: 'calendar-outline',
    });

    // In 1 month
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    suggestions.push({
      type: 'relative_date',
      label: 'In 1 month',
      suggestedDate: nextMonth.toISOString(),
      description: 'Remind me next month',
      icon: 'time-outline',
    });

    return suggestions;
  }

  /**
   * Generate contextual suggestions based on note content
   */
  private generateContextualSuggestions(note: Note, now: Date): SmartDateSuggestion[] {
    const suggestions: SmartDateSuggestion[] = [];

    // Suggest moving note date to reminder date
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    suggestions.push({
      type: 'move_note_date',
      label: 'Move note to this date',
      suggestedDate: tomorrow.toISOString(),
      description: 'Set reminder and move note creation date to match',
      icon: 'swap-horizontal-outline',
      requiresConfirmation: true,
    });

    return suggestions;
  }

  // Helper methods for data management
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private generateUniqueId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateReminderCreation(data: ReminderCreationData): Promise<void> {
    if (!data.noteId) throw new Error('Note ID is required');
    if (!data.scheduledDate) throw new Error('Scheduled date is required');
    
    const scheduledDate = new Date(data.scheduledDate);
    if (scheduledDate <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }

    // Check reminder limit per note
    const existingReminders = Array.from(this.reminders.values())
      .filter(r => r.noteId === data.noteId && r.isActive);
    
    if (existingReminders.length >= this.config.maxRemindersPerNote) {
      throw new Error(`Maximum ${this.config.maxRemindersPerNote} reminders per note allowed`);
    }
  }

  // Storage methods
  private async loadReminders(): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 📂 LOADING REMINDERS - Start operation:', {
      storageKey: REMINDER_STORAGE_KEYS.REMINDERS,
      currentMemoryCount: this.reminders.size,
      timestamp: new Date().toISOString()
    });
    
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEYS.REMINDERS);
      
      if (!stored) {
        logger.dev('[ReminderService] 📭 No stored reminders found in AsyncStorage:', {
          storageKey: REMINDER_STORAGE_KEYS.REMINDERS,
          result: 'empty',
          startingFresh: true
        });
        return;
      }

      logger.dev('[ReminderService] 📄 Found stored reminders data:', {
        dataLength: stored.length,
        dataSize: `${(stored.length / 1024).toFixed(2)} KB`,
        parseAttempting: true
      });
      
      let remindersArray: Reminder[];
      try {
        remindersArray = JSON.parse(stored);
        logger.dev('[ReminderService] ✅ Successfully parsed reminders JSON:', {
          arrayLength: remindersArray.length,
          isArray: Array.isArray(remindersArray)
        });
      } catch (parseError) {
        logger.error('[ReminderService] ❌ JSON parsing failed:', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          dataPreview: stored.substring(0, 100) + '...',
          dataLength: stored.length
        });
        throw new Error(`Failed to parse reminders JSON: ${parseError}`);
      }
      
      // Clear memory and validate each reminder
      const beforeClearCount = this.reminders.size;
      this.reminders.clear();
      logger.dev('[ReminderService] 🗄️ Cleared memory cache:', {
        beforeCount: beforeClearCount,
        afterCount: this.reminders.size
      });
      
      let validCount = 0;
      let invalidCount = 0;
      const validationErrors: string[] = [];
      
      logger.dev('[ReminderService] 🔍 Validating and loading reminders...');
      remindersArray.forEach((reminder, index) => {
        try {
          // Basic validation
          if (!reminder.id || !reminder.noteId || !reminder.scheduledDate) {
            invalidCount++;
            const error = `Invalid reminder at index ${index}: missing required fields`;
            validationErrors.push(error);
            logger.warn('[ReminderService] ⚠️ Skipping invalid reminder:', {
              index,
              id: reminder.id || 'missing',
              noteId: reminder.noteId || 'missing',
              scheduledDate: reminder.scheduledDate || 'missing',
              reason: 'missing required fields'
            });
            return;
          }

          this.reminders.set(reminder.id, reminder);
          validCount++;
          
          if (validCount <= 5) { // Log details for first 5 reminders
            logger.dev(`[ReminderService] ➕ Loaded reminder ${validCount}:`, {
              id: reminder.id,
              title: reminder.title,
              noteId: reminder.noteId,
              frequency: reminder.frequency,
              isActive: reminder.isActive,
              isCompleted: reminder.isCompleted,
              scheduledDate: reminder.scheduledDate
            });
          }
        } catch (itemError) {
          invalidCount++;
          const error = `Error processing reminder at index ${index}: ${itemError}`;
          validationErrors.push(error);
          logger.error('[ReminderService] ❌ Error processing reminder:', {
            index,
            error: itemError instanceof Error ? itemError.message : String(itemError),
            reminderPreview: JSON.stringify(reminder).substring(0, 100)
          });
        }
      });
      
      // Calculate statistics
      const loadedReminders = Array.from(this.reminders.values());
      const stats = {
        total: loadedReminders.length,
        active: loadedReminders.filter(r => r.isActive && !r.isCompleted).length,
        completed: loadedReminders.filter(r => r.isCompleted).length,
        inactive: loadedReminders.filter(r => !r.isActive && !r.isCompleted).length,
        recurring: loadedReminders.filter(r => r.frequency !== 'once').length,
        withNotifications: loadedReminders.filter(r => r.notificationId).length,
        overdue: loadedReminders.filter(r => {
          const now = new Date().toISOString();
          return r.isActive && !r.isCompleted && r.scheduledDate < now;
        }).length
      };

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ REMINDER LOADING COMPLETE:', {
        source: 'AsyncStorage',
        totalFound: remindersArray.length,
        validLoaded: validCount,
        invalidSkipped: invalidCount,
        validationErrors: validationErrors.length,
        duration: `${duration}ms`,
        statistics: stats,
        memoryUsage: `${this.reminders.size} reminders in memory`
      });

      if (validationErrors.length > 0 && validationErrors.length <= 3) {
        logger.warn('[ReminderService] ⚠️ Validation errors encountered:', validationErrors);
      } else if (validationErrors.length > 3) {
        logger.warn(`[ReminderService] ⚠️ ${validationErrors.length} validation errors encountered (showing first 3):`, validationErrors.slice(0, 3));
      }
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ REMINDER LOADING FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        storageKey: REMINDER_STORAGE_KEYS.REMINDERS,
        memoryState: this.reminders.size,
        timestamp: new Date().toISOString()
      });
      
      // Don't throw - we can continue with empty reminders
      logger.dev('[ReminderService] 🔄 Continuing with empty reminder set due to loading failure...');
    }
  }

  private async saveReminders(): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 💾 SAVING REMINDERS - Start operation:', {
      storageKey: REMINDER_STORAGE_KEYS.REMINDERS,
      currentMemoryCount: this.reminders.size,
      timestamp: new Date().toISOString()
    });
    
    try {
      const remindersArray = Array.from(this.reminders.values());
      
      // Calculate statistics before saving
      const stats = {
        total: remindersArray.length,
        active: remindersArray.filter(r => r.isActive && !r.isCompleted).length,
        completed: remindersArray.filter(r => r.isCompleted).length,
        inactive: remindersArray.filter(r => !r.isActive && !r.isCompleted).length,
        recurring: remindersArray.filter(r => r.frequency !== 'once').length,
        withNotifications: remindersArray.filter(r => r.notificationId).length,
        overdue: remindersArray.filter(r => {
          const now = new Date().toISOString();
          return r.isActive && !r.isCompleted && r.scheduledDate < now;
        }).length,
        frequencies: remindersArray.reduce((acc, r) => {
          acc[r.frequency] = (acc[r.frequency] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      logger.dev('[ReminderService] 📊 Pre-save statistics:', stats);
      
      // Serialize to JSON
      let jsonData: string;
      try {
        jsonData = JSON.stringify(remindersArray);
        logger.dev('[ReminderService] ✅ JSON serialization successful:', {
          arrayLength: remindersArray.length,
          jsonSize: `${(jsonData.length / 1024).toFixed(2)} KB`,
          jsonLength: jsonData.length
        });
      } catch (serializeError) {
        logger.error('[ReminderService] ❌ JSON serialization failed:', {
          error: serializeError instanceof Error ? serializeError.message : String(serializeError),
          reminderCount: remindersArray.length,
          sampleReminder: remindersArray.length > 0 ? {
            id: remindersArray[0].id,
            title: remindersArray[0].title,
            type: typeof remindersArray[0]
          } : 'none'
        });
        throw new Error(`JSON serialization failed: ${serializeError}`);
      }
      
      // Save to AsyncStorage
      logger.dev('[ReminderService] 💽 Writing to AsyncStorage...');
      await AsyncStorage.setItem(REMINDER_STORAGE_KEYS.REMINDERS, jsonData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ REMINDER SAVING COMPLETE:', {
        destination: 'AsyncStorage',
        storageKey: REMINDER_STORAGE_KEYS.REMINDERS,
        reminderCount: remindersArray.length,
        dataSize: `${(jsonData.length / 1024).toFixed(2)} KB`,
        duration: `${duration}ms`,
        statistics: stats,
        success: true
      });
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ REMINDER SAVING FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        storageKey: REMINDER_STORAGE_KEYS.REMINDERS,
        reminderCount: this.reminders.size,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw because save failures should be handled upstream
    }
  }

  private async debouncedSave(): Promise<void> {
    // Clear existing timer
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    // Create new promise-based timer to prevent race conditions
    return new Promise((resolve, reject) => {
      this.saveDebounceTimer = setTimeout(async () => {
        try {
          await this.saveReminders();
          this.saveDebounceTimer = null;
          resolve();
        } catch (error) {
          this.saveDebounceTimer = null;
          reject(error);
        }
      }, 1000);
    });
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEYS.CONFIG);
      if (stored) {
        this.config = { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('[ReminderService] Failed to load config:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEYS.SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('[ReminderService] Failed to load settings:', error);
    }
  }

  private async rescheduleAllActiveReminders(): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] ⏰ RESCHEDULING ACTIVE REMINDERS - Start operation');
    
    try {
      const activeReminders = Array.from(this.reminders.values())
        .filter(r => r.isActive && !r.isCompleted);
        
      logger.dev('[ReminderService] 📊 Found active reminders to reschedule:', {
        totalReminders: this.reminders.size,
        activeReminders: activeReminders.length,
        completedReminders: Array.from(this.reminders.values()).filter(r => r.isCompleted).length,
        inactiveReminders: Array.from(this.reminders.values()).filter(r => !r.isActive && !r.isCompleted).length
      });

      if (activeReminders.length === 0) {
        logger.dev('[ReminderService] ℹ️ No active reminders to reschedule');
        return;
      }

      let scheduledCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      logger.dev('[ReminderService] 🔄 Processing reminders for rescheduling...');
      
      for (const reminder of activeReminders) {
        try {
          logger.dev(`[ReminderService] 📅 Rescheduling reminder ${scheduledCount + 1}/${activeReminders.length}:`, {
            id: reminder.id,
            title: reminder.title,
            scheduledDate: reminder.scheduledDate,
            frequency: reminder.frequency
          });
          
          await this.scheduleNotification(reminder);
          scheduledCount++;
          
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to reschedule ${reminder.id}: ${error}`;
          errors.push(errorMsg);
          logger.error('[ReminderService] ❌ Rescheduling error:', {
            reminderId: reminder.id,
            reminderTitle: reminder.title,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ RESCHEDULING COMPLETE:', {
        totalProcessed: activeReminders.length,
        successfullyScheduled: scheduledCount,
        skipped: skippedCount,
        errors: errorCount,
        duration: `${duration}ms`,
        successRate: `${((scheduledCount / activeReminders.length) * 100).toFixed(1)}%`
      });

      if (errors.length > 0 && errors.length <= 3) {
        logger.warn('[ReminderService] ⚠️ Rescheduling errors:', errors);
      } else if (errors.length > 3) {
        logger.warn(`[ReminderService] ⚠️ ${errors.length} rescheduling errors (showing first 3):`, errors.slice(0, 3));
      }
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ RESCHEDULING OPERATION FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Don't throw - this is initialization cleanup
      logger.dev('[ReminderService] 🔄 Continuing initialization despite rescheduling failure...');
    }
  }

  private async cleanupExpiredReminders(): Promise<void> {
    const startTime = Date.now();
    logger.dev('[ReminderService] 🧹 CLEANING UP EXPIRED REMINDERS - Start operation');
    
    try {
      const now = new Date();
      const expiredReminders = Array.from(this.reminders.values())
        .filter(r => {
          if (r.frequency !== 'once') return false;
          const scheduledDate = new Date(r.scheduledDate);
          const expiredThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
          return scheduledDate < expiredThreshold;
        });

      logger.dev('[ReminderService] 📊 Expired reminder analysis:', {
        totalReminders: this.reminders.size,
        expiredFound: expiredReminders.length,
        checkingCriteria: 'one-time reminders older than 24 hours',
        currentTime: now.toISOString(),
        expiredThreshold: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      });

      if (expiredReminders.length === 0) {
        logger.dev('[ReminderService] ✅ No expired reminders found - cleanup not needed');
        return;
      }

      let cleanedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      logger.dev('[ReminderService] 🗑️ Processing expired reminders...');
      
      for (const reminder of expiredReminders) {
        try {
          if (!reminder.isCompleted && reminder.isActive) {
            logger.dev('[ReminderService] 📝 Auto-completing expired active reminder:', {
              id: reminder.id,
              title: reminder.title,
              scheduledDate: reminder.scheduledDate,
              wasActive: reminder.isActive,
              wasCompleted: reminder.isCompleted
            });
            
            await this.updateReminder(reminder.id, { 
              isCompleted: true, 
              isActive: false,
              lastTriggered: new Date().toISOString()
            });
            
            cleanedCount++;
          } else {
            logger.dev('[ReminderService] ℹ️ Skipping expired reminder (already completed/inactive):', {
              id: reminder.id,
              title: reminder.title,
              isCompleted: reminder.isCompleted,
              isActive: reminder.isActive
            });
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to cleanup ${reminder.id}: ${error}`;
          errors.push(errorMsg);
          logger.error('[ReminderService] ❌ Cleanup error:', {
            reminderId: reminder.id,
            reminderTitle: reminder.title,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.dev('[ReminderService] ✅ CLEANUP COMPLETE:', {
        expiredFound: expiredReminders.length,
        cleanedUp: cleanedCount,
        errors: errorCount,
        duration: `${duration}ms`,
        currentActiveReminders: Array.from(this.reminders.values()).filter(r => r.isActive && !r.isCompleted).length,
        currentCompletedReminders: Array.from(this.reminders.values()).filter(r => r.isCompleted).length
      });

      if (errors.length > 0) {
        logger.warn('[ReminderService] ⚠️ Cleanup errors:', errors);
      }
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error('[ReminderService] ❌ CLEANUP OPERATION FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Don't throw - this is initialization cleanup
      logger.dev('[ReminderService] 🔄 Continuing initialization despite cleanup failure...');
    }
  }

  /**
   * Delete all reminders for a specific note
   */
  async deleteRemindersForNote(noteId: string): Promise<void> {
    logger.dev('[ReminderService] 🗑️ Starting delete operation for all reminders of note:', noteId);
    
    await this.ensureInitialized();
    
    const noteReminders = Array.from(this.reminders.values())
      .filter(r => r.noteId === noteId);
    
    if (noteReminders.length === 0) {
      logger.dev('[ReminderService] ℹ️ No reminders found for note:', noteId);
      return;
    }

    logger.dev('[ReminderService] 📊 Found reminders to delete:', {
      noteId,
      reminderCount: noteReminders.length,
      reminderIds: noteReminders.map(r => r.id)
    });

    // Delete each reminder
    for (const reminder of noteReminders) {
      try {
        await this.deleteReminder(reminder.id);
        logger.dev('[ReminderService] ✅ Deleted reminder:', {
          id: reminder.id,
          title: reminder.title
        });
      } catch (error) {
        logger.error('[ReminderService] ❌ Failed to delete reminder:', {
          id: reminder.id,
          title: reminder.title,
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with other reminders even if one fails
      }
    }

    logger.dev('[ReminderService] ✅ Completed deletion of all reminders for note:', noteId);
  }

  // Event handling
  private notifyListeners(): void {
    const allReminders = Array.from(this.reminders.values());
    this.listeners.forEach(callback => callback(allReminders));
  }

  private emitEvent(eventType: string, data: any): void {
    logger.dev(`[ReminderService] Event: ${eventType}`, data);
    // Event emission for UI integration
  }

  private handleNotificationReceived(notification: any): void {
    logger.dev('[ReminderService] 🔔 Processing received notification:', {
      identifier: notification.request?.identifier,
      contentTitle: notification.request?.content?.title,
      hasData: !!notification.request?.content?.data,
      dataKeys: notification.request?.content?.data ? Object.keys(notification.request.content.data) : [],
      receivedAt: new Date().toISOString()
    });
    
    const data = notification.request?.content?.data;
    if (data?.reminderId) {
      logger.dev('[ReminderService] 🎯 Found reminder data in notification:', {
        reminderId: data.reminderId,
        noteId: data.noteId,
        frequency: data.frequency,
        createdAt: data.createdAt
      });
      
      // Mark reminder as triggered (if it exists)
      const reminder = this.reminders.get(data.reminderId);
      if (reminder) {
        logger.dev('[ReminderService] ✅ Found matching reminder in memory:', {
          reminderId: reminder.id,
          title: reminder.title,
          wasActive: reminder.isActive,
          wasCompleted: reminder.isCompleted
        });
        
        // You could implement auto-completion or other logic here
        logger.dev('[ReminderService] ℹ️ Notification received for active reminder - no auto-actions configured');
      } else {
        logger.warn('[ReminderService] ⚠️ Notification received for unknown reminder:', {
          reminderId: data.reminderId,
          possibleCause: 'reminder deleted or not loaded'
        });
      }
    } else {
      logger.dev('[ReminderService] ℹ️ Notification received without reminder data');
    }
  }

  private handleNotificationTapped(response: any): void {
    logger.dev('[ReminderService] 👆 Processing notification tap:', {
      actionIdentifier: response.actionIdentifier,
      hasUserText: !!response.userText,
      notificationId: response.notification?.request?.identifier,
      timestamp: new Date().toISOString()
    });
    
    const data = response.notification?.request?.content?.data;
    if (data?.noteId) {
      logger.dev('[ReminderService] 🎯 Found note navigation data:', {
        noteId: data.noteId,
        reminderId: data.reminderId,
        frequency: data.frequency,
        navigationTarget: 'note detail'
      });
      
      logger.dev('[ReminderService] 🚀 Emitting navigation event for note:', data.noteId);
      this.emitEvent('navigateToNote', { 
        noteId: data.noteId, 
        reminderId: data.reminderId,
        source: 'notification_tap',
        timestamp: new Date().toISOString()
      });
      
      // Mark reminder as triggered if it exists
      if (data.reminderId) {
        const reminder = this.reminders.get(data.reminderId);
        if (reminder && reminder.isActive && !reminder.isCompleted) {
          logger.dev('[ReminderService] 📝 Marking reminder as triggered by user tap:', {
            reminderId: reminder.id,
            title: reminder.title
          });
          
          reminder.lastTriggered = new Date().toISOString();
          // Don't auto-complete - let user decide in the app
        }
      }
    } else {
      logger.dev('[ReminderService] ℹ️ Notification tapped without navigation data');
    }
  }

  private invalidateAnalyticsCache(): void {
    this.analyticsCache = null;
    this.analyticsCacheTime = 0;
  }

  // Helper methods for analytics
  private applyFilter(reminders: Reminder[], filter: ReminderQueryFilter): Reminder[] {
    return reminders.filter(reminder => {
      if (filter.noteId && reminder.noteId !== filter.noteId) return false;
      if (filter.isActive !== undefined && reminder.isActive !== filter.isActive) return false;
      if (filter.isCompleted !== undefined && reminder.isCompleted !== filter.isCompleted) return false;
      if (filter.frequency && reminder.frequency !== filter.frequency) return false;
      if (filter.dateFrom && reminder.scheduledDate < filter.dateFrom) return false;
      if (filter.dateTo && reminder.scheduledDate > filter.dateTo) return false;
      if (filter.overdueOnly) {
        const now = new Date().toISOString();
        if (reminder.scheduledDate >= now || reminder.isCompleted) return false;
      }
      return true;
    });
  }

  private sortReminders(reminders: Reminder[], sortOptions?: ReminderSortOptions): Reminder[] {
    if (!sortOptions) {
      // Default sort: upcoming reminders first
      return reminders.sort((a, b) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
    }

    return reminders.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOptions.field) {
        case 'scheduledDate':
          aValue = new Date(a.scheduledDate).getTime();
          bValue = new Date(b.scheduledDate).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOptions.direction === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  private getRemindersForDateRange(startDate: Date, endDate: Date): Reminder[] {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    
    return Array.from(this.reminders.values())
      .filter(r => r.isActive && !r.isCompleted && 
        r.scheduledDate >= start && r.scheduledDate <= end);
  }

  private calculateMostUsedFrequency(reminders: Reminder[]): ReminderFrequency {
    const frequencyCount = new Map<ReminderFrequency, number>();
    
    reminders.forEach(r => {
      frequencyCount.set(r.frequency, (frequencyCount.get(r.frequency) || 0) + 1);
    });

    let mostUsed: ReminderFrequency = 'once';
    let maxCount = 0;
    
    frequencyCount.forEach((count, frequency) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = frequency;
      }
    });

    return mostUsed;
  }

  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private getEndOfWeek(date: Date): Date {
    const end = new Date(date);
    const daysToAdd = 6 - end.getDay(); // Sunday = 0
    end.setDate(end.getDate() + daysToAdd);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  // Public API for listeners
  public addListener(id: string, callback: (reminders: Reminder[]) => void): void {
    this.listeners.set(id, callback);
    logger.dev(`[ReminderService] 📡 Added listener: ${id}, total: ${this.listeners.size}`);
  }

  public removeListener(id: string): void {
    const removed = this.listeners.delete(id);
    logger.dev(`[ReminderService] 🗑️ Removed listener: ${id}, success: ${removed}, remaining: ${this.listeners.size}`);
  }

  public clearAllListeners(): void {
    const count = this.listeners.size;
    this.listeners.clear();
    logger.dev(`[ReminderService] 🧹 Cleared all ${count} listeners`);
  }
}
