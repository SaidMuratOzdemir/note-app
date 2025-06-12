import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { SubNoteUtils, HIERARCHY_CONFIG } from '../utils/subNoteUtils';
import { useHierarchyPerformance } from '../utils/hierarchyPerformanceOptimizer';
import { Colors, Typography, Layout } from '../theme';
import { logger } from '../utils/logger';

interface HierarchyNode {
  note: Note;
  children: HierarchyNode[];
  depth: number;
  isExpanded: boolean;
  canHaveChildren: boolean;
}

interface HierarchyTreeViewProps {
  rootNote: Note;
  allNotes: Note[];
  onNotePress: (note: Note) => void;
  onCreateSubNote?: (parentNote: Note) => void;
  maxDepth?: number;
  autoCollapseDepth?: number;
  showPerformanceWarnings?: boolean;
}

export const HierarchyTreeView: React.FC<HierarchyTreeViewProps> = ({
  rootNote,
  allNotes,
  onNotePress,
  onCreateSubNote,
  maxDepth = HIERARCHY_CONFIG.MAX_DEPTH,
  autoCollapseDepth = HIERARCHY_CONFIG.WARNING_DEPTH,
  showPerformanceWarnings = true,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([rootNote.id]));
  const performance = useHierarchyPerformance();

  // Build hierarchy tree with performance optimization
  const hierarchyTree = useMemo(() => {
    const buildTree = (note: Note, depth: number = 0): HierarchyNode => {
      const children = performance.getCachedChildren(note.id, allNotes, 0, 100).children;
      const childNodes = children.map(child => buildTree(child, depth + 1));
      
      return {
        note,
        children: childNodes,
        depth,
        isExpanded: expandedNodes.has(note.id) && depth < autoCollapseDepth,
        canHaveChildren: depth < maxDepth - 1,
      };
    };

    return buildTree(rootNote);
  }, [rootNote, allNotes, expandedNodes, maxDepth, autoCollapseDepth, performance]);

  // Calculate hierarchy statistics with caching
  const hierarchyStats = useMemo(() => {
    return performance.getCachedStats(rootNote.id, allNotes);
  }, [rootNote.id, allNotes, performance]);

  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNodes(newExpanded);
    logger.log('[HierarchyTreeView] Toggled node:', noteId);
  };

  const handleCreateSubNote = (parentNote: Note) => {
    if (!onCreateSubNote) return;

    // Validate if sub-note can be created
    const validation = SubNoteUtils.canCreateSubNote(parentNote.id, allNotes);
    
    if (!validation.isValid) {
      Alert.alert(
        'Alt Not Oluşturulamıyor',
        validation.reason || 'Bu not için alt not oluşturulamıyor.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    // Show performance warnings if enabled
    if (showPerformanceWarnings && validation.warnings && validation.warnings.length > 0) {
      Alert.alert(
        'Performans Uyarısı',
        validation.warnings.join('\n\n') + '\n\nDevam etmek istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Devam Et', onPress: () => onCreateSubNote(parentNote) }
        ]
      );
      return;
    }

    onCreateSubNote(parentNote);
  };

  const getDepthIndicatorColor = (depth: number): string => {
    if (depth === 0) return Colors.accent.darkBlue;
    if (depth === 1) return Colors.accent.coral;
    if (depth === 2) return Colors.success;
    if (depth === 3) return Colors.warning;
    return Colors.error; // For depth 4+
  };

  const getPerformanceIndicator = (stats: typeof hierarchyStats) => {
    if (stats.performance === 'critical') return '🔴';
    if (stats.performance === 'warning') return '⚠️';
    return '🟢';
  };

  const renderNode = (node: HierarchyNode): React.ReactNode => {
    const { note, children, depth, isExpanded, canHaveChildren } = node;
    const hasChildren = children.length > 0;
    const indentLevel = depth * 16;
    const depthColor = getDepthIndicatorColor(depth);
    
    return (
      <View key={note.id} style={styles.nodeContainer}>
        {/* Main node */}
        <View style={[styles.nodeRow, { marginLeft: indentLevel }]}>
          {/* Depth indicator line */}
          <View style={[styles.depthIndicator, { backgroundColor: depthColor }]} />
          
          {/* Expand/collapse button */}
          {hasChildren ? (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpanded(note.id)}
            >
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={Colors.neutral.darkGray}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandButton} />
          )}

          {/* Note content */}
          <TouchableOpacity
            style={styles.noteContent}
            onPress={() => onNotePress(note)}
            activeOpacity={0.7}
          >
            <View style={styles.noteHeader}>
              <Text style={[styles.noteTitle, { color: depthColor }]} numberOfLines={1}>
                {note.title || 'Başlıksız Not'}
              </Text>
              <View style={styles.nodeInfo}>
                <Text style={styles.depthText}>L{depth}</Text>
                {hasChildren && (
                  <Text style={styles.childrenCount}>({children.length})</Text>
                )}
              </View>
            </View>
            <Text style={styles.notePreview} numberOfLines={1}>
              {note.content}
            </Text>
          </TouchableOpacity>

          {/* Add sub-note button */}
          {canHaveChildren && onCreateSubNote && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleCreateSubNote(note)}
            >
              <Ionicons name="add" size={16} color={Colors.accent.coral} />
            </TouchableOpacity>
          )}
        </View>

        {/* Children (if expanded) */}
        {hasChildren && isExpanded && (
          <View style={styles.childrenContainer}>
            {children.map(child => renderNode(child))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with statistics */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Hiyerarşi Ağacı</Text>
          <Text style={styles.headerStats}>
            {hierarchyStats.totalSize} not • {hierarchyStats.depth} seviye derinlik
          </Text>
        </View>
        <View style={styles.performanceIndicator}>
          <Text style={styles.performanceText}>
            {getPerformanceIndicator(hierarchyStats)}
          </Text>
        </View>
      </View>

      {/* Performance warning */}
      {hierarchyStats.performance !== 'good' && showPerformanceWarnings && (
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
              ? 'Kritik performans sorunu: Çok derin hiyerarşi'
              : 'Performans uyarısı: Hiyerarşi büyüyor'
            }
          </Text>
        </View>
      )}

      {/* Tree content */}
      <ScrollView style={styles.treeContainer} showsVerticalScrollIndicator={false}>
        {renderNode(hierarchyTree)}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  performanceIndicator: {
    alignItems: 'center',
  },
  performanceText: {
    fontSize: 20,
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
  treeContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  nodeContainer: {
    marginVertical: 2,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  depthIndicator: {
    width: 3,
    height: '100%',
    borderRadius: 1.5,
    marginRight: 8,
  },
  expandButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  noteContent: {
    flex: 1,
    paddingVertical: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  noteTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
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
  childrenContainer: {
    // Children are indented by the parent's marginLeft
  },
  bottomSpacing: {
    height: 24,
  },
});
