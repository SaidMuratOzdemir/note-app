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
import TagsScreen from '../screens/TagsScreen';
import FilteredNotesScreen from '../screens/FilteredNotesScreen';
import AllTagsScreen from '../screens/AllTagsScreen';

export type RootStackParamList = {
  Home: undefined;
  NewNote: { selectedDate?: string; parentNoteId?: string } | undefined;
  NoteDetail: { note: any; focusSubNotes?: boolean };
  Detail: { id: string }; // Legacy support for existing code
  EditNote: { id: string };
  Search: undefined;
  Calendar: undefined;
  DateNotes: { date: string };
  Tags: undefined;
  FilteredNotes: { tagName: string; title: string };
  AllTags: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStack: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Günlük' }} />
      <Stack.Screen name="NewNote" component={NewNoteScreen} options={{ title: 'Yeni Not' }} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ title: 'Not' }} />
      <Stack.Screen name="Detail" component={NoteDetailScreen} options={{ title: 'Not' }} />
      <Stack.Screen name="EditNote" component={EditNoteScreen} options={{ title: 'Notu Düzenle' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Arama' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Takvim' }} />
      <Stack.Screen name="DateNotes" component={DateNotesScreen} options={{ title: 'Notlar' }} />
      <Stack.Screen name="Tags" component={TagsScreen} options={{ title: 'Etiketler' }} />
      <Stack.Screen name="FilteredNotes" component={FilteredNotesScreen} options={{ title: 'Filtrelenmiş Notlar' }} />
      <Stack.Screen name="AllTags" component={AllTagsScreen} options={{ title: 'Tüm Etiketler' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
