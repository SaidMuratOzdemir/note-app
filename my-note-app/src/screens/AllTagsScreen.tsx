import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TagService } from '../services/tagService';
import { getNotes } from '../services/storage';
import { Note } from '../types/Note';
import { Colors, Typography, Layout } from '../theme';
import { EmptyState } from '../components/EmptyState';

interface AllTagsScreenProps {
  navigation: NavigationProp<any>;
}

interface TagData {
  name: string;
  count: number;
  lastUsed: string;
}

const AllTagsScreen: React.FC<AllTagsScreenProps> = ({ navigation }) => {
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tagService = TagService.getInstance();

  // Load tags when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAllTags();
    }, [])
  );

  useEffect(() => {
    // Filter tags based on search query
    if (searchQuery.trim() === '') {
      setFilteredTags(allTags);
    } else {
      const filtered = allTags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTags(filtered);
    }
  }, [searchQuery, allTags]);

  const loadAllTags = async () => {
    try {
      setLoading(true);
      
      // Get all notes and calculate tag statistics
      const allNotes = await getNotes();
      const tagStats = calculateAllTagStats(allNotes);
      
      setAllTags(tagStats);
    } catch (error) {
      console.error('Error loading all tags:', error);
      Alert.alert('Hata', 'Etiketler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllTagStats = (notes: Note[]): TagData[] => {
    const tagCounts = new Map<string, number>();
    const tagLastUsed = new Map<string, string>();

    // Count all tag occurrences
    notes.forEach(note => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          
          // Update count
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          
          // Update last used date
          const currentLastUsed = tagLastUsed.get(normalizedTag);
          const noteDate = note.createdAt;
          
          if (!currentLastUsed || new Date(noteDate) > new Date(currentLastUsed)) {
            tagLastUsed.set(normalizedTag, noteDate);
          }
        });
      }
    });

    // Convert to array and sort
    return Array.from(tagCounts.entries())
      .map(([name, count]): TagData => ({
        name,
        count,
        lastUsed: tagLastUsed.get(name) || new Date().toISOString(),
      }))
      .sort((a, b) => {
        // Sort by count (descending), then alphabetically
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await tagService.updateCache();
      await loadAllTags();
    } catch (error) {
      console.error('Error refreshing tags:', error);
      Alert.alert('Hata', 'Etiketler güncellenirken hata oluştu.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTagPress = (tag: TagData) => {
    navigation.navigate('FilteredNotes', {
      tagName: tag.name,
      title: `#${tag.name}`,
    });
  };

  const formatTagDisplay = (tag: TagData): string => {
    const noteText = tag.count === 1 ? 'not' : 'not';
    return `#${tag.name} (${tag.count} ${noteText})`;
  };

  const formatLastUsed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta önce`;
    return `${Math.ceil(diffDays / 30)} ay önce`;
  };

  const getTagColor = (index: number): string => {
    const colors = [
      Colors.accent.darkBlue,
      Colors.accent.coral,
      Colors.success,
      Colors.warning,
      Colors.accent.fuchsia,
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.darkBlue} />
        <Text style={styles.loadingText}>Tüm etiketler yükleniyor...</Text>
      </View>
    );
  }

  if (allTags.length === 0) {
    return (
      <View style={styles.container}>          <EmptyState
            icon="pricetags-outline"
            title="Henüz Etiket Yok"
            subtitle="Notlarınıza etiket ekleyerek burada görebilirsiniz"
          />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Etiket ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textGray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredTags.length} etiket
          {searchQuery && ` "${searchQuery}" için sonuç`}
        </Text>
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
        {filteredTags.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={48} color={Colors.textGray} />
            <Text style={styles.noResultsTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.noResultsSubtitle}>
              "{searchQuery}" için etiket bulunamadı
            </Text>
          </View>
        ) : (
          <View style={styles.tagsGrid}>
            {filteredTags.map((tag, index) => (
              <TouchableOpacity
                key={tag.name}
                style={styles.tagCard}
                onPress={() => handleTagPress(tag)}
                activeOpacity={0.7}
              >
                <View style={styles.tagHeader}>
                  <View style={[
                    styles.tagIndicator,
                    { backgroundColor: getTagColor(index) }
                  ]} />
                  <Text style={styles.tagName}>
                    #{tag.name}
                  </Text>
                </View>
                
                <Text style={styles.tagCount}>
                  {tag.count} not
                </Text>
                
                <Text style={styles.tagLastUsed}>
                  {formatLastUsed(tag.lastUsed)}
                </Text>

                <View style={styles.tagFooter}>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textGray} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 16,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral.darkGray,
    marginLeft: 8,
    marginRight: 8,
  },
  summaryContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.accent.darkBlue + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.screenPadding,
  },
  noResultsContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 48,
  },
  noResultsTitle: {
    ...Typography.h2,
    color: Colors.neutral.darkGray,
    marginTop: 16,
  },
  noResultsSubtitle: {
    ...Typography.body,
    color: Colors.textGray,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  tagsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  tagCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    width: '48%' as const,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tagHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  tagIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagName: {
    ...Typography.h2,
    color: Colors.neutral.darkGray,
    fontWeight: '600' as const,
    flex: 1,
  },
  tagCount: {
    ...Typography.body,
    color: Colors.accent.darkBlue,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  tagLastUsed: {
    ...Typography.caption,
    color: Colors.textGray,
    marginBottom: 12,
  },
  tagFooter: {
    alignItems: 'flex-end' as const,
    marginTop: 'auto' as const,
  },
  bottomSpacing: {
    height: 24,
  },
};

export default AllTagsScreen;
