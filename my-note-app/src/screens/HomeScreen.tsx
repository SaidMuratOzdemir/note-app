import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { FAB } from '../components/FAB';
import { EmptyState } from '../components/EmptyState';
import { Colors, Typography, Layout } from '../theme';
import { RootStackParamList } from '../navigation/RootStack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const loadNotes = async () => {
    const all = await getNotes();
    const today = new Date().toISOString().split('T')[0];
    const todaysNotes = all
      .filter(n => n.createdAt.startsWith(today))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotes(todaysNotes);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    setupHeaderButtons();
    const load = navigation.addListener('focus', async () => {
      await loadNotes();
    });
    return load;
  }, [navigation]);

  const setupHeaderButtons = () => {
    navigation.setOptions({
      title: 'Günlük',
      headerTitleStyle: Typography.h1,
      headerStyle: {
        backgroundColor: Colors.neutral.white,
      },
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Calendar')} 
            style={styles.headerButton}
          >
            <Ionicons name="calendar-outline" size={24} color={Colors.neutral.darkGray} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search')} 
            style={styles.headerButton}
          >
            <Ionicons name="search-outline" size={24} color={Colors.neutral.darkGray} />
          </TouchableOpacity>
        </View>
      ),
    });
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Date Section */}
      <View style={styles.dateSection}>
        <Text style={styles.dateText}>{formatDate()}</Text>
        {notes.length > 0 && (
          <Text style={styles.noteCount}>{notes.length} not</Text>
        )}
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          notes.length === 0 && styles.scrollContentEmpty
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              index={index}
              onPress={() => navigation.navigate('Detail', { id: note.id })}
            />
          ))
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="Henüz bugün bir not yazmadınız"
            subtitle="Bugünün anılarını kaydetmek için + butonuna dokunun"
          />
        )}
      </ScrollView>
      
      <FAB onPress={() => navigation.navigate('NewNote')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.screenPadding,
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
    minWidth: Layout.minTouchSize,
    minHeight: Layout.minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  dateText: {
    ...Typography.date,
  },
  noteCount: {
    ...Typography.caption,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.screenPadding,
  },
  scrollContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
});
