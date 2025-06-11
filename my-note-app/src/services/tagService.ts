import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';
import { 
  TagCache, 
  TagAnalytics, 
  TagCacheConfig, 
  TagFilterOptions,
  TagDisplayFormat,
  TagStatistics,
  CacheUpdateTrigger, 
  CACHE_KEYS 
} from '../types/TagCache';
import * as storageService from './storage';

/**
 * TagService handles all tag-related operations with intelligent caching
 * 
 * Cache Strategy:
 * - Background calculation on note changes
 * - 24-hour cache expiry
 * - Debounced updates for performance
 * - Manual refresh capability
 */
export class TagService {
  private static instance: TagService;
  private cache: TagAnalytics | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;
  
  private config: TagCacheConfig = {
    maxTopTags: 10,
    cacheExpiryHours: 24,
    updateDebounceMs: 1000,
    enableBackgroundUpdate: true,
    realtimeUpdates: true,
  };
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  // ===========================================
  // PUBLIC API METHODS
  // ===========================================

  /**
   * Initialize service and load cache
   */
  async initialize(): Promise<void> {
    try {
      console.log('[TagService] Initializing...');
      await this.loadCache();
      
      if (!this.cache || this.isCacheExpired()) {
        console.log('[TagService] Cache missing or expired, recalculating...');
        await this.updateCache();
      }
      
      console.log('[TagService] Initialized successfully');
    } catch (error) {
      console.error('[TagService] Initialization failed:', error);
      await this.updateCache(); // Fallback to fresh calculation
    }
  }

  /**
   * Get top N most used tags (realtime cached)
   */
  async getTopTags(limit: number = this.config.maxTopTags): Promise<TagCache[]> {
    await this.ensureCacheLoaded();
    return this.cache?.topTags.slice(0, limit) || [];
  }

  /**
   * Get all notes containing a specific tag
   */
  async getNotesWithTag(tagName: string, options?: Partial<TagFilterOptions>): Promise<Note[]> {
    const defaultOptions: TagFilterOptions = {
      tagName: tagName.toLowerCase(),
      includeSubNotes: true,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    
    const filterOptions = { ...defaultOptions, ...options };
    const allNotes = await storageService.getNotes();
    
    // Filter notes by tag
    const filteredNotes = allNotes.filter((note: Note) => {
      const hasTag = note.tags && note.tags.includes(filterOptions.tagName);
      
      // Apply sub-note filter if specified
      if (!filterOptions.includeSubNotes && note.parentId) {
        return false;
      }
      
      return hasTag;
    });
    
    // Apply sorting
    return this.sortNotes(filteredNotes, filterOptions.sortBy, filterOptions.sortOrder);
  }

  /**
   * Get count of notes with specific tag
   */
  async getTagCount(tagName: string, includeSubNotes: boolean = true): Promise<number> {
    const notes = await this.getNotesWithTag(tagName, { 
      tagName, 
      includeSubNotes,
      sortBy: 'date',
      sortOrder: 'desc'
    });
    return notes.length;
  }

  /**
   * Get complete tag analytics
   */
  async getTagAnalytics(): Promise<TagAnalytics> {
    await this.ensureCacheLoaded();
    
    if (!this.cache) {
      await this.updateCache();
    }
    
    return this.cache!;
  }

  /**
   * Get all unique tags with statistics
   */
  async getAllTags(): Promise<TagStatistics[]> {
    const allNotes = await storageService.getNotes();
    return this.calculateAllTagStats(allNotes);
  }

  /**
   * Schedule cache update based on trigger
   */
  async scheduleUpdate(trigger: CacheUpdateTrigger): Promise<void> {
    if (!this.config.enableBackgroundUpdate) return;
    
    console.log(`[TagService] Scheduling update for: ${trigger}`);
    
    // Immediate updates for critical changes
    if (trigger === CacheUpdateTrigger.NOTE_DELETED || 
        trigger === CacheUpdateTrigger.NOTE_CREATED ||
        trigger === CacheUpdateTrigger.APP_START ||
        trigger === CacheUpdateTrigger.MANUAL_REFRESH) {
      
      // Clear any pending debounced update
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
      }
      
      setTimeout(() => this.updateCache(), 100);
    }
    // Debounced updates for frequent changes
    else if (trigger === CacheUpdateTrigger.NOTE_UPDATED) {
      this.debouncedUpdate();
    }
  }

