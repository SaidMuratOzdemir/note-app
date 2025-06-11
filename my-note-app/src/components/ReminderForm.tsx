/**
 * Advanced Reminder Form Component
 * 
 * A comprehensive, user-friendly form for creating and editing reminders with:
 * - Smart date suggestions with contextual intelligence
 * - Rich frequency selection with visual indicators
 * - Custom message input with validation
 * - Intuitive date/time picker integration
 * - Note date movement confirmation
 * 
 * Features:
 * - Modal presentation with gesture-friendly design
 * - Real-time validation and error handling
 * - Accessibility support with proper labels
 * - Performance optimized with minimal re-renders
 * - Beautiful animations and transitions
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @created 2025-06-11
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  ReminderFrequency,
  ReminderCreationData,
  SmartDateSuggestion,
  Reminder,
} from '../types/Reminder';
import { Note } from '../types/Note';
import { ReminderService } from '../services/reminderService';
import { Colors, Typography, Layout } from '../theme';

interface ReminderFormProps {
  /** The note to create a reminder for */
  note: Note;
  
  /** Callback when reminder is successfully saved */
  onSave: (reminder: Reminder) => void;
  
  /** Callback when form is cancelled */
  onCancel: () => void;
  
  /** Optional existing reminder for editing */
  editingReminder?: Reminder;
  
  /** Whether the form is visible */
  visible: boolean;
}

/**
 * Advanced reminder form with smart suggestions and validation
 */
