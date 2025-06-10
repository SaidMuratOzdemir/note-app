import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { NewNoteScreen } from '../screens/NewNoteScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  NewNote: undefined;
  Detail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStack: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Günlük' }} />
      <Stack.Screen name="NewNote" component={NewNoteScreen} options={{ title: 'Yeni Not' }} />
      <Stack.Screen name="Detail" component={NoteDetailScreen} options={{ title: 'Not' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
