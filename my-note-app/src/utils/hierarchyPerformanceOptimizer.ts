import { Note } from '../types/Note';
import { SubNoteUtils, HierarchyStats, HIERARCHY_CONFIG } from './subNoteUtils';
import { logger } from './logger';

/**
 * Performance optimization cache for hierarchy calculations
 */
interface HierarchyCache {
  stats: Map<string, { data: HierarchyStats; timestamp: number }>;
  children: Map<string, { data: Note[]; timestamp: number }>;
  depths: Map<string, { data: number; timestamp: number }>;
  descendants: Map<string, { data: Note[]; timestamp: number }>;
}

/**
 * Lazy loading configuration for large hierarchies
 */
interface LazyLoadingConfig {
  pageSize: number;
  preloadThreshold: number;
  maxCachedPages: number;
  cacheTimeout: number; // milliseconds
}

/**
 * Performance monitoring metrics
 */
interface PerformanceMetrics {
  cacheHitRate: number;
  averageCalculationTime: number;
  memoryUsage: number;
  lastCleanup: number;
}

/**
 * Smart UX defaults and performance optimization for multi-level hierarchies
 */
export class HierarchyPerformanceOptimizer {
  private static instance: HierarchyPerformanceOptimizer;
  private cache: HierarchyCache;
  private metrics: PerformanceMetrics;
  private readonly config: LazyLoadingConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Cache configuration
  private static readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000; // Maximum cached entries
  private static readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    this.cache = {
      stats: new Map(),
      children: new Map(),
      depths: new Map(),
      descendants: new Map(),
    };

    this.metrics = {
      cacheHitRate: 0,
      averageCalculationTime: 0,
      memoryUsage: 0,
      lastCleanup: Date.now(),
    };

    this.config = {
      pageSize: 50,
      preloadThreshold: 10,
      maxCachedPages: 20,
      cacheTimeout: HierarchyPerformanceOptimizer.CACHE_TIMEOUT,
    };

