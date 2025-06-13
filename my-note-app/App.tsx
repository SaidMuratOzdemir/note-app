import 'react-native-get-random-values'; // Crypto polyfill for UUID
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { RootStack } from './src/navigation/RootStack';
import { ReminderService } from './src/services/reminderService';
import { cleanupInvalidNotes } from './src/services/storage';
import { logger } from './src/utils/logger';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Initialize reminder service
    const initializeServices = async () => {
      try {
        // 🧹 Storage cleanup - remove invalid notes that cause repeated warnings
        logger.dev('[App] 🧹 Starting storage cleanup...');
        const cleanupResult = await cleanupInvalidNotes();
        if (cleanupResult.cleaned > 0) {
          logger.log(`[App] ✅ Storage cleaned: removed ${cleanupResult.cleaned} invalid notes, ${cleanupResult.remaining} valid notes remaining`);
        }
        
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          logger.warn('Notification permissions not granted');
        }
        
        // Initialize reminder service
        const reminderService = ReminderService.getInstance();
        await reminderService.initialize();
        
        // Cleanup any orphaned temp reminders from previous app sessions
        // (reminders with temp IDs that were never converted to real notes)
        try {
          const allReminders = await reminderService.getReminders();
          const tempReminders = allReminders.filter(r => 
            r.noteId.startsWith('reminder_') || // Old temp format
            r.noteId.includes('temp_') ||       // Explicit temp format
            r.noteId.length === 36              // UUID format (could be temp)
          );
          
          if (tempReminders.length > 0) {
            logger.log('[App] 🧹 Found potential orphaned temp reminders:', tempReminders.length);
            // We'll implement a more sophisticated check later
          }
        } catch (error) {
          logger.warn('[App] Could not check for orphaned reminders:', error);
        }
        
        logger.log('[App] Services initialized successfully');
      } catch (error) {
        logger.error('[App] Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup function for app unmount (important for testing/memory management)
    return () => {
      try {
        const reminderService = ReminderService.getInstance();
        reminderService.cleanup();
        logger.log('[App] Cleanup completed successfully');
      } catch (error) {
        logger.error('[App] Cleanup failed:', error);
      }
    };
  }, []);

  return <RootStack />;
}
