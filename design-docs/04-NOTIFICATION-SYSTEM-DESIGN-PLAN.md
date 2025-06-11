# 🔔 Notification System Design Master Plan

**Created:** 11 Haziran 2025  
**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Target:** Multiple custom reminders per note with smart date suggestions and recurring notifications

---

## 🎯 **DESIGN OVERVIEW**

This document covers the complete implementation of the Advanced Notification System - a comprehensive reminder feature that allows users to set multiple custom reminders per note, with smart date suggestions and the ability to move notes to reminder dates.

### 🔔 **Notification System Target Features**
- **Multiple Reminders Per Note**: Each note can have unlimited custom reminders
- **Custom Messages**: Each reminder can have its own custom notification message
- **Smart Date Suggestions**: Suggest moving note creation/update date to reminder date
- **Recurring Notifications**: Support for daily, weekly, monthly recurring reminders
- **Rich Scheduling**: Time-based reminders with full date/time picker

---

## ✅ **IMPLEMENTATION ROADMAP**

### ✅ **PHASE 1: DATA MODELS & TYPES** *(Day 1 - 4 hours)*

#### 1.1 Reminder Data Models
**File:** `/src/types/Reminder.ts` *(NEW FILE)*

```typescript
/**
 * Notification and reminder data structures
 */

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Reminder {
  id: string;                    // Unique reminder ID
  noteId: string;               // Parent note ID
  title: string;                // Reminder title (default: note title)
  message?: string;             // Custom notification message
  scheduledDate: string;        // ISO date string when reminder should trigger
  frequency: ReminderFrequency; // How often to repeat
  isActive: boolean;            // Whether reminder is enabled
  isCompleted: boolean;         // Whether reminder has been acknowledged
  createdAt: string;            // When reminder was created
  updatedAt: string;            // When reminder was last modified
  lastTriggered?: string;       // When reminder last fired
  nextTrigger?: string;         // When reminder will next fire (for recurring)
}

export interface NotificationPayload {
  reminderId: string;
  noteId: string;
  title: string;
  message: string;
  scheduledDate: string;
  frequency: ReminderFrequency;
}

export interface ReminderCreationData {
  noteId: string;
  title?: string;
  message?: string;
  scheduledDate: string;
  frequency?: ReminderFrequency;
}

export interface SmartDateSuggestion {
  type: 'move_note_date' | 'common_time' | 'relative_date';
  label: string;                // "Move note to this date" | "Tomorrow 9 AM" | "In 1 week"
  suggestedDate: string;        // ISO date string
  description: string;          // Explanation of the suggestion
}
```

#### 1.2 Note Type Extensions
**File:** `/src/types/Note.ts` *(MODIFY EXISTING)*

```typescript
// Add to existing Note interface:
export interface Note {
  // ...existing fields...
  reminders?: Reminder[];       // Array of reminders for this note
  reminderCount?: number;       // Cached count for UI performance
}
```

### ✅ **PHASE 2: REMINDER SERVICE** *(Day 1-2 - 8 hours)*

#### 2.1 Core Reminder Service
**File:** `/src/services/ReminderService.ts` *(NEW FILE)*

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, ReminderCreationData, NotificationPayload, SmartDateSuggestion } from '../types/Reminder';
import { Note } from '../types/Note';
import * as Notifications from 'expo-notifications';

const STORAGE_KEYS = {
  REMINDERS: '@note_app_reminders',
  NOTIFICATION_SETTINGS: '@note_app_notification_settings',
};

export class ReminderService {
  private static instance: ReminderService;
  private reminders: Reminder[] = [];
  private isInitialized = false;

