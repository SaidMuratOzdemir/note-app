import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagService } from '../services/tagService';
import { Note } from '../types/Note';
import { Colors, Typography, Layout } from '../theme';
import { NoteCard } from '../components/NoteCard';
import { SubNoteCard } from '../components/SubNoteCard';
import { SubNoteBadge } from '../components/SubNoteBadge';
import { EmptyState } from '../components/EmptyState';
import { SubNoteUtils } from '../utils/subNoteUtils';

type SortOption = 'date' | 'title' | 'relevance';
type FilterOption = 'all' | 'parent' | 'sub';

const FilteredNotesScreen = ({ navigation, route }: any) => {
  const { tagName, title } = route.params;
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]); // For sub-note badges
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  const tagService = TagService.getInstance();

  useEffect(() => {
    loadNotes();
  }, [tagName, sortBy, filterBy]);

  useEffect(() => {
    // Set header title
    navigation.setOptions({
      title: title,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="options" size={24} color={Colors.accent.darkBlue} />
        </TouchableOpacity>
      ),
    });
  }, [title, showFilters]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // Get all notes for sub-note badge calculation
      const allNotesData = await tagService.getNotesWithTag(tagName, {
        tagName,
        includeSubNotes: true,
        sortBy,
        sortOrder: 'desc',
      });
      
      setAllNotes(allNotesData);
      
      // Apply filter
      let filteredNotes = allNotesData;
      
      switch (filterBy) {
        case 'parent':
          filteredNotes = allNotesData.filter(note => !note.parentId);
          break;
        case 'sub':
          filteredNotes = allNotesData.filter(note => !!note.parentId);
          break;
        case 'all':
        default:
          // Show all notes
          break;
      }
      
      setNotes(filteredNotes);
    } catch (error) {
      console.error('Error loading filtered notes:', error);
      Alert.alert('Hata', 'Notlar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotes();
    } catch (error) {
      console.error('Error refreshing notes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteDetail', { note });
  };

  const handleSubNotesBadgePress = (parentNote: Note) => {
    navigation.navigate('NoteDetail', { 
      note: parentNote, 
      focusSubNotes: true 
    });
  };

  const getSubNoteCount = (parentId: string): number => {
    return SubNoteUtils.getSubNoteCountFromArray(parentId, allNotes);
  };

  const getParentNote = (parentId: string): Note | undefined => {
    return allNotes.find(note => note.id === parentId);
  };

  const renderFilterOptions = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        {/* Sort Options */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sıralama</Text>
          <View style={styles.filterOptions}>
            {[
              { key: 'date', label: 'Tarihe Göre' },
              { key: 'title', label: 'Başlığa Göre' },
              { key: 'relevance', label: 'İlgiliye Göre' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  sortBy === option.key && styles.filterOptionActive,
                ]}
                onPress={() => setSortBy(option.key as SortOption)}
              >
                <Text style={[
                  styles.filterOptionText,
                  sortBy === option.key && styles.filterOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filter Options */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Filtre</Text>
          <View style={styles.filterOptions}>
            {[
              { key: 'all', label: 'Tüm Notlar' },
              { key: 'parent', label: 'Sadece Ana Notlar' },
              { key: 'sub', label: 'Sadece Alt Notlar' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  filterBy === option.key && styles.filterOptionActive,
                ]}
                onPress={() => setFilterBy(option.key as FilterOption)}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterBy === option.key && styles.filterOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderNote = (note: Note) => {
    const isSubNote = SubNoteUtils.isSubNote(note);
    
    if (isSubNote) {
      const parentNote = getParentNote(note.parentId!);
      if (!parentNote) return null;
      
      return (
        <SubNoteCard
          key={note.id}
          note={note}
          parentNote={parentNote}
          onPress={() => handleNotePress(note)}
        />
      );
    } else {
      const subNoteCount = getSubNoteCount(note.id);
      
      return (
        <View key={note.id}>
          <NoteCard
            note={note}
            index={0}
            onPress={() => handleNotePress(note)}
          />
          {subNoteCount > 0 && (
            <SubNoteBadge
              count={subNoteCount}
              onPress={() => handleSubNotesBadgePress(note)}
              style={styles.subNoteBadge}
            />
          )}
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.darkBlue} />
        <Text style={styles.loadingText}>Notlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterOptions()}
      
      {notes.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Bu Etikette Not Bulunamadı"
          subtitle={`"${tagName}" etiketine sahip not bulunmuyor`}
        />
      ) : (
        <>
          {/* Results Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {notes.length} not bulundu
            </Text>
            {filterBy !== 'all' && (
              <Text style={styles.summaryFilter}>
                • {filterBy === 'parent' ? 'Ana notlar' : 'Alt notlar'} gösteriliyor
              </Text>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.accent.darkBlue]}
                tintColor={Colors.accent.darkBlue}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {notes.map(renderNote)}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textGray,
    marginTop: 12,
  },
  filtersContainer: {
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    ...Typography.h2,
    color: Colors.neutral.darkGray,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.neutral.lightGray1,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
  },
  filterOptionActive: {
    backgroundColor: Colors.accent.darkBlue,
    borderColor: Colors.accent.darkBlue,
  },
  filterOptionText: {
    ...Typography.caption,
    color: Colors.textGray,
    fontWeight: '500' as const,
  },
  filterOptionTextActive: {
    color: Colors.neutral.white,
    fontWeight: '600' as const,
  },
  summaryContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.accent.coral + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
  },
  summaryFilter: {
    ...Typography.caption,
    color: Colors.textGray,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.screenPadding,
    gap: 12,
  },
  subNoteBadge: {
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 24,
  },
};

export default FilteredNotesScreen;
