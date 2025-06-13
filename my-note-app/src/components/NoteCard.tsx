import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { Colors, Typography, Layout } from '../theme';
import { SubNoteBadge } from './SubNoteBadge';
import { SubNoteUtils, HIERARCHY_CONFIG } from '../utils/subNoteUtils';
import { useHierarchyPerformance } from '../utils/hierarchyPerformanceOptimizer';
import { formatTimeOnly } from '../utils/dateUtils';

type HierarchyContext = 'tree' | 'list' | 'flat';

interface Props {
  note: Note;
  index: number;
  onPress: () => void;
  subNoteCount?: number;
  onSubNotesPress?: () => void;
  showSubNoteBadge?: boolean;
  // Enhanced hierarchy indicators
  allNotes?: Note[];
  hierarchyContext?: HierarchyContext;
  indentLevel?: number;
  showDepthIndicator?: boolean;
  maxDepthDisplay?: number;
}

export const NoteCard: React.FC<Props> = ({ 
  note, 
  index, 
  onPress, 
  subNoteCount = 0,
  onSubNotesPress,
  showSubNoteBadge = true,
  // Enhanced hierarchy props
  allNotes = [],
  hierarchyContext = 'flat',
  indentLevel = 0,
  showDepthIndicator = false,
  maxDepthDisplay = HIERARCHY_CONFIG.MAX_DEPTH,
}) => {
  const performance = useHierarchyPerformance();

  // Memoize expensive hierarchy calculations
  const hierarchyInfo = useMemo(() => {
    const isSubNote = SubNoteUtils.isSubNote(note);
    const noteDepth = allNotes && allNotes.length > 0 ? performance.getNoteDepth(note.id, allNotes) : 0;
    const effectiveIndent = Math.max(indentLevel || 0, noteDepth);
    const shouldShowHierarchyInfo = hierarchyContext !== 'flat' && (isSubNote || effectiveIndent > 0);
    
    return {
      isSubNote,
      noteDepth,
      effectiveIndent,
      shouldShowHierarchyInfo
    };
  }, [note, allNotes, indentLevel, hierarchyContext, performance]);

  // Memoize depth color calculation
  const depthColor = useMemo(() => {
    const getDepthColor = (depth: number): string => {
      if (depth === 0) return Colors.accent.darkBlue;
      if (depth === 1) return Colors.accent.coral;
      if (depth === 2) return Colors.success;
      if (depth === 3) return Colors.warning;
      return Colors.error; // For depth 4+
    };
    return getDepthColor(hierarchyInfo.effectiveIndent);
  }, [hierarchyInfo.effectiveIndent]);

  // Memoize hierarchy status calculation
  const hierarchyStatus = useMemo(() => {
    if (!allNotes || allNotes.length === 0) return null;
    
    const stats = performance.getHierarchyStats(note.id, allNotes);
    if (stats.performance === 'critical') return { icon: '🔴', text: 'Kritik' };
    if (stats.performance === 'warning') return { icon: '⚠️', text: 'Uyarı' };
    return null;
  }, [note.id, allNotes, performance]);

  // Memoize other calculations
  const cardInfo = useMemo(() => {
    const backgroundColor = Colors.primaryPastels[index % 4];
    const hasImages = note.imageUris && note.imageUris.length > 0;
    const hasSubNotes = (subNoteCount || 0) > 0;
    const contentLines = hasSubNotes ? (hasImages ? 1 : 2) : (hasImages ? 2 : 3);
    
    return {
      backgroundColor,
      hasImages,
      hasSubNotes,
      contentLines
    };
  }, [note.imageUris, index, subNoteCount]);

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: cardInfo.backgroundColor },
        hierarchyInfo.shouldShowHierarchyInfo && styles.hierarchyCard,
        hierarchyInfo.effectiveIndent > 0 && { marginLeft: hierarchyInfo.effectiveIndent * 16 }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Depth indicator for hierarchy context */}
      {showDepthIndicator && hierarchyInfo.shouldShowHierarchyInfo && (
        <View style={[styles.depthIndicator, { backgroundColor: depthColor }]} />
      )}

      {/* Hierarchy status indicator */}
      {hierarchyStatus && hierarchyContext === 'tree' && (
        <View style={styles.hierarchyStatusContainer}>
          <Text style={styles.hierarchyStatusIcon}>{hierarchyStatus.icon}</Text>
        </View>
      )}
      {/* Header: Title + Timestamp */}
      <View style={styles.header}>
        {note.title && <Text style={styles.title}>{note.title}</Text>}
        <Text style={styles.timestamp}>{formatTimeOnly(note.createdAt)}</Text>
      </View>
      
      {/* Images Section */}
      {cardInfo.hasImages && note.imageUris && (
        <View style={styles.imagesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* First 3 images */}
            {note.imageUris.slice(0, 3).map((uri, imageIndex) => (
              <Image 
                key={imageIndex}
                source={{ uri }} 
                style={[
                  styles.image, 
                  imageIndex > 0 && styles.imageMargin
                ]} 
                contentFit="cover"
              />
            ))}
            
            {/* +X more indicator */}
            {note.imageUris.length > 3 && (
              <View style={[styles.image, styles.moreImagesIndicator, styles.imageMargin]}>
                <Text style={styles.moreImagesText}>
                  +{note.imageUris.length - 3}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
      {/* Content */}
      <Text 
        style={styles.content} 
        numberOfLines={cardInfo.contentLines}
      >
        {note.content}
      </Text>
      
      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {/* First 3 tags */}
          {note.tags.slice(0, 3).map((tag, tagIndex) => (
            <View 
              key={tagIndex} 
              style={[
                styles.tag, 
                { backgroundColor: Colors.accent.coral }
              ]}
            >
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          
          {/* +X more tags indicator */}
          {note.tags.length > 3 && (
            <View style={[styles.tag, { backgroundColor: Colors.accent.mauveGray }]}>
              <Text style={styles.tagText}>+{note.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Sub-Notes Badge */}
      {showSubNoteBadge && cardInfo.hasSubNotes && onSubNotesPress && (
        <SubNoteBadge 
          count={subNoteCount || 0}
          onPress={onSubNotesPress}
          style={styles.subNoteBadge}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    padding: Layout.cardPadding,
    marginBottom: Layout.cardMargin,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Layout.elevation.low,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: Layout.elevation.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    ...Typography.h2,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    ...Typography.timestamp,
  },
  imagesContainer: {
    marginBottom: 8,
  },
  image: {
    width: Layout.imageSize,
    height: Layout.imageSize,
    borderRadius: Layout.imageRadius,
  },
  imageMargin: {
    marginLeft: Layout.imageSpacing,
  },
  moreImagesIndicator: {
    backgroundColor: Colors.neutral.lightGray2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreImagesText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  content: {
    ...Typography.body,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.tagGap,
  },
  tag: {
    paddingHorizontal: Layout.tagPadding.horizontal,
    paddingVertical: Layout.tagPadding.vertical,
    borderRadius: Layout.tagRadius,
  },
  tagText: {
    ...Typography.tag,
  },
  subNoteBadge: {
    marginTop: 8,
  },
  // Enhanced hierarchy styles
  hierarchyCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.neutral.lightGray2,
  },
  depthIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: Layout.cardRadius,
    borderBottomLeftRadius: Layout.cardRadius,
  },
  hierarchyStatusContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  hierarchyStatusIcon: {
    fontSize: 12,
  },
});

export default React.memo(NoteCard);