  private constructor() {
    this.setupNotifications();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * Initialize the service and load existing reminders
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadReminders();
      await this.scheduleAllActiveReminders();
      this.isInitialized = true;
      console.log('[ReminderService] Initialized with', this.reminders.length, 'reminders');
    } catch (error) {
      console.error('[ReminderService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create a new reminder for a note
   */
  async createReminder(data: ReminderCreationData): Promise<Reminder> {
    const reminder: Reminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      noteId: data.noteId,
      title: data.title || 'Note Reminder',
      message: data.message,
      scheduledDate: data.scheduledDate,
      frequency: data.frequency || 'once',
      isActive: true,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate next trigger for recurring reminders
    if (reminder.frequency !== 'once') {
      reminder.nextTrigger = this.calculateNextTrigger(reminder);
    }

    this.reminders.push(reminder);
    await this.saveReminders();
    await this.scheduleNotification(reminder);

    console.log('[ReminderService] Created reminder:', reminder.id);
    return reminder;
  }

  /**
   * Get all reminders for a specific note
   */
  async getRemindersForNote(noteId: string): Promise<Reminder[]> {
    await this.ensureInitialized();
    return this.reminders
      .filter(reminder => reminder.noteId === noteId)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<Reminder> {
    await this.ensureInitialized();
    
    const index = this.reminders.findIndex(r => r.id === reminderId);
    if (index === -1) {
      throw new Error('Reminder not found');
    }

    const reminder = { ...this.reminders[index], ...updates, updatedAt: new Date().toISOString() };
    
    // Recalculate next trigger if frequency or date changed
    if (updates.frequency || updates.scheduledDate) {
      reminder.nextTrigger = reminder.frequency !== 'once' 
        ? this.calculateNextTrigger(reminder)
        : undefined;
    }

    this.reminders[index] = reminder;
    await this.saveReminders();
    
    // Reschedule notification
    await this.cancelNotification(reminderId);
    if (reminder.isActive && !reminder.isCompleted) {
      await this.scheduleNotification(reminder);
    }

    return reminder;
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    await this.ensureInitialized();
    
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
    await this.saveReminders();
    await this.cancelNotification(reminderId);
    
    console.log('[ReminderService] Deleted reminder:', reminderId);
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(reminderId: string): Promise<void> {
    await this.updateReminder(reminderId, { 
      isCompleted: true,
      lastTriggered: new Date().toISOString()
    });
  }

  /**
   * Generate smart date suggestions for reminder creation
   */
  generateSmartDateSuggestions(note: Note): SmartDateSuggestion[] {
    const now = new Date();
    const suggestions: SmartDateSuggestion[] = [];

    // Suggestion 1: Move note to reminder date
    suggestions.push({
      type: 'move_note_date',
      label: 'Move note to this date',
      suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      description: 'Set reminder and move note creation date to match'
    });

    // Suggestion 2: Common times
    const tomorrow9AM = new Date(now);
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    
    suggestions.push({
      type: 'common_time',
      label: 'Tomorrow 9 AM',
      suggestedDate: tomorrow9AM.toISOString(),
      description: 'Remind me tomorrow morning'
    });

    // Suggestion 3: In one week
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    suggestions.push({
      type: 'relative_date',
      label: 'In 1 week',
      suggestedDate: nextWeek.toISOString(),
      description: 'Remind me next week'
    });

    // Suggestion 4: In one month
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    suggestions.push({
      type: 'relative_date',
      label: 'In 1 month',
      suggestedDate: nextMonth.toISOString(),
      description: 'Remind me next month'
    });

    return suggestions;
  }

  /**
   * Move note date to match reminder date (smart suggestion feature)
   */
  async moveNoteToReminderDate(noteId: string, reminderDate: string): Promise<void> {
    // This will be called by the StorageService to update note's createdAt/updatedAt
    // Implementation depends on integration with StorageService
    console.log('[ReminderService] Moving note', noteId, 'to date', reminderDate);
  }

  // PRIVATE METHODS

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async loadReminders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (stored) {
        this.reminders = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[ReminderService] Failed to load reminders:', error);
      this.reminders = [];
    }
  }

  private async saveReminders(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(this.reminders));
    } catch (error) {
      console.error('[ReminderService] Failed to save reminders:', error);
      throw error;
    }
  }

  private async setupNotifications(): Promise<void> {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[ReminderService] Notification permission not granted');
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  private async scheduleNotification(reminder: Reminder): Promise<void> {
    if (!reminder.isActive || reminder.isCompleted) return;

    const scheduledDate = new Date(reminder.scheduledDate);
    const now = new Date();

    if (scheduledDate <= now) {
      console.log('[ReminderService] Skipping past reminder:', reminder.id);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: reminder.title,
          body: reminder.message || 'You have a note reminder',
          data: {
            reminderId: reminder.id,
            noteId: reminder.noteId,
          },
        },
        trigger: {
          date: scheduledDate,
        },
      });

      console.log('[ReminderService] Scheduled notification for:', reminder.id);
    } catch (error) {
      console.error('[ReminderService] Failed to schedule notification:', error);
    }
  }

  private async cancelNotification(reminderId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (error) {
      console.error('[ReminderService] Failed to cancel notification:', error);
    }
  }

  private async scheduleAllActiveReminders(): Promise<void> {
    const activeReminders = this.reminders.filter(r => r.isActive && !r.isCompleted);
    
    for (const reminder of activeReminders) {
      await this.scheduleNotification(reminder);
    }
    
    console.log('[ReminderService] Scheduled', activeReminders.length, 'active reminders');
  }

  private calculateNextTrigger(reminder: Reminder): string {
    const baseDate = new Date(reminder.scheduledDate);
    const now = new Date();

    // If the scheduled date is in the future, return it
    if (baseDate > now) {
      return reminder.scheduledDate;
    }

    // Calculate next occurrence based on frequency
    let nextDate = new Date(baseDate);

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
}
```

### ✅ **PHASE 3: UI COMPONENTS** *(Day 2-3 - 12 hours)*

#### 3.1 Reminder Form Component
**File:** `/src/components/ReminderForm.tsx` *(NEW FILE)*

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ReminderFrequency, ReminderCreationData, SmartDateSuggestion } from '../types/Reminder';
import { Note } from '../types/Note';
import { ReminderService } from '../services/ReminderService';
import { colors } from '../theme';

interface ReminderFormProps {
  note: Note;
  onSave: () => void;
  onCancel: () => void;
  editingReminder?: Reminder;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({ 
  note, 
  onSave, 
  onCancel, 
  editingReminder 
}) => {
  const [title, setTitle] = useState(editingReminder?.title || note.title || 'Note Reminder');
  const [message, setMessage] = useState(editingReminder?.message || '');
  const [selectedDate, setSelectedDate] = useState(
    editingReminder ? new Date(editingReminder.scheduledDate) : new Date()
  );
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    editingReminder?.frequency || 'once'
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const reminderService = ReminderService.getInstance();
  const smartSuggestions = reminderService.generateSmartDateSuggestions(note);

  const frequencyOptions: { value: ReminderFrequency; label: string; description: string }[] = [
    { value: 'once', label: 'Once', description: 'Single reminder' },
    { value: 'daily', label: 'Daily', description: 'Every day at this time' },
    { value: 'weekly', label: 'Weekly', description: 'Every week on this day' },
    { value: 'monthly', label: 'Monthly', description: 'Every month on this date' },
    { value: 'yearly', label: 'Yearly', description: 'Every year on this date' },
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    if (selectedDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    setIsLoading(true);
    try {
      const reminderData: ReminderCreationData = {
        noteId: note.id,
        title: title.trim(),
        message: message.trim() || undefined,
        scheduledDate: selectedDate.toISOString(),
        frequency,
      };

      if (editingReminder) {
        await reminderService.updateReminder(editingReminder.id, reminderData);
      } else {
        await reminderService.createReminder(reminderData);
      }

      onSave();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder');
      console.error('Save reminder error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartSuggestion = (suggestion: SmartDateSuggestion) => {
    setSelectedDate(new Date(suggestion.suggestedDate));
    setShowSmartSuggestions(false);
    
    if (suggestion.type === 'move_note_date') {
      Alert.alert(
        'Move Note Date',
        'Do you want to move this note\'s creation date to match the reminder?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => reminderService.moveNoteToReminderDate(note.id, suggestion.suggestedDate),
          },
        ]
      );
    }
  };

  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={isLoading}
          >
            <Text style={styles.saveText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Smart Suggestions */}
          {showSmartSuggestions && !editingReminder && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Options</Text>
              {smartSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionCard}
                  onPress={() => handleSmartSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionLabel}>{suggestion.label}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Reminder Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter reminder title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Message */}
          <View style={styles.section}>
            <Text style={styles.label}>Custom Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter custom notification message"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Date & Time</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.dateTimeText}>{formatDateTime(selectedDate)}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Frequency */}
          <View style={styles.section}>
            <Text style={styles.label}>Repeat</Text>
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.frequencyOption,
                  frequency === option.value && styles.frequencyOptionSelected
                ]}
                onPress={() => setFrequency(option.value)}
              >
                <View style={styles.frequencyContent}>
                  <Text style={[
                    styles.frequencyLabel,
                    frequency === option.value && styles.frequencyLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.frequencyDescription,
                    frequency === option.value && styles.frequencyDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {frequency === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>{title}</Text>
              {message && <Text style={styles.previewMessage}>{message}</Text>}
              <Text style={styles.previewDate}>
                {formatDateTime(selectedDate)} • {frequencyOptions.find(f => f.value === frequency)?.label}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="datetime"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
            minimumDate={new Date()}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  dateTimeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  suggestionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frequencyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  frequencyLabelSelected: {
    color: colors.primary,
  },
  frequencyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  frequencyDescriptionSelected: {
    color: colors.primary,
  },
  previewCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  previewDate: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
};
```