export const ReminderForm: React.FC<ReminderFormProps> = ({
  note,
  onSave,
  onCancel,
  editingReminder,
  visible,
}) => {
  // Form state
  const [title, setTitle] = useState(editingReminder?.title || note.title || 'Note Reminder');
  const [message, setMessage] = useState(editingReminder?.message || '');
  const [selectedDate, setSelectedDate] = useState(
    editingReminder ? new Date(editingReminder.scheduledDate) : new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
  );
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    editingReminder?.frequency || 'once'
  );
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(!editingReminder);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));

  // Services
  const reminderService = ReminderService.getInstance();

  // Smart suggestions (memoized for performance)
  const smartSuggestions = useMemo(() => {
    if (!showSmartSuggestions) return [];
    return reminderService.generateSmartDateSuggestions(note);
  }, [note, showSmartSuggestions, reminderService]);

  // Frequency options with rich metadata
  const frequencyOptions = useMemo(() => [
    {
      value: 'once' as const,
      label: 'Once',
      description: 'Single reminder',
      icon: 'radio-button-on-outline',
      color: Colors.accent.coral,
    },
    {
      value: 'daily' as const,
      label: 'Daily',
      description: 'Every day at this time',
      icon: 'refresh-outline',
      color: Colors.primary,
    },
    {
      value: 'weekly' as const,
      label: 'Weekly',
      description: 'Every week on this day',
      icon: 'calendar-outline',
      color: Colors.accent.darkBlue,
    },
    {
      value: 'monthly' as const,
      label: 'Monthly',
      description: 'Every month on this date',
      icon: 'calendar-number-outline',
      color: Colors.warning,
    },
    {
      value: 'yearly' as const,
      label: 'Yearly',
      description: 'Every year on this date',
      icon: 'time-outline',
      color: Colors.success,
    },
  ], []);

  // Animation effect
  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  /**
   * Validate form inputs
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Reminder title is required';
    }

    if (selectedDate <= new Date()) {
      newErrors.date = 'Reminder must be scheduled for a future date';
    }

    if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (message.length > 500) {
      newErrors.message = 'Message must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, message, selectedDate]);

  /**
   * Handle form submission
   */
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const reminderData: ReminderCreationData = {
        noteId: note.id,
        title: title.trim(),
        message: message.trim() || undefined,
        scheduledDate: selectedDate.toISOString(),
        frequency,
      };

      let savedReminder: Reminder;
      
      if (editingReminder) {
        savedReminder = await reminderService.updateReminder(editingReminder.id, reminderData);
      } else {
        savedReminder = await reminderService.createReminder(reminderData);
      }

      onSave(savedReminder);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save reminder';
      Alert.alert('Error', errorMessage);
      console.error('Save reminder error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, note.id, title, message, selectedDate, frequency, editingReminder, reminderService, onSave]);

  /**
   * Handle smart suggestion selection
   */
  const handleSmartSuggestion = useCallback((suggestion: SmartDateSuggestion) => {
    setSelectedDate(new Date(suggestion.suggestedDate));
    setShowSmartSuggestions(false);

    if (suggestion.type === 'move_note_date' && suggestion.requiresConfirmation) {
      Alert.alert(
        'Move Note Date',
        'Do you want to move this note\'s creation date to match the reminder date?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => reminderService.moveNoteToReminderDate(note.id, suggestion.suggestedDate),
          },
        ]
      );
    }
  }, [note.id, reminderService]);

  /**
   * Handle date picker changes
   */
  const handleDateChange = useCallback((event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(newDate);
      setErrors(prev => ({ ...prev, date: '' }));
    }
  }, [selectedDate]);

  /**
   * Handle time picker changes
   */
  const handleTimeChange = useCallback((event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours(), time.getMinutes());
      setSelectedDate(newDate);
      setErrors(prev => ({ ...prev, date: '' }));
    }
  }, [selectedDate]);

  /**
   * Format date and time for display
   */
  const formatDateTime = useCallback((date: Date) => {
    const dateStr = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} at ${timeStr}`;
  }, []);

  /**
   * Render smart suggestions section
   */
  const renderSmartSuggestions = () => {
    if (!showSmartSuggestions || smartSuggestions.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={20} color={Colors.accent.darkBlue} />
          <Text style={styles.sectionTitle}>Quick Options</Text>
          <TouchableOpacity onPress={() => setShowSmartSuggestions(false)}>
            <Ionicons name="close-outline" size={20} color={Colors.textGray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.suggestionsContainer}>
          {smartSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionCard}
              onPress={() => handleSmartSuggestion(suggestion)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionIcon}>
                <Ionicons 
                  name={suggestion.icon as any || 'time-outline'} 
                  size={18} 
                  color={Colors.accent.darkBlue} 
                />
              </View>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionLabel}>{suggestion.label}</Text>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textGray} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render frequency selection
   */
  const renderFrequencySelection = () => (
    <View style={styles.section}>
      <Text style={styles.label}>Repeat Frequency</Text>
      <View style={styles.frequencyContainer}>
        {frequencyOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.frequencyOption,
              frequency === option.value && styles.frequencyOptionSelected,
            ]}
            onPress={() => setFrequency(option.value)}
            activeOpacity={0.7}
          >
            <View style={[styles.frequencyIcon, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon as any} size={20} color={option.color} />
            </View>
            <View style={styles.frequencyContent}>
              <Text style={[
                styles.frequencyLabel,
                frequency === option.value && styles.frequencyLabelSelected,
              ]}>
                {option.label}
              </Text>
              <Text style={styles.frequencyDescription}>{option.description}</Text>
            </View>
            {frequency === option.value && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent.darkBlue} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </Text>
              <Text style={styles.headerSubtitle}>for "{note.title || 'Untitled'}"</Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerButton, styles.saveButton]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.accent.darkBlue} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Smart Suggestions */}
            {renderSmartSuggestions()}

            {/* Title Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Reminder Title</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="Enter reminder title"
                placeholderTextColor={Colors.textGray}
                maxLength={100}
                autoCapitalize="sentences"
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Date and Time Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Date & Time</Text>
              
              <TouchableOpacity 
                style={[styles.dateTimeButton, errors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.accent.darkBlue} />
                <Text style={styles.dateTimeText}>{formatDateTime(selectedDate)}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textGray} />
              </TouchableOpacity>
              
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              
              <View style={styles.dateTimeActions}>
                <TouchableOpacity 
                  style={styles.dateTimeActionButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={Colors.accent.darkBlue} />
                  <Text style={styles.dateTimeActionText}>Change Date</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dateTimeActionButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.accent.darkBlue} />
                  <Text style={styles.dateTimeActionText}>Change Time</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Frequency Selection */}
            {renderFrequencySelection()}

            {/* Custom Message */}
            <View style={styles.section}>
              <Text style={styles.label}>Custom Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.messageInput, errors.message && styles.inputError]}
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (errors.message) setErrors(prev => ({ ...prev, message: '' }));
                }}
                placeholder="Enter custom notification message"
                placeholderTextColor={Colors.textGray}
                multiline
                numberOfLines={3}
                maxLength={500}
                autoCapitalize="sentences"
              />
              {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
              <Text style={styles.characterCount}>{message.length}/500</Text>
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray,
    backgroundColor: Colors.neutral.white,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center' as const,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.neutral.darkGray,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textGray,
    marginTop: 2,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textGray,
  },
  saveButton: {
    backgroundColor: Colors.accent.darkBlue + '10',
    borderRadius: 8,
  },
  saveText: {
    ...Typography.body,
    color: Colors.accent.darkBlue,
    fontWeight: '600' as const,
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.neutral.darkGray,
    marginLeft: 8,
    flex: 1,
  },
  label: {
    ...Typography.bodyLarge,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.neutral.darkGray,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 8,
  },
  characterCount: {
    ...Typography.caption,
    color: Colors.textGray,
    textAlign: 'right' as const,
    marginTop: 8,
  },
  dateTimeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
  },
  dateTimeText: {
    ...Typography.body,
    color: Colors.neutral.darkGray,
    flex: 1,
    marginLeft: 12,
  },
  dateTimeActions: {
    flexDirection: 'row' as const,
    marginTop: 12,
    gap: 12,
  },
  dateTimeActionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.accent.darkBlue + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateTimeActionText: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    marginLeft: 6,
    fontWeight: '600' as const,
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent.darkBlue + '10',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionLabel: {
    ...Typography.bodyLarge,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
  },
  suggestionDescription: {
    ...Typography.caption,
    color: Colors.textGray,
    marginTop: 2,
  },
  frequencyContainer: {
    gap: 8,
  },
  frequencyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.neutral.lightGray,
  },
  frequencyOptionSelected: {
    borderColor: Colors.accent.darkBlue,
    backgroundColor: Colors.accent.darkBlue + '05',
  },
  frequencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyLabel: {
    ...Typography.bodyLarge,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
  },
  frequencyLabelSelected: {
    color: Colors.accent.darkBlue,
  },
  frequencyDescription: {
    ...Typography.caption,
    color: Colors.textGray,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
};
