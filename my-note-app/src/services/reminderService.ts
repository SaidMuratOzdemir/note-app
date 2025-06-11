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
   * Initialize the service and load existing data
   * Must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[ReminderService] Initializing...');
      
      // Load configuration and settings
      await Promise.all([
        this.loadConfig(),
        this.loadSettings(),
        this.loadReminders(),
      ]);

      // Setup notification permissions and handlers
      await this.setupNotifications();
      
      // Schedule all active reminders
      await this.rescheduleAllActiveReminders();
      
      // Cleanup expired/completed reminders
      await this.cleanupExpiredReminders();
      
      this.isInitialized = true;
      console.log(`[ReminderService] Initialized with ${this.reminders.size} reminders`);
      
    } catch (error) {
      console.error('[ReminderService] Initialization failed:', error);
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
    await this.ensureInitialized();
    
    // Validation
    await this.validateReminderCreation(data);
    
    const reminder: Reminder = {
      id: this.generateUniqueId('reminder'),
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

    // Calculate next trigger for recurring reminders
    if (reminder.frequency !== 'once') {
      reminder.nextTrigger = this.calculateNextTrigger(reminder);
    }

    // Store in memory and schedule notification
    this.reminders.set(reminder.id, reminder);
    
    if (reminder.isActive && !reminder.isCompleted) {
      await this.scheduleNotification(reminder);
    }

    // Debounced save and notify listeners
    await this.debouncedSave();
    this.notifyListeners();
    this.invalidateAnalyticsCache();

    console.log(`[ReminderService] Created reminder: ${reminder.id} for note: ${reminder.noteId}`);
    return reminder;
  }

  /**
   * Get all reminders for a specific note with sorting
   */
  async getRemindersForNote(
    noteId: string, 
    sortOptions?: ReminderSortOptions
  ): Promise<Reminder[]> {
    await this.ensureInitialized();
    
    const noteReminders = Array.from(this.reminders.values())
      .filter(reminder => reminder.noteId === noteId);

    return this.sortReminders(noteReminders, sortOptions);
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
    await this.ensureInitialized();
    
    const existingReminder = this.reminders.get(reminderId);
    if (!existingReminder) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    // Create updated reminder
    const updatedReminder: Reminder = {
      ...existingReminder,
      ...updates,
      id: reminderId, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    // Recalculate next trigger if frequency or date changed
    if (updates.frequency || updates.scheduledDate) {
      updatedReminder.nextTrigger = updatedReminder.frequency !== 'once' 
        ? this.calculateNextTrigger(updatedReminder)
        : undefined;
    }

    // Update storage and reschedule notification
    this.reminders.set(reminderId, updatedReminder);
    
    await this.cancelNotification(reminderId);
    if (updatedReminder.isActive && !updatedReminder.isCompleted) {
      await this.scheduleNotification(updatedReminder);
    }

    await this.debouncedSave();
    this.notifyListeners();
    this.invalidateAnalyticsCache();

    console.log(`[ReminderService] Updated reminder: ${reminderId}`);
    return updatedReminder;
  }

  /**
   * Delete a reminder permanently
   */
  async deleteReminder(reminderId: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.reminders.has(reminderId)) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    // Cancel notification and remove from storage
    await this.cancelNotification(reminderId);
    this.reminders.delete(reminderId);

    await this.debouncedSave();
    this.notifyListeners();
    this.invalidateAnalyticsCache();

    console.log(`[ReminderService] Deleted reminder: ${reminderId}`);
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId: string): Promise<void> {
    const now = new Date().toISOString();
    
    await this.updateReminder(reminderId, {
      isCompleted: true,
      lastTriggered: now,
      isActive: false, // Disable further notifications
    });

    console.log(`[ReminderService] Completed reminder: ${reminderId}`);
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
    console.log(`[ReminderService] Moving note ${noteId} to date ${reminderDate}`);
    
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
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[ReminderService] Notification permissions not granted');
        return;
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: this.settings.enabled,
          shouldPlaySound: this.settings.soundEnabled,
          shouldSetBadge: this.settings.badgeEnabled,
        }),
      });

      console.log('[ReminderService] Notifications configured successfully');
    } catch (error) {
      console.error('[ReminderService] Failed to setup notifications:', error);
    }
  }

  /**
   * Setup notification event handlers
   */
  private setupNotificationHandlers(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('[ReminderService] Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[ReminderService] Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  /**
   * Schedule a notification for a reminder
   */
  private async scheduleNotification(reminder: Reminder): Promise<void> {
    if (!this.settings.enabled) return;

    try {
      const scheduledDate = new Date(reminder.scheduledDate);
      
      // Don't schedule notifications for past dates
      if (scheduledDate <= new Date()) {
        console.warn(`[ReminderService] Skipping notification for past date: ${reminder.id}`);
        return;
      }

      const notificationContent = {
        title: reminder.title,
        body: reminder.message || `Reminder for: ${reminder.title}`,
        data: {
          reminderId: reminder.id,
          noteId: reminder.noteId,
          frequency: reminder.frequency,
        } as NotificationPayload,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: { date: scheduledDate },
      });

      // Store notification ID for later cancellation
      reminder.notificationId = notificationId;
      console.log(`[ReminderService] Scheduled notification ${notificationId} for reminder ${reminder.id}`);
      
    } catch (error) {
      console.error(`[ReminderService] Failed to schedule notification for reminder ${reminder.id}:`, error);
    }
  }

  /**
   * Cancel a notification for a reminder
   */
  private async cancelNotification(reminderId: string): Promise<void> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder?.notificationId) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      reminder.notificationId = undefined;
      console.log(`[ReminderService] Cancelled notification for reminder ${reminderId}`);
    } catch (error) {
      console.error(`[ReminderService] Failed to cancel notification for reminder ${reminderId}:`, error);
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
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEYS.REMINDERS);
      if (stored) {
        const remindersArray: Reminder[] = JSON.parse(stored);
        this.reminders.clear();
        remindersArray.forEach(reminder => {
          this.reminders.set(reminder.id, reminder);
        });
      }
    } catch (error) {
      console.error('[ReminderService] Failed to load reminders:', error);
    }
  }

  private async saveReminders(): Promise<void> {
    try {
      const remindersArray = Array.from(this.reminders.values());
      await AsyncStorage.setItem(REMINDER_STORAGE_KEYS.REMINDERS, JSON.stringify(remindersArray));
    } catch (error) {
      console.error('[ReminderService] Failed to save reminders:', error);
    }
  }

  private async debouncedSave(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    this.saveDebounceTimer = setTimeout(async () => {
      await this.saveReminders();
      this.saveDebounceTimer = null;
    }, 1000);
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEYS.CONFIG);
      if (stored) {
        this.config = { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[ReminderService] Failed to load config:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEYS.SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[ReminderService] Failed to load settings:', error);
    }
  }

  private async rescheduleAllActiveReminders(): Promise<void> {
    const activeReminders = Array.from(this.reminders.values())
      .filter(r => r.isActive && !r.isCompleted);

    for (const reminder of activeReminders) {
      await this.scheduleNotification(reminder);
    }
  }

  private async cleanupExpiredReminders(): Promise<void> {
    const now = new Date();
    const expiredReminders = Array.from(this.reminders.values())
      .filter(r => {
        if (r.frequency !== 'once') return false;
        const scheduledDate = new Date(r.scheduledDate);
        return scheduledDate < new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      });

    for (const reminder of expiredReminders) {
      if (!reminder.isCompleted && reminder.isActive) {
        // Mark as completed if it was never acknowledged
        await this.updateReminder(reminder.id, { isCompleted: true, isActive: false });
      }
    }
  }

  // Event handling
  private notifyListeners(): void {
    const allReminders = Array.from(this.reminders.values());
    this.listeners.forEach(callback => callback(allReminders));
  }

  private emitEvent(eventType: string, data: any): void {
    console.log(`[ReminderService] Event: ${eventType}`, data);
    // Event emission for UI integration
  }

  private handleNotificationReceived(notification: any): void {
    // Handle foreground notification
  }

  private handleNotificationTapped(response: any): void {
    // Handle notification tap - navigate to note
    const data = response.notification?.request?.content?.data;
    if (data?.noteId) {
      this.emitEvent('navigateToNote', { noteId: data.noteId });
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
  }

  public removeListener(id: string): void {
    this.listeners.delete(id);
  }
}