    this.startBackgroundCleanup();
  }

  public static getInstance(): HierarchyPerformanceOptimizer {
    if (!HierarchyPerformanceOptimizer.instance) {
      HierarchyPerformanceOptimizer.instance = new HierarchyPerformanceOptimizer();
    }
    return HierarchyPerformanceOptimizer.instance;
  }

  /**
   * Start background cleanup process
   */
  private startBackgroundCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, HierarchyPerformanceOptimizer.CLEANUP_INTERVAL);
  }

  /**
   * Stop background cleanup process
   */
  public stopBackgroundCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.stats.clear();
    this.cache.children.clear();
    this.cache.depths.clear();
    this.cache.descendants.clear();
    logger.dev('HierarchyPerformanceOptimizer: Cache cleared');
  }

  /**
   * Get cached hierarchy stats or calculate and cache them
   */
  public getHierarchyStats(noteId: string, allNotes: Note[]): HierarchyStats {
    const cacheKey = `${noteId}_stats`;
    const cached = this.cache.stats.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.updateCacheHitRate(true);
      return cached.data;
    }

    const startTime = performance.now();
    const stats = SubNoteUtils.getHierarchyStats(noteId, allNotes);
    const calculationTime = performance.now() - startTime;

    this.cache.stats.set(cacheKey, { data: stats, timestamp: Date.now() });
    this.updateCacheHitRate(false);
    this.updateCalculationTime(calculationTime);

    return stats;
  }

  /**
   * Get cached children or calculate and cache them
   */
  public getDirectChildren(noteId: string, allNotes: Note[]): Note[] {
    const cacheKey = `${noteId}_children`;
    const cached = this.cache.children.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.updateCacheHitRate(true);
      return cached.data;
    }

    const startTime = performance.now();
    const children = SubNoteUtils.getDirectChildren(noteId, allNotes);
    const calculationTime = performance.now() - startTime;

    this.cache.children.set(cacheKey, { data: children, timestamp: Date.now() });
    this.updateCacheHitRate(false);
    this.updateCalculationTime(calculationTime);

    return children;
  }

  /**
   * Get cached depth or calculate and cache it
   */
  public getNoteDepth(noteId: string, allNotes: Note[]): number {
    const cacheKey = `${noteId}_depth`;
    const cached = this.cache.depths.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.updateCacheHitRate(true);
      return cached.data;
    }

    const startTime = performance.now();
    const depth = SubNoteUtils.getNoteDepth(noteId, allNotes);
    const calculationTime = performance.now() - startTime;

    this.cache.depths.set(cacheKey, { data: depth, timestamp: Date.now() });
    this.updateCacheHitRate(false);
    this.updateCalculationTime(calculationTime);

    return depth;
  }

  /**
   * Get cached descendants or calculate and cache them
   */
  public getAllDescendants(noteId: string, allNotes: Note[]): Note[] {
    const cacheKey = `${noteId}_descendants`;
    const cached = this.cache.descendants.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.updateCacheHitRate(true);
      return cached.data;
    }

    const startTime = performance.now();
    const descendants = SubNoteUtils.getAllDescendants(noteId, allNotes);
    const calculationTime = performance.now() - startTime;

    this.cache.descendants.set(cacheKey, { data: descendants, timestamp: Date.now() });
    this.updateCacheHitRate(false);
    this.updateCalculationTime(calculationTime);

    return descendants;
  }

  /**
   * Lazy load children with pagination
   */
  public getLazyChildren(
    noteId: string,
    allNotes: Note[],
    page: number = 0
  ): { children: Note[]; hasMore: boolean; totalCount: number } {
    const allChildren = this.getDirectChildren(noteId, allNotes);
    const startIndex = page * this.config.pageSize;
    const endIndex = startIndex + this.config.pageSize;
    
    return {
      children: allChildren.slice(startIndex, endIndex),
      hasMore: endIndex < allChildren.length,
      totalCount: allChildren.length,
    };
  }

  /**
   * Get performance recommendations based on hierarchy structure
   */
  public getPerformanceRecommendations(noteId: string, allNotes: Note[]): {
    recommendedDepthLimit: number;
    shouldUseLazyLoading: boolean;
    optimizationSuggestions: string[];
  } {
    const stats = this.getHierarchyStats(noteId, allNotes);
    const recommendations = {
      recommendedDepthLimit: HIERARCHY_CONFIG.maxDepthLimit,
      shouldUseLazyLoading: false,
      optimizationSuggestions: [] as string[],
    };

    // Adjust depth limit based on total descendants
    if (stats.totalDescendants > 100) {
      recommendations.recommendedDepthLimit = Math.max(3, HIERARCHY_CONFIG.maxDepthLimit - 2);
      recommendations.optimizationSuggestions.push('Consider limiting depth due to large hierarchy');
    }

    // Recommend lazy loading for large hierarchies
    if (stats.totalDescendants > 50) {
      recommendations.shouldUseLazyLoading = true;
      recommendations.optimizationSuggestions.push('Use lazy loading for better performance');
    }

    // Warn about performance bottlenecks
    if (stats.maxDepth > HIERARCHY_CONFIG.warningDepthThreshold) {
      recommendations.optimizationSuggestions.push('Hierarchy is very deep, consider restructuring');
    }

    if (stats.totalDescendants > HIERARCHY_CONFIG.largeHierarchyThreshold) {
      recommendations.optimizationSuggestions.push('Large hierarchy detected, enable performance monitoring');
    }

    return recommendations;
  }

  /**
   * Invalidate cache for a specific note and its affected relationships
   */
  public invalidateCache(noteId: string, allNotes: Note[]): void {
    // Invalidate direct caches
    this.cache.stats.delete(`${noteId}_stats`);
    this.cache.children.delete(`${noteId}_children`);
    this.cache.depths.delete(`${noteId}_depth`);
    this.cache.descendants.delete(`${noteId}_descendants`);

    // Invalidate parent and ancestor caches that might be affected
    const note = allNotes.find(n => n.id === noteId);
    if (note?.parentId) {
      this.invalidateAncestorCaches(note.parentId, allNotes);
    }

    logger.dev(`Cache invalidated for note ${noteId} and affected ancestors`);
  }

  /**
   * Invalidate ancestor caches recursively
   */
  private invalidateAncestorCaches(parentId: string, allNotes: Note[]): void {
    this.cache.stats.delete(`${parentId}_stats`);
    this.cache.children.delete(`${parentId}_children`);
    this.cache.descendants.delete(`${parentId}_descendants`);

    const parent = allNotes.find(n => n.id === parentId);
    if (parent?.parentId) {
      this.invalidateAncestorCaches(parent.parentId, allNotes);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const caches = [this.cache.stats, this.cache.children, this.cache.depths, this.cache.descendants];
    
    let cleanedEntries = 0;
    
    caches.forEach(cache => {
      for (const [key, value] of cache.entries()) {
        if (!this.isCacheValid(value.timestamp)) {
          cache.delete(key);
          cleanedEntries++;
        }
      }
    });

    // Limit cache size
    caches.forEach(cache => {
      if (cache.size > HierarchyPerformanceOptimizer.MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Sort by timestamp
        const toDelete = entries.slice(0, cache.size - HierarchyPerformanceOptimizer.MAX_CACHE_SIZE);
        toDelete.forEach(([key]) => cache.delete(key));
        cleanedEntries += toDelete.length;
      }
    });

    if (cleanedEntries > 0) {
      logger.dev(`Cleaned up ${cleanedEntries} expired cache entries`);
    }

    this.metrics.lastCleanup = now;
    this.updateMemoryUsage();
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.config.cacheTimeout;
  }

  /**
   * Update cache hit rate metrics
   */
  private updateCacheHitRate(isHit: boolean): void {
    // Simple moving average (could be improved with more sophisticated metrics)
    const hitValue = isHit ? 1 : 0;
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9) + (hitValue * 0.1);
  }

  /**
   * Update calculation time metrics
   */
  private updateCalculationTime(time: number): void {
    this.metrics.averageCalculationTime = (this.metrics.averageCalculationTime * 0.9) + (time * 0.1);
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    let totalEntries = 0;
    totalEntries += this.cache.stats.size;
    totalEntries += this.cache.children.size;
    totalEntries += this.cache.depths.size;
    totalEntries += this.cache.descendants.size;
    
    // Rough estimation: each cache entry ~1KB
    this.metrics.memoryUsage = totalEntries * 1024;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Get configuration
   */
  public getConfig(): LazyLoadingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<LazyLoadingConfig>): void {
    Object.assign(this.config, newConfig);
    logger.dev('HierarchyPerformanceOptimizer configuration updated', newConfig);
  }
}

