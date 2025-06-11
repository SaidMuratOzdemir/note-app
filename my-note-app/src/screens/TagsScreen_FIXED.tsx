import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotes } from '../services/storage';
import { Note } from '../types/Note';
import { Colors, Typography, Layout } from '../theme';
import { EmptyState } from '../components/EmptyState';

interface TagData {
  name: string;
  count: number;
  lastUsed: string;
}

const TagsScreen = ({ navigation }: any) => {
  const [topTags, setTopTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      
      // Get all notes and calculate tag statistics
      const allNotes = await getNotes();
      const tagStats = calculateTagStats(allNotes);
      
      setTopTags(tagStats.slice(0, 10)); // Top 10 tags
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Hata', 'Etiketler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTagStats = (notes: Note[]): TagData[] => {
    const tagCounts = new Map<string, number>();
    const tagLastUsed = new Map<string, string>();

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
      await loadTags();
    } catch (error) {
      console.error('Error refreshing tags:', error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.darkBlue} />
        <Text style={styles.loadingText}>Etiketler yükleniyor...</Text>
      </View>
    );
  }

  if (topTags.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="pricetags-outline"
          title="Henüz Etiket Yok"
          subtitle="Notlarınıza etiket ekleyerek burada görebilirsiniz"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {/* Statistics Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>En Çok Kullanılan Etiketler</Text>
          <Text style={styles.headerSubtitle}>
            {topTags.length} etiket • {topTags.reduce((sum, tag) => sum + tag.count, 0)} not
          </Text>
        </View>

        {/* Tags List */}
        <View style={styles.tagsContainer}>
          {topTags.map((tag, index) => {
            const maxCount = topTags[0]?.count || 1;
            const progressPercentage = (tag.count / maxCount) * 100;
            
            return (
              <TouchableOpacity
                key={tag.name}
                style={[
                  styles.tagCard,
                  index === 0 && styles.topTagCard,
                ]}
                onPress={() => handleTagPress(tag)}
                activeOpacity={0.7}
              >
                <View style={styles.tagHeader}>
                  <View style={styles.tagTitleRow}>
                    <Text style={[
                      styles.tagName,
                      index === 0 && styles.topTagName,
                    ]}>
                      {formatTagDisplay(tag)}
                    </Text>
                    
                    {index === 0 && (
                      <View style={styles.topBadge}>
                        <Text style={styles.trophyText}>🏆</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.tagRank,
                    index === 0 && styles.topTagRank,
                  ]}>
                    #{index + 1}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${progressPercentage}%` as const,
                          backgroundColor: index === 0 ? Colors.warning : Colors.accent.coral
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
                </View>

                <View style={styles.tagFooter}>
                  <Text style={styles.tagLastUsed}>
                    Son kullanım: {formatLastUsed(tag.lastUsed)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textGray} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* All Tags Button */}
        <TouchableOpacity
          style={styles.allTagsButton}
          onPress={() => navigation.navigate('AllTags')}
          activeOpacity={0.7}
        >
          <Ionicons name="grid-outline" size={20} color={Colors.accent.darkBlue} />
          <Text style={styles.allTagsButtonText}>Tüm Etiketleri Görüntüle</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.accent.darkBlue} />
        </TouchableOpacity>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.screenPadding,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.neutral.darkGray,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textGray,
    marginTop: 4,
  },
  tagsContainer: {
    gap: 12,
  },
  tagCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topTagCard: {
    borderColor: Colors.accent.darkBlue,
    borderWidth: 2,
    backgroundColor: Colors.accent.darkBlue + '08',
  },
  tagHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  tagTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.neutral.darkGray,
    flex: 1,
  },
  topTagName: {
    color: Colors.accent.darkBlue,
    fontSize: 17,
    fontWeight: 'bold' as const,
  },
  topBadge: {
    marginLeft: 8,
    padding: 2,
  },
  trophyText: {
    fontSize: 18,
  },
  tagRank: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textGray,
  },
  topTagRank: {
    color: Colors.accent.darkBlue,
    fontWeight: 'bold' as const,
  },
  progressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral.lightGray2,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textGray,
    minWidth: 35,
    textAlign: 'right' as const,
  },
  tagFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  tagLastUsed: {
    fontSize: 12,
    color: Colors.textGray,
  },
  allTagsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  allTagsButtonText: {
    ...Typography.bodyLarge,
    color: Colors.accent.darkBlue,
    fontWeight: '600' as const,
    flex: 1,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 24,
  },
};

export default TagsScreen;
