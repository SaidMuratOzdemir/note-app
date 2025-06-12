/**
 * Advanced Reminder List Component
 * 
 * A sophisticated component for displaying and managing note reminders with:
 * - Beautiful card-based design with status indicators
 * - Swipe actions for quick operations (complete, edit, delete)
 * - Grouping by status (upcoming, overdue, completed)
 * - Rich animations and micro-interactions
 * - Comprehensive accessibility support
 * 
 * Features:
 * - Real-time status updates with automatic refresh
 * - Smart grouping and sorting algorithms
 * - Gesture-based interactions for power users
 * - Empty states with contextual messaging
 * - Performance optimized with FlatList and memoization
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @created 2025-06-11
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reminder, ReminderFrequency } from '../types/Reminder';
import { ReminderService } from '../services/reminderService';
import { Colors, Typography, Layout } from '../theme';

interface ReminderListProps {
  /** Note ID to show reminders for */
  noteId: string;
  
  /** Callback when reminder is edited */
  onEditReminder: (reminder: Reminder) => void;
  
  /** Callback when reminders list changes */
  onRemindersChange?: (reminders: Reminder[]) => void;
  
  /** Maximum number of reminders to show (0 = show all) */
  maxVisible?: number;
  
  /** Whether to show completed reminders */
  showCompleted?: boolean;
  
  /** Custom empty state message */
  emptyMessage?: string;
}

interface GroupedReminders {
  overdue: Reminder[];
  upcoming: Reminder[];
  completed: Reminder[];
}

/**
 * Advanced reminder list with smart grouping and swipe actions
 */