  /**
   * Force immediate cache update
   */
  async updateCache(): Promise<void> {
    try {
      console.log('[TagService] Starting cache update...');
      const analytics = await this.calculateTagAnalytics();
      await this.saveCache(analytics);
      this.cache = analytics;
      console.log(`[TagService] Cache updated with ${analytics.topTags.length} tags, ${analytics.totalNotes} notes`);
    } catch (error) {
      console.error('[TagService] Cache update failed:', error);
      throw error;
    }
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.TAG_ANALYTICS,
      CACHE_KEYS.LAST_UPDATE,
    ]);
    this.cache = null;
    console.log('[TagService] Cache cleared');
  }

  /**
   * Get cache status and metadata
   */
  async getCacheStatus(): Promise<{
    isLoaded: boolean;
    isExpired: boolean;
    lastUpdate: string | null;
    totalTags: number;
    totalNotes: number;
  }> {
    await this.ensureCacheLoaded();
    
    return {
      isLoaded: this.cache !== null,
      isExpired: this.isCacheExpired(),
      lastUpdate: this.cache?.lastUpdate || null,
      totalTags: this.cache?.totalTags || 0,
      totalNotes: this.cache?.totalNotes || 0,
    };
  }

  /**
   * Format tags for display in UI components
   */
  formatTagsForDisplay(tags: TagCache[]): TagDisplayFormat[] {
    return tags.map((tag, index) => ({
      displayName: `#${tag.tagName} (${tag.count} not)`,
      tagName: tag.tagName,
      count: tag.count,
      isActive: false,
      color: this.getTagColor(index),
    }));
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private async ensureCacheLoaded(): Promise<void> {
    if (!this.cache) {
      await this.loadCache();
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEYS.TAG_ANALYTICS);
      if (cacheData) {
        this.cache = JSON.parse(cacheData);
        console.log('[TagService] Cache loaded from storage');
      }
    } catch (error) {
      console.error('[TagService] Failed to load cache:', error);
      this.cache = null;
    }
  }

  private async saveCache(analytics: TagAnalytics): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.TAG_ANALYTICS, JSON.stringify(analytics));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, analytics.lastUpdate);
    } catch (error) {
      console.error('[TagService] Failed to save cache:', error);
      throw error;
    }
  }

  private isCacheExpired(): boolean {
    if (!this.cache) return true;
    
    const cacheAge = Date.now() - new Date(this.cache.lastUpdate).getTime();
    const maxAge = this.config.cacheExpiryHours * 60 * 60 * 1000;
    
    return cacheAge > maxAge;
  }

  private debouncedUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(async () => {
      await this.updateCache();
      this.updateTimeout = null;
    }, this.config.updateDebounceMs);
  }

  private async calculateTagAnalytics(): Promise<TagAnalytics> {
    const allNotes = await storageService.getNotes();
    const tagCounts = new Map<string, number>();
    const tagLastUsed = new Map<string, string>();
    
    // Count tag occurrences and track last usage
    allNotes.forEach((note: Note) => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase();
          
          // Update count
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
          
          // Update last used date
          const currentLastUsed = tagLastUsed.get(normalizedTag);
          const noteDate = note.createdAt; // Using createdAt as available field
          
          if (!currentLastUsed || new Date(noteDate) > new Date(currentLastUsed)) {
            tagLastUsed.set(normalizedTag, noteDate);
          }
        });
      }
    });
    
    // Convert to TagCache array and sort by count
    const topTags: TagCache[] = Array.from(tagCounts.entries())
      .map(([tagName, count]): TagCache => ({
        tagName,
        count,
        lastUsed: tagLastUsed.get(tagName) || new Date().toISOString(),
        lastCalculated: new Date().toISOString(),
      }))
      .sort((a, b) => {
        // Sort by count (descending), then by last used (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      })
      .slice(0, this.config.maxTopTags);
    
    return {
      topTags,
      totalTags: tagCounts.size,
      totalNotes: allNotes.length,
      lastUpdate: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  private calculateAllTagStats(notes: Note[]): TagStatistics[] {
    const tagStats = new Map<string, TagStatistics>();

    notes.forEach((note: Note) => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase();
          const noteDate = note.createdAt;

          const existing = tagStats.get(normalizedTag);
          if (existing) {
            existing.totalUniqueNotes += 1;
            existing.totalOccurrences += 1;
            
            if (new Date(noteDate) < new Date(existing.firstUsed)) {
              existing.firstUsed = noteDate;
            }
            if (new Date(noteDate) > new Date(existing.lastUsed)) {
              existing.lastUsed = noteDate;
            }
          } else {
            tagStats.set(normalizedTag, {
              totalUniqueNotes: 1,
              totalOccurrences: 1,
              averageNotesPerDay: 0, // Will be calculated after
              firstUsed: noteDate,
              lastUsed: noteDate,
              usageScore: 0, // Will be calculated after
            });
          }
        });
      }
    });

    // Calculate derived statistics
    const now = new Date();
    return Array.from(tagStats.entries()).map(([, stats]) => {
      const daysSinceFirst = Math.max(
        1, 
        Math.ceil((now.getTime() - new Date(stats.firstUsed).getTime()) / (1000 * 60 * 60 * 24))
      );
      
      const averageNotesPerDay = stats.totalUniqueNotes / daysSinceFirst;
      const usageScore = stats.totalUniqueNotes * 2 + averageNotesPerDay * 10;

      return {
        ...stats,
        averageNotesPerDay,
        usageScore,
      };
    }).sort((a, b) => b.usageScore - a.usageScore);
  }

  private sortNotes(notes: Note[], sortBy: 'date' | 'title' | 'relevance', order: 'asc' | 'desc'): Note[] {
    const sortedNotes = [...notes];
    
    sortedNotes.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          comparison = dateB - dateA; // Most recent first by default
          break;
          
        case 'title':
          const titleA = a.title || a.content.substring(0, 50);
          const titleB = b.title || b.content.substring(0, 50);
          comparison = titleA.localeCompare(titleB);
          break;
          
        case 'relevance':
          // For relevance, prioritize notes with more matching tags
          comparison = (b.tags?.length || 0) - (a.tags?.length || 0);
          break;
      }
      
      return order === 'desc' ? comparison : -comparison;
    });
    
    return sortedNotes;
  }

  private getTagColor(index: number): string {
    const colors = [
      '#1E40AF', // Colors.accent.darkBlue
      '#F97316', // Colors.accent.coral  
      '#059669', // Colors.success
      '#D97706', // Colors.warning
      '#3B82F6', // Colors.accent.lightBlue
    ];
    return colors[index % colors.length];
  }
}
