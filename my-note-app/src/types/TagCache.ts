/**
 * Tag cache data structures for realtime performance optimization
 */

export interface TagCache {
  tagName: string;
  count: number;                // Number of notes with this tag
  lastUsed: string;            // ISO date of most recent note with this tag
  lastCalculated: string;      // When this cache entry was calculated
}

export interface TagAnalytics {
  topTags: TagCache[];         // Top 10 most used tags
  totalTags: number;           // Total unique tags in system
  totalNotes: number;          // Total notes used for calculation
  lastUpdate: string;          // When analytics were last calculated
  version: string;             // Cache version for future migrations
}

export interface TagCacheConfig {
  maxTopTags: number;          // Default: 10
  cacheExpiryHours: number;    // Default: 24
  updateDebounceMs: number;    // Default: 1000
  enableBackgroundUpdate: boolean; // Default: true
  realtimeUpdates: boolean;    // Enable realtime cache updates on note changes
}

// Cache storage keys
export const CACHE_KEYS = {
  TAG_ANALYTICS: 'tag_analytics_cache_v1',
  CACHE_CONFIG: 'tag_cache_config_v1',
  LAST_UPDATE: 'tag_cache_last_update_v1',
} as const;

// Cache update trigger types
export enum CacheUpdateTrigger {
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  APP_START = 'app_start',
  MANUAL_REFRESH = 'manual_refresh',
  CACHE_EXPIRED = 'cache_expired'
}

/**
 * Tag filtering and sorting options
 */
export interface TagFilterOptions {
  tagName: string;
  includeSubNotes: boolean;    // Whether to include sub-notes in filtering
  sortBy: 'date' | 'title' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

/**
 * Tag display format for UI components
 */
export interface TagDisplayFormat {
  displayName: string;         // "#tag (X not)" format
  tagName: string;            // Raw tag name
  count: number;
  isActive: boolean;          // For UI selection state
  color?: string;             // Optional color for visual distinction
}

/**
 * Tag statistics for analytics
 */
export interface TagStatistics {
  totalUniqueNotes: number;    // Notes that have this tag
  totalOccurrences: number;    // Total times this tag appears
  averageNotesPerDay: number;  // Usage frequency
  firstUsed: string;          // When tag was first used
  lastUsed: string;           // When tag was last used
  usageScore: number;         // Calculated relevance score
}
