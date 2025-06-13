import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { Reminder } from '../types/Reminder';
import { getNotes } from '../services/storage';
import { NoteCard } from '../components/NoteCard';
import { FAB } from '../components/FAB';
import { EmptyState } from '../components/EmptyState';
import { ReminderService } from '../services/reminderService';
import { Colors, Typography, Layout } from '../theme';
import { getTodayLocal, formatDateToLocal, formatTodayLong } from '../utils/dateUtils';
import { SubNoteUtils } from '../utils/subNoteUtils';
import { logger } from '../utils/logger';
import { RootStackParamList } from '../navigation/RootStack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRemindersCount, setActiveRemindersCount] = useState(0);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const reminderService = ReminderService.getInstance();

  const loadNotes = async () => {
    try {
      const all = await getNotes();
      const todayString = getTodayLocal();
      
      // Filter to only show parent notes (no sub-notes) for today
      const todaysParentNotes = all
        .filter(n => {
          const noteDate = new Date(n.createdAt);
          const noteDateLocal = formatDateToLocal(noteDate);
          const isToday = noteDateLocal === todayString;
          const isParent = !n.parentId;
          return isToday && isParent;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotes(todaysParentNotes);
      setAllNotes(all); // Keep all notes for sub-note counting
    } catch (error) {
      logger.error('[HomeScreen] Error loading notes:', error);
    }
  };

  const getSubNoteCount = (parentId: string): number => {
    return SubNoteUtils.getSubNoteCountFromArray(parentId, allNotes);
  };

  const handleSubNotesBadgePress = (parentNote: Note) => {
    navigation.navigate('Detail', { id: parentNote.id });
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
            onPress={() => navigation.navigate('Tags')} 
            style={styles.headerButton}
          >
            <Ionicons name="pricetags-outline" size={22} color={Colors.accent.darkBlue} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Calendar')} 
            style={styles.headerButton}
          >
            <Ionicons name="calendar-outline" size={22} color={Colors.accent.darkBlue} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search')} 
            style={styles.headerButton}
          >
            <Ionicons name="search-outline" size={22} color={Colors.accent.darkBlue} />
          </TouchableOpacity>
        </View>
      ),
    });
  };

  const handleDatePress = () => {
    navigation.navigate('Calendar');
  };

  return (
    <View style={styles.container}>
      {/* Date Section */}
      <TouchableOpacity style={styles.dateSection} onPress={handleDatePress}>
        <Text style={styles.dateText}>{formatTodayLong()}</Text>
        {notes.length > 0 && (
          <Text style={styles.noteCount}>{notes.length} not</Text>
        )}
      </TouchableOpacity>
      
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
              subNoteCount={getSubNoteCount(note.id)}
              onSubNotesPress={() => handleSubNotesBadgePress(note)}
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
    flex: 1,
  },
  noteCount: {
    ...Typography.caption,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 18,
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