/**
 * React hook for using hierarchy performance optimization
 */
export const useHierarchyPerformance = () => {
  const optimizer = HierarchyPerformanceOptimizer.getInstance();
  
  return {
    getHierarchyStats: (noteId: string, allNotes: Note[]) => 
      optimizer.getHierarchyStats(noteId, allNotes),
    getDirectChildren: (noteId: string, allNotes: Note[]) => 
      optimizer.getDirectChildren(noteId, allNotes),
    getNoteDepth: (noteId: string, allNotes: Note[]) => 
      optimizer.getNoteDepth(noteId, allNotes),
    getAllDescendants: (noteId: string, allNotes: Note[]) => 
      optimizer.getAllDescendants(noteId, allNotes),
    getLazyChildren: (noteId: string, allNotes: Note[], page?: number) => 
      optimizer.getLazyChildren(noteId, allNotes, page),
    getPerformanceRecommendations: (noteId: string, allNotes: Note[]) => 
      optimizer.getPerformanceRecommendations(noteId, allNotes),
    invalidateCache: (noteId: string, allNotes: Note[]) => 
      optimizer.invalidateCache(noteId, allNotes),
    getMetrics: () => optimizer.getMetrics(),
    getConfig: () => optimizer.getConfig(),
    updateConfig: (config: Partial<LazyLoadingConfig>) => optimizer.updateConfig(config),
    clearCache: () => optimizer.clearCache(),
  };
};