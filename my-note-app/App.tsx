import 'react-native-get-random-values'; // Crypto polyfill for UUID
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { RootStack } from './src/navigation/RootStack';
import { ReminderService } from './src/services/reminderService';

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
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
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
            console.log('[App] 🧹 Found potential orphaned temp reminders:', tempReminders.length);
            // We'll implement a more sophisticated check later
          }
        } catch (error) {
          console.warn('[App] Could not check for orphaned reminders:', error);
        }
        
        console.log('[App] Services initialized successfully');
      } catch (error) {
        console.error('[App] Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup function for app unmount (important for testing/memory management)
    return () => {
      try {
        const reminderService = ReminderService.getInstance();
        reminderService.cleanup();
        console.log('[App] Cleanup completed successfully');
      } catch (error) {
        console.error('[App] Cleanup failed:', error);
      }
    };
  }, []);

  return <RootStack />;
}