#### 3.2 Reminder Manager Component
**File:** `/src/components/ReminderManager.tsx` *(NEW FILE)*

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reminder } from '../types/Reminder';
import { Note } from '../types/Note';
import { ReminderService } from '../services/ReminderService';
import { ReminderForm } from './ReminderForm';
import { colors } from '../theme';

interface ReminderManagerProps {
  note: Note;
  onRemindersUpdate?: () => void;
  isExpanded?: boolean;
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({ 
  note, 
  onRemindersUpdate,
  isExpanded = false 
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(isExpanded);

  const reminderService = ReminderService.getInstance();

  useEffect(() => {
    loadReminders();
  }, [note.id]);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const noteReminders = await reminderService.getRemindersForNote(note.id);
      setReminders(noteReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderService.deleteReminder(reminder.id);
              await loadReminders();
              onRemindersUpdate?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleCompleteReminder = async (reminder: Reminder) => {
    try {
      await reminderService.completeReminder(reminder.id);
      await loadReminders();
      onRemindersUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  const toggleReminderActive = async (reminder: Reminder) => {
    try {
      await reminderService.updateReminder(reminder.id, { 
        isActive: !reminder.isActive 
      });
      await loadReminders();
      onRemindersUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const getStatusColor = (reminder: Reminder) => {
    if (reminder.isCompleted) return colors.success;
    if (!reminder.isActive) return colors.textSecondary;
    
    const now = new Date();
    const scheduledDate = new Date(reminder.scheduledDate);
    
    if (scheduledDate < now) return colors.error;
    if (scheduledDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return colors.warning;
    
    return colors.primary;
  };

  const getStatusIcon = (reminder: Reminder) => {
    if (reminder.isCompleted) return 'checkmark-circle';
    if (!reminder.isActive) return 'pause-circle';
    
    const now = new Date();
    const scheduledDate = new Date(reminder.scheduledDate);
    
    if (scheduledDate < now) return 'alert-circle';
    return 'time';
  };

  const formatReminderDate = (reminder: Reminder) => {
    const date = new Date(reminder.scheduledDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const renderReminder = ({ item: reminder }: { item: Reminder }) => {
    const statusColor = getStatusColor(reminder);
    const statusIcon = getStatusIcon(reminder);

    return (
      <View style={[styles.reminderCard, { borderLeftColor: statusColor }]}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderTitleRow}>
            <Ionicons name={statusIcon} size={20} color={statusColor} />
            <Text style={styles.reminderTitle} numberOfLines={1}>
              {reminder.title}
            </Text>
          </View>
          
          <View style={styles.reminderActions}>
            <TouchableOpacity 
              onPress={() => toggleReminderActive(reminder)}
              style={styles.actionButton}
            >
              <Ionicons 
                name={reminder.isActive ? 'pause' : 'play'} 
                size={16} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setEditingReminder(reminder)}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            {!reminder.isCompleted && (
              <TouchableOpacity 
                onPress={() => handleCompleteReminder(reminder)}
                style={styles.actionButton}
              >
                <Ionicons name="checkmark" size={16} color={colors.success} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={() => handleDeleteReminder(reminder)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {reminder.message && expanded && (
          <Text style={styles.reminderMessage} numberOfLines={2}>
            {reminder.message}
          </Text>
        )}
        
        <View style={styles.reminderFooter}>
          <Text style={[styles.reminderDate, { color: statusColor }]}>
            {formatReminderDate(reminder)}
          </Text>
          
          <View style={styles.reminderMeta}>
            {reminder.frequency !== 'once' && (
              <Text style={styles.frequencyBadge}>{reminder.frequency}</Text>
            )}
            
            <Text style={styles.reminderTime}>
              {new Date(reminder.scheduledDate).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const activeReminders = reminders.filter(r => r.isActive && !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);
  const inactiveReminders = reminders.filter(r => !r.isActive && !r.isCompleted);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>
            Reminders ({reminders.length})
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading reminders...</Text>
          ) : reminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No reminders set</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first reminder</Text>
            </View>
          ) : (
            <View style={styles.remindersList}>
              {/* Active Reminders */}
              {activeReminders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Active ({activeReminders.length})
                  </Text>
                  <FlatList
                    data={activeReminders}
                    renderItem={renderReminder}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                      <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                  />
                </View>
              )}

              {/* Completed Reminders */}
              {completedReminders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Completed ({completedReminders.length})
                  </Text>
                  <FlatList
                    data={completedReminders}
                    renderItem={renderReminder}
                    keyExtractor={(item) => item.id}
                  />
                </View>
              )}

              {/* Inactive Reminders */}
              {inactiveReminders.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Paused ({inactiveReminders.length})
                  </Text>
                  <FlatList
                    data={inactiveReminders}
                    renderItem={renderReminder}
                    keyExtractor={(item) => item.id}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingReminder) && (
        <ReminderForm
          note={note}
          editingReminder={editingReminder || undefined}
          onSave={async () => {
            setShowAddForm(false);
            setEditingReminder(null);
            await loadReminders();
            onRemindersUpdate?.();
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingReminder(null);
          }}
        />
      )}
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  addButton: {
    padding: 4,
    marginRight: 8,
  },
  content: {
    padding: 16,
  },
  remindersList: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  reminderCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  reminderMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 28,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 28,
  },
  reminderDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyBadge: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  reminderTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
};
```

#### 3.3 Reminder Badge Component
**File:** `/src/components/ReminderBadge.tsx` *(NEW FILE)*

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface ReminderBadgeProps {
  count: number;
  hasActiveReminders?: boolean;
  hasOverdueReminders?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium';
}

export const ReminderBadge: React.FC<ReminderBadgeProps> = ({
  count,
  hasActiveReminders = false,
  hasOverdueReminders = false,
  onPress,
  size = 'small'
}) => {
  if (count === 0) return null;

  const getBadgeColor = () => {
    if (hasOverdueReminders) return colors.error;
    if (hasActiveReminders) return colors.primary;
    return colors.textSecondary;
  };

  const getBadgeText = () => {
    if (count === 1) return '+1 reminder';
    return `+${count} reminders`;
  };

  const badgeColor = getBadgeColor();
  const isSmall = size === 'small';

  const styles = {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: badgeColor + '20',
      paddingHorizontal: isSmall ? 6 : 8,
      paddingVertical: isSmall ? 2 : 4,
      borderRadius: isSmall ? 10 : 12,
      borderWidth: 1,
      borderColor: badgeColor + '40',
    },
    text: {
      fontSize: isSmall ? 11 : 12,
      color: badgeColor,
      fontWeight: '600',
      marginLeft: 4,
    },
  };

  const content = (
    <View style={styles.container}>
      <Ionicons 
        name={hasOverdueReminders ? 'alert' : 'notifications'} 
        size={isSmall ? 12 : 14} 
        color={badgeColor} 
      />
      <Text style={styles.text}>{getBadgeText()}</Text>
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress}>
      {content}
    </TouchableOpacity>
  ) : content;
};
```

### ✅ **PHASE 4: INTEGRATION & HOOKS** *(Day 3 - 6 hours)*

#### 4.1 Reminder Hook
**File:** `/src/hooks/useReminders.ts` *(NEW FILE)*

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '../types/Reminder';
import { ReminderService } from '../services/ReminderService';

export interface ReminderStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  upcomingToday: number;
}

export const useReminders = (noteId?: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats>({
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0,
    upcomingToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reminderService = ReminderService.getInstance();

  const calculateStats = useCallback((reminderList: Reminder[]): ReminderStats => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    return {
      total: reminderList.length,
      active: reminderList.filter(r => r.isActive && !r.isCompleted).length,
      completed: reminderList.filter(r => r.isCompleted).length,
      overdue: reminderList.filter(r => 
        r.isActive && 
        !r.isCompleted && 
        new Date(r.scheduledDate) < now
      ).length,
      upcomingToday: reminderList.filter(r => 
        r.isActive && 
        !r.isCompleted && 
        new Date(r.scheduledDate) <= todayEnd &&
        new Date(r.scheduledDate) >= now
      ).length,
    };
  }, []);

  const loadReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await reminderService.initialize();
      
      const reminderList = noteId 
        ? await reminderService.getRemindersForNote(noteId)
        : await reminderService.getAllReminders();

      setReminders(reminderList);
      setStats(calculateStats(reminderList));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders');
      console.error('Failed to load reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [noteId, reminderService, calculateStats]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const refresh = useCallback(() => {
    return loadReminders();
  }, [loadReminders]);

  const createReminder = useCallback(async (data: ReminderCreationData) => {
    try {
      const reminder = await reminderService.createReminder(data);
      await refresh();
      return reminder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
      throw err;
    }
  }, [reminderService, refresh]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    try {
      const reminder = await reminderService.updateReminder(id, updates);
      await refresh();
      return reminder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
      throw err;
    }
  }, [reminderService, refresh]);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
      throw err;
    }
  }, [reminderService, refresh]);

  const completeReminder = useCallback(async (id: string) => {
    try {
      await reminderService.completeReminder(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete reminder');
      throw err;
    }
  }, [reminderService, refresh]);

  return {
    reminders,
    stats,
    isLoading,
    error,
    refresh,
    createReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
  };
};
```

#### 4.2 Note Card Integration
**File:** `/src/components/NoteCard.tsx` *(MODIFY EXISTING)*

```typescript
// Add to imports:
import { ReminderBadge } from './ReminderBadge';
import { useReminders } from '../hooks/useReminders';

// Add to component:
const { stats } = useReminders(note.id);

// Add to badge section (after sub-notes badge):
{stats.total > 0 && (
  <ReminderBadge
    count={stats.total}
    hasActiveReminders={stats.active > 0}
    hasOverdueReminders={stats.overdue > 0}
    size="small"
  />
)}
```

#### 4.3 Note Detail Screen Integration
**File:** `/src/screens/NoteDetailScreen.tsx` *(MODIFY EXISTING)*

```typescript
// Add to imports:
import { ReminderManager } from '../components/ReminderManager';

// Add to component JSX (after note content, before tags):
<ReminderManager 
  note={note}
  onRemindersUpdate={() => {
    // Refresh note data to update reminder count
    loadNote();
  }}
  isExpanded={false}
/>
```

#### 4.4 App Level Integration
**File:** `/App.tsx` *(MODIFY EXISTING)*

```typescript
// Add to imports:
import { ReminderService } from './src/services/ReminderService';
import * as Notifications from 'expo-notifications';

// Add to App component useEffect:
useEffect(() => {
  const initializeReminders = async () => {
    try {
      const reminderService = ReminderService.getInstance();
      await reminderService.initialize();
      
      // Handle notification responses
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { reminderId, noteId } = response.notification.request.content.data;
        
        // Navigate to note detail
        // Implementation depends on your navigation setup
        console.log('Notification tapped:', { reminderId, noteId });
      });
      
      return () => subscription.remove();
    } catch (error) {
      console.error('Failed to initialize reminder service:', error);
    }
  };

  initializeReminders();
}, []);
```

---

## 🚀 **DETAILED DEVELOPMENT TIMELINE**

**Total Estimated Time:** 4 days (32 hours)

### **Day 1: Core Infrastructure** *(10 hours)*
- ✅ **Hours 1-2**: Create Reminder types and interfaces
- ✅ **Hours 3-6**: Implement ReminderService core methods
- ✅ **Hours 7-8**: Add notification scheduling with Expo
- ✅ **Hours 9-10**: Implement smart date suggestions

### **Day 2: UI Components** *(10 hours)*
- ✅ **Hours 1-4**: Build ReminderForm component with date/time picker
- ✅ **Hours 5-8**: Create ReminderManager with expandable sections
- ✅ **Hours 9-10**: Build ReminderBadge and status indicators

### **Day 3: Integration & Hooks** *(8 hours)*
- ✅ **Hours 1-3**: Create useReminders hook with stats
- ✅ **Hours 4-5**: Integrate with NoteCard and NoteDetailScreen  
- ✅ **Hours 6-7**: Add app-level notification handling
- ✅ **Hours 8**: Testing and bug fixes

### **Day 4: Advanced Features** *(4 hours)*
- ✅ **Hours 1-2**: Implement recurring reminder logic
- ✅ **Hours 3**: Add smart suggestion "move note date" feature
- ✅ **Hours 4**: Final polish and edge case handling

---

## 📱 **DETAILED UI/UX SPECIFICATIONS**

### **Reminder Display Hierarchy:**
1. **Note Cards**: Small reminder badge "+X reminders" with color coding
2. **Note Detail**: Collapsible ReminderManager section
3. **Reminder Form**: Full-screen modal with smart suggestions
4. **Status Colors**: 
   - 🔴 Red: Overdue reminders
   - 🟠 Orange: Due within 24 hours  
   - 🔵 Blue: Active future reminders
   - ⚫ Gray: Paused/inactive reminders
   - 🟢 Green: Completed reminders

### **Notification Format:**
```
Title: [Reminder Title]
Body: [Custom Message] or "You have a note reminder"
Actions: [Open Note] [Mark Complete] [Snooze]
Sound: System default
Badge: App icon badge with reminder count
```

### **Smart Suggestions Logic:**
1. **Move Note Date**: Suggests moving note's createdAt to reminder date
2. **Common Times**: Tomorrow 9AM, This Weekend, Next Week
3. **Relative Dates**: In 1 hour, Tomorrow, Next week, Next month
4. **Context-Aware**: Based on note content (meetings, deadlines, etc.)

This comprehensive plan now includes all implementation details, UI specifications, and integration points for the complete notification system.