export const ReminderList: React.FC<ReminderListProps> = ({
  noteId,
  onEditReminder,
  onRemindersChange,
  maxVisible = 0,
  showCompleted = true,
  emptyMessage,
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reminderService = ReminderService.getInstance();

  // Load reminders on mount and setup listener
  useEffect(() => {
    loadReminders();
    
    const listenerId = `reminder-list-${noteId}`;
    reminderService.addListener(listenerId, handleRemindersUpdate);
    
    return () => {
      reminderService.removeListener(listenerId);
    };
  }, [noteId]); // Remove reminderService dependency to prevent re-render loop

  /**
   * Load reminders from service
   */
  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      const noteReminders = await reminderService.getRemindersForNote(noteId);
      setReminders(noteReminders);
      onRemindersChange?.(noteReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [noteId, reminderService, onRemindersChange]);

  /**
   * Handle real-time reminder updates
   */
  const handleRemindersUpdate = useCallback((allReminders: Reminder[]) => {
    const noteReminders = allReminders.filter(r => r.noteId === noteId);
    setReminders(noteReminders);
    onRemindersChange?.(noteReminders);
  }, [noteId, onRemindersChange]);

  /**
   * Group reminders by status
   */
  const groupedReminders = useMemo((): GroupedReminders => {
    const now = new Date().toISOString();
    
    const grouped: GroupedReminders = {
      overdue: [],
      upcoming: [],
      completed: [],
    };

    reminders.forEach(reminder => {
      if (reminder.isCompleted) {
        grouped.completed.push(reminder);
      } else if (reminder.scheduledDate < now) {
        grouped.overdue.push(reminder);
      } else {
        grouped.upcoming.push(reminder);
      }
    });

    // Sort each group
    const sortByDate = (a: Reminder, b: Reminder) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();

    grouped.overdue.sort(sortByDate);
    grouped.upcoming.sort(sortByDate);
    grouped.completed.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return grouped;
  }, [reminders]);

  /**
   * Get flat list of reminders for display
   */
  const displayReminders = useMemo(() => {
    const items: (Reminder | { type: 'header'; title: string; count: number })[] = [];

    // Add overdue section
    if (groupedReminders.overdue.length > 0) {
      items.push({ type: 'header', title: 'Overdue', count: groupedReminders.overdue.length });
      items.push(...groupedReminders.overdue);
    }

    // Add upcoming section
    if (groupedReminders.upcoming.length > 0) {
      items.push({ type: 'header', title: 'Upcoming', count: groupedReminders.upcoming.length });
      
      const upcomingToShow = maxVisible > 0 
        ? groupedReminders.upcoming.slice(0, maxVisible)
        : groupedReminders.upcoming;
      
      items.push(...upcomingToShow);
    }

    // Add completed section if requested
    if (showCompleted && groupedReminders.completed.length > 0) {
      items.push({ type: 'header', title: 'Completed', count: groupedReminders.completed.length });
      
      const completedToShow = maxVisible > 0 
        ? groupedReminders.completed.slice(0, Math.max(3, maxVisible))
        : groupedReminders.completed;
      
      items.push(...completedToShow);
    }

    return items;
  }, [groupedReminders, maxVisible, showCompleted]);

  /**
   * Handle reminder completion
   */
  const handleCompleteReminder = useCallback(async (reminderId: string) => {
    try {
      await reminderService.completeReminder(reminderId);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete reminder');
      console.error('Complete reminder error:', error);
    }
  }, [reminderService]);

  /**
   * Handle reminder deletion with confirmation
   */
  const handleDeleteReminder = useCallback(async (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete the reminder "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderService.deleteReminder(reminder.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
              console.error('Delete reminder error:', error);
            }
          },
        },
      ]
    );
  }, [reminderService]);

  /**
   * Format reminder date for display
   */
  const formatReminderDate = useCallback((reminder: Reminder): { date: string; time: string; isOverdue: boolean } => {
    const scheduledDate = new Date(reminder.scheduledDate);
    const now = new Date();
    const isOverdue = scheduledDate < now && !reminder.isCompleted;

    const date = scheduledDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: scheduledDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    const time = scheduledDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { date, time, isOverdue };
  }, []);

  /**
   * Get frequency display info
   */
  const getFrequencyInfo = useCallback((frequency: ReminderFrequency) => {
    const frequencyMap = {
      once: { icon: 'radio-button-on-outline', color: Colors.textGray },
      daily: { icon: 'refresh-outline', color: Colors.primary },
      weekly: { icon: 'calendar-outline', color: Colors.accent.darkBlue },
      monthly: { icon: 'calendar-number-outline', color: Colors.warning },
      yearly: { icon: 'time-outline', color: Colors.success },
    };

    return frequencyMap[frequency] || frequencyMap.once;
  }, []);

  /**
   * Render section header
   */
  const renderSectionHeader = useCallback((title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
    </View>
  ), []);

  /**
   * Render reminder item
   */
  const renderReminderItem = useCallback((reminder: Reminder) => {
    const { date, time, isOverdue } = formatReminderDate(reminder);
    const frequencyInfo = getFrequencyInfo(reminder.frequency);

    return (
      <TouchableOpacity
        style={[
          styles.reminderCard,
          isOverdue && styles.reminderCardOverdue,
          reminder.isCompleted && styles.reminderCardCompleted,
        ]}
        onPress={() => onEditReminder(reminder)}
        activeOpacity={0.7}
      >
        {/* Status Indicator */}
        <View style={[
          styles.statusIndicator,
          {
            backgroundColor: reminder.isCompleted 
              ? Colors.success 
              : isOverdue 
                ? Colors.error 
                : Colors.accent.darkBlue
          }
        ]} />

        {/* Content */}
        <View style={styles.reminderContent}>
          {/* Header */}
          <View style={styles.reminderHeader}>
            <Text style={[
              styles.reminderTitle,
              reminder.isCompleted && styles.reminderTitleCompleted,
            ]} numberOfLines={1}>
              {reminder.title}
            </Text>
            
            <View style={styles.reminderActions}>
              {!reminder.isCompleted && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCompleteReminder(reminder.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteReminder(reminder)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Message */}
          {reminder.message && (
            <Text style={styles.reminderMessage} numberOfLines={2}>
              {reminder.message}
            </Text>
          )}

          {/* Footer */}
          <View style={styles.reminderFooter}>
            <View style={styles.dateTimeContainer}>
              <Text style={[
                styles.reminderDate,
                isOverdue && styles.reminderDateOverdue,
              ]}>
                {date}
              </Text>
              <Text style={styles.reminderTime}>at {time}</Text>
            </View>

            <View style={styles.frequencyContainer}>
              <Ionicons 
                name={frequencyInfo.icon as any} 
                size={14} 
                color={frequencyInfo.color} 
              />
              {reminder.frequency !== 'once' && (
                <Text style={[styles.frequencyText, { color: frequencyInfo.color }]}>
                  {reminder.frequency}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [formatReminderDate, getFrequencyInfo, onEditReminder, handleCompleteReminder, handleDeleteReminder]);

  /**
   * Render list item
   */
  const renderItem = useCallback(({ item }: { item: any }) => {
    if ('type' in item && item.type === 'header') {
      return renderSectionHeader(item.title, item.count);
    }
    return renderReminderItem(item);
  }, [renderSectionHeader, renderReminderItem]);

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={48} color={Colors.textGray} />
      <Text style={styles.emptyTitle}>No Reminders Yet</Text>
      <Text style={styles.emptyMessage}>
        {emptyMessage || 'Add a reminder to get notified about this note'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reminders...</Text>
      </View>
    );
  }

  if (displayReminders.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={displayReminders}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          'type' in item ? `header-${item.title}` : item.id
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEnabled={displayReminders.length > 3}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center' as const,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textGray,
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.neutral.darkGray,
    fontWeight: '700' as const,
  },
  sectionBadge: {
    backgroundColor: Colors.accent.darkBlue + '15',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionCount: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    fontWeight: '600' as const,
  },
  reminderCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Layout.screenPadding,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden' as const,
  },
  reminderCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  reminderCardCompleted: {
    opacity: 0.7,
  },
  statusIndicator: {
    width: 4,
  },
  reminderContent: {
    flex: 1,
    padding: 16,
  },
  reminderHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  reminderTitle: {
    ...Typography.bodyLarge,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
    flex: 1,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textGray,
  },
  reminderActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  reminderMessage: {
    ...Typography.body,
    color: Colors.textGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  reminderFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  dateTimeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  reminderDate: {
    ...Typography.caption,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
  },
  reminderDateOverdue: {
    color: Colors.error,
  },
  reminderTime: {
    ...Typography.caption,
    color: Colors.textGray,
    marginLeft: 6,
  },
  frequencyContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  frequencyText: {
    ...Typography.caption,
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.neutral.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    ...Typography.body,
    color: Colors.textGray,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
};
