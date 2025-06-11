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
    // For now, just show an alert - we'll implement filtering later
    Alert.alert('Tag Seçildi', `"${tag.name}" etiketi seçildi. ${tag.count} not bulundu.`);
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>En Çok Kullanılan Etiketler</Text>
          <Text style={styles.headerSubtitle}>{topTags.length} etiket bulundu</Text>
        </View>

        {/* Tags List */}
        <View style={styles.tagsContainer}>
          {topTags.map((tag, index) => (
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
                <Text style={[
                  styles.tagName,
                  index === 0 && styles.topTagName,
                ]}>
                  {formatTagDisplay(tag)}
                </Text>
                
                {index === 0 && (
                  <View style={styles.topBadge}>
                    <Ionicons name="trophy" size={16} color={Colors.warning} />
                  </View>
                )}
              </View>

              <Text style={styles.tagLastUsed}>
                Son kullanım: {formatLastUsed(tag.lastUsed)}
              </Text>

              <View style={styles.tagFooter}>
                <Text style={styles.tagRank}>#{index + 1}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textGray} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
    padding: 16,
  },
  header: {
    marginBottom: 20,
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
    backgroundColor: Colors.accent.darkBlue + '05',
  },
  tagHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.neutral.darkGray,
  },
  topTagName: {
    color: Colors.accent.darkBlue,
    fontWeight: '700' as const,
  },
  tagLastUsed: {
    ...Typography.caption,
    color: Colors.textGray,
    marginTop: 4,
  },
  topBadge: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    padding: 6,
  },
  tagFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  tagRank: {
    ...Typography.caption,
    color: Colors.textGray,
    fontWeight: '600' as const,
  },
  bottomSpacing: {
    height: 24,
  },
};

export default TagsScreen;
