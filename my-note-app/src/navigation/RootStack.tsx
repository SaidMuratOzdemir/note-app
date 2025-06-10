import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { NewNoteScreen } from '../screens/NewNoteScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import { EditNoteScreen } from '../screens/EditNoteScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { DateNotesScreen } from '../screens/DateNotesScreen';

export type RootStackParamList = {
  Home: undefined;
  NewNote: { selectedDate?: string } | undefined;
  Detail: { id: string };
  EditNote: { id: string };
  Search: undefined;
  Calendar: undefined;
  DateNotes: { date: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStack: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Günlük' }} />
      <Stack.Screen name="NewNote" component={NewNoteScreen} options={{ title: 'Yeni Not' }} />
      <Stack.Screen name="Detail" component={NoteDetailScreen} options={{ title: 'Not' }} />
      <Stack.Screen name="EditNote" component={EditNoteScreen} options={{ title: 'Notu Düzenle' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Arama' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Takvim' }} />
      <Stack.Screen name="DateNotes" component={DateNotesScreen} options={{ title: 'Notlar' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
