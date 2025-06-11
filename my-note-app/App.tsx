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
        
        console.log('[App] Services initialized successfully');
      } catch (error) {
        console.error('[App] Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  return <RootStack />;
}
