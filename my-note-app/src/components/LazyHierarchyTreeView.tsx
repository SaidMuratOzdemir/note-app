import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { SubNoteUtils, HIERARCHY_CONFIG } from '../utils/subNoteUtils';
import { useHierarchyPerformance } from '../utils/hierarchyPerformanceOptimizer';
import { Colors, Typography, Layout } from '../theme';
import { logger } from '../utils/logger';

interface LazyHierarchyNode {
  note: Note;
  depth: number;
  isExpanded: boolean;
  canHaveChildren: boolean;
  hasLoadedChildren: boolean;
  childrenPage: number;
  hasMoreChildren: boolean;
  totalChildrenCount: number;
}

interface LazyHierarchyTreeViewProps {
  rootNote: Note;
  allNotes: Note[];
  onNotePress: (note: Note) => void;
  onCreateSubNote: (parentNote: Note) => void;
  maxDepth?: number;
  autoCollapseDepth?: number;
  enableLazyLoading?: boolean;
  pageSize?: number;
}

export const LazyHierarchyTreeView: React.FC<LazyHierarchyTreeViewProps> = ({
  rootNote,
  allNotes,
  onNotePress,
  onCreateSubNote,
  maxDepth = HIERARCHY_CONFIG.MAX_DEPTH,
  autoCollapseDepth = HIERARCHY_CONFIG.WARNING_DEPTH,
  enableLazyLoading = true,
  pageSize = 20,
}) => {
  const performance = useHierarchyPerformance();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([rootNote.id]));
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Check if lazy loading should be enabled for this hierarchy
  const shouldUseLazyLoading = enableLazyLoading && performance.shouldUseLazyLoading(rootNote.id, allNotes);

  // Get collapse recommendations
  const collapseRecommendations = useMemo(() => {
    return performance.getCollapseRecommendations(rootNote.id, allNotes);
  }, [rootNote.id, allNotes, performance]);

  // Build flat list data for efficient rendering
  const flatListData = useMemo(() => {
    const buildFlatData = (note: Note, depth: number = 0): LazyHierarchyNode[] => {
      const result: LazyHierarchyNode[] = [];
      const isExpanded = expandedNodes.has(note.id);
      
      // Get children information
      const childrenInfo = shouldUseLazyLoading
        ? performance.getCachedChildren(note.id, allNotes, 0, pageSize)
        : { 
            children: SubNoteUtils.getSubNotesFromArray(note.id, allNotes), 
            hasMore: false, 
            totalCount: SubNoteUtils.getSubNoteCountFromArray(note.id, allNotes) 
          };

      const node: LazyHierarchyNode = {
        note,
        depth,
        isExpanded,
        canHaveChildren: depth < maxDepth - 1,
        hasLoadedChildren: !shouldUseLazyLoading || childrenInfo.children.length > 0,
        childrenPage: 0,
        hasMoreChildren: childrenInfo.hasMore,
        totalChildrenCount: childrenInfo.totalCount,
      };

      result.push(node);

      // Add children if expanded and not too deep
      if (isExpanded && depth < autoCollapseDepth) {
        for (const child of childrenInfo.children) {
          result.push(...buildFlatData(child, depth + 1));
        }
      }

      return result;
    };

    return buildFlatData(rootNote);
  }, [rootNote, allNotes, expandedNodes, maxDepth, autoCollapseDepth, shouldUseLazyLoading, pageSize, performance]);

  // Calculate hierarchy statistics
  const hierarchyStats = useMemo(() => {
    return performance.getCachedStats(rootNote.id, allNotes);
  }, [rootNote.id, allNotes, performance]);

  const toggleExpanded = useCallback(async (noteId: string) => {
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
      
      // Preload next page if lazy loading is enabled
      if (shouldUseLazyLoading) {
        performance.preloadNextPage(noteId, allNotes, 0);
      }
    }
    
    setExpandedNodes(newExpanded);
  }, [expandedNodes, shouldUseLazyLoading, performance, allNotes]);

  const loadMoreChildren = useCallback(async (parentId: string, currentPage: number) => {
    if (!shouldUseLazyLoading) return;

    setLoadingNodes(prev => new Set(prev).add(parentId));
    
    try {
      // Load next page
      const nextPage = currentPage + 1;
      const childrenInfo = performance.getCachedChildren(parentId, allNotes, nextPage, pageSize);
      
      // Preload the page after next
      if (childrenInfo.hasMore) {
        performance.preloadNextPage(parentId, allNotes, nextPage);
      }
      
      // Force re-render by updating expanded nodes
      setExpandedNodes(prev => new Set(prev));
      
      logger.dev(`[LazyHierarchyTreeView] Loaded page ${nextPage} for ${parentId}`);
    } catch (error) {
      logger.error('[LazyHierarchyTreeView] Failed to load more children:', error);
      Alert.alert('Hata', 'Alt notlar yüklenirken bir hata oluştu.');
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentId);
        return newSet;
      });
    }
  }, [shouldUseLazyLoading, performance, allNotes, pageSize]);

  const handleCreateSubNote = useCallback((parentNote: Note) => {
    // Check if lazy loading limits would be exceeded
    if (shouldUseLazyLoading) {
      const stats = performance.getCachedStats(parentNote.id, allNotes);
      if (stats.performance === 'critical') {
        Alert.alert(
          'Performans Uyarısı',
          'Bu not çok fazla alt not içeriyor. Yeni alt not oluşturmak performansı etkileyebilir.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Devam Et', onPress: () => onCreateSubNote(parentNote) }
          ]
        );
        return;
      }
    }

    onCreateSubNote(parentNote);
  }, [shouldUseLazyLoading, performance, allNotes, onCreateSubNote]);

  const getDepthIndicatorColor = (depth: number): string => {
    if (depth === 0) return Colors.accent.darkBlue;
    if (depth === 1) return Colors.accent.coral;
    if (depth === 2) return Colors.success;
    if (depth === 3) return Colors.warning;
    return Colors.error;
  };

  const getPerformanceIndicator = (performance: string) => {
    if (performance === 'critical') return '🔴';
    if (performance === 'warning') return '⚠️';
    return '🟢';
  };

  const renderNode = ({ item }: { item: LazyHierarchyNode }) => {
    const { note, depth, isExpanded, canHaveChildren, hasMoreChildren, totalChildrenCount } = item;
    const hasChildren = totalChildrenCount > 0;
    const isLoading = loadingNodes.has(note.id);
    const indentLevel = depth * 20;

    return (
      <View style={[styles.nodeContainer, { marginLeft: indentLevel }]}>
        {/* Depth indicator */}
        <View style={[styles.depthIndicator, { backgroundColor: getDepthIndicatorColor(depth) }]} />
        
        <TouchableOpacity
          style={styles.nodeContent}
          onPress={() => onNotePress(note)}
          activeOpacity={0.7}
        >
          {/* Expand/collapse button */}
          {hasChildren && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpanded(note.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={Colors.neutral.darkGray}
              />
            </TouchableOpacity>
          )}

          {/* Note content */}
          <View style={styles.noteContent}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {note.title || 'Başlıksız Not'}
              </Text>
              <View style={styles.nodeInfo}>
                <Text style={styles.depthText}>L{depth}</Text>
                {hasChildren && (
                  <Text style={styles.childrenCount}>({totalChildrenCount})</Text>
                )}
              </View>
            </View>
            
            {note.content && (
              <Text style={styles.notePreview} numberOfLines={1}>
                {note.content}
              </Text>
            )}
          </View>

          {/* Add sub-note button */}
          {canHaveChildren && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleCreateSubNote(note)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={16} color={Colors.accent.coral} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Load more button for lazy loading */}
        {isExpanded && hasMoreChildren && shouldUseLazyLoading && (
          <TouchableOpacity
            style={[styles.loadMoreButton, { marginLeft: indentLevel + 20 }]}
            onPress={() => loadMoreChildren(note.id, item.childrenPage)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.accent.coral} />
            ) : (
              <>
                <Ionicons name="chevron-down" size={14} color={Colors.accent.coral} />
                <Text style={styles.loadMoreText}>Daha fazla yükle</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>
          {shouldUseLazyLoading ? 'Hiyerarşi Ağacı (Lazy Loading)' : 'Hiyerarşi Ağacı'}
        </Text>
        <Text style={styles.headerStats}>
          {hierarchyStats.totalSize} not • {hierarchyStats.depth} seviye • {getPerformanceIndicator(hierarchyStats.performance)}
        </Text>
      </View>
    </View>
  );

  const renderPerformanceWarning = () => {
    if (hierarchyStats.performance === 'good') return null;

    return (
      <View style={[
        styles.warningBanner,
        hierarchyStats.performance === 'critical' && styles.criticalBanner
      ]}>
        <Ionicons 
          name="warning" 
          size={16} 
          color={hierarchyStats.performance === 'critical' ? Colors.error : Colors.warning} 
        />
        <Text style={[
          styles.warningText,
          hierarchyStats.performance === 'critical' && styles.criticalText
        ]}>
          {hierarchyStats.performance === 'critical' 
            ? 'Kritik: Çok büyük hiyerarşi - Lazy loading aktif'
            : 'Uyarı: Büyük hiyerarşi - Performans izleniyor'
          }
        </Text>
      </View>
    );
  };

  const renderCollapseRecommendation = () => {
    if (!collapseRecommendations.shouldAutoCollapse) return null;

    return (
      <View style={styles.recommendationBanner}>
        <Ionicons name="information-circle" size={16} color={Colors.accent.darkBlue} />
        <Text style={styles.recommendationText}>
          Öneri: {collapseRecommendations.recommendedCollapseDepth}. seviyeden sonraki notlar otomatik kapatılır
        </Text>
      </View>
    );
  };

  // Effect to handle cache invalidation when notes change
  useEffect(() => {
    performance.invalidateCache(rootNote.id, allNotes);
  }, [allNotes.length, performance, rootNote.id]);

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderPerformanceWarning()}
      {renderCollapseRecommendation()}
      
      <FlatList
        data={flatListData}
        renderItem={renderNode}
        keyExtractor={(item) => `${item.note.id}_${item.depth}`}
        showsVerticalScrollIndicator={false}
        style={styles.treeContainer}
        contentContainerStyle={styles.treeContent}
        removeClippedSubviews={shouldUseLazyLoading} // Optimize for large lists
        maxToRenderPerBatch={shouldUseLazyLoading ? 10 : 50} // Render fewer items per batch for large hierarchies
        windowSize={shouldUseLazyLoading ? 5 : 10} // Smaller window for lazy loading
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.lightGray1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray2,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.neutral.darkGray,
  },
  headerStats: {
    ...Typography.caption,
    color: Colors.textGray,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 8,
    backgroundColor: Colors.warning + '20',
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '40',
  },
  criticalBanner: {
    backgroundColor: Colors.error + '20',
    borderBottomColor: Colors.error + '40',
  },
  warningText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    marginLeft: 6,
  },
  criticalText: {
    color: Colors.error,
  },
  recommendationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 6,
    backgroundColor: Colors.accent.darkBlue + '20',
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent.darkBlue + '40',
  },
  recommendationText: {
    ...Typography.caption,
    color: Colors.accent.darkBlue,
    fontWeight: '500',
    marginLeft: 6,
  },
  treeContainer: {
    flex: 1,
  },
  treeContent: {
    paddingBottom: 24,
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: Layout.screenPadding,
  },
  depthIndicator: {
    width: 3,
    height: '100%',
    marginRight: 8,
    borderRadius: 1.5,
    minHeight: 40,
  },
  nodeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    padding: 8,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
  },
  expandButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    flex: 1,
  },
  nodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depthText: {
    ...Typography.caption,
    color: Colors.textGray,
    fontWeight: '600',
    fontSize: 10,
  },
  childrenCount: {
    ...Typography.caption,
    color: Colors.accent.coral,
    fontWeight: '600',
    fontSize: 10,
    marginLeft: 4,
  },
  notePreview: {
    ...Typography.caption,
    color: Colors.neutral.darkGray,
    marginTop: 2,
  },
  addButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: Colors.accent.coral + '20',
    borderRadius: 12,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent.coral + '10',
    borderRadius: 6,
    marginTop: 4,
  },
  loadMoreText: {
    ...Typography.caption,
    color: Colors.accent.coral,
    fontWeight: '600',
    marginLeft: 4,
  },
});
