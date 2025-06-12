import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types/Note';
import { Colors } from '../theme';
import { SubNoteUtils, HIERARCHY_CONFIG } from '../utils/subNoteUtils';

interface BreadcrumbItem {
  id: string;
  title: string;
  isRoot: boolean;
}

interface BreadcrumbNavigationProps {
  currentNote: Note;
  allNotes: Note[];
  onNotePress: (noteId: string) => void;
  maxVisible?: number;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentNote,
  allNotes,
  onNotePress,
  maxVisible = 4,
}) => {
  const buildBreadcrumbPath = (): BreadcrumbItem[] => {
    const path: BreadcrumbItem[] = [];
    let current: Note | undefined = currentNote;
    const visitedIds = new Set<string>(); // Prevent infinite loops
    const maxDepth = 20; // Safety limit
    let depth = 0;

    // Build path from current note to root
    while (current && depth < maxDepth) {
      // Check for circular reference
      if (visitedIds.has(current.id)) {
        console.warn('[BreadcrumbNavigation] Circular reference detected:', current.id);
        break;
      }
      
      visitedIds.add(current.id);
      path.unshift({
        id: current.id,
        title: current.title || 'Başlıksız Not',
        isRoot: !current.parentId,
      });

      // Find parent
      if (current.parentId) {
        const nextCurrent = allNotes.find(n => n.id === current!.parentId);
        current = nextCurrent;
        depth++;
      } else {
        break;
      }
    }

    if (depth >= maxDepth) {
      console.error('[BreadcrumbNavigation] Max depth exceeded, possible infinite loop');
    }

    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath();
  const depth = breadcrumbPath.length;
  const isDeepHierarchy = depth >= HIERARCHY_CONFIG.WARNING_DEPTH;

  // Show ellipsis if path is too long
  const shouldShowEllipsis = breadcrumbPath.length > maxVisible;
  const visiblePath = shouldShowEllipsis 
    ? [
        breadcrumbPath[0], // Root
        { id: '...', title: '...', isRoot: false }, // Ellipsis
        ...breadcrumbPath.slice(-2) // Last 2 items
      ]
    : breadcrumbPath;

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const isEllipsis = item.id === '...';
    const isCurrent = item.id === currentNote.id;

    return (
      <View key={item.id} style={styles.breadcrumbItem}>
        {/* Item */}
        {isEllipsis ? (
          <Text style={styles.ellipsis}>...</Text>
        ) : (
          <TouchableOpacity
            onPress={() => !isCurrent && onNotePress(item.id)}
            disabled={isCurrent}
            style={[
              styles.breadcrumbButton,
              isCurrent && styles.currentBreadcrumb,
              item.isRoot && styles.rootBreadcrumb,
            ]}
          >
            {item.isRoot && (
              <Ionicons name="home" size={12} color={Colors.accent.darkBlue} style={styles.homeIcon} />
            )}
            <Text 
              style={[
                styles.breadcrumbText,
                isCurrent && styles.currentBreadcrumbText,
                item.isRoot && styles.rootBreadcrumbText,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}

        {/* Separator */}
        {!isLast && (
          <Ionicons 
            name="chevron-forward" 
            size={12} 
            color={Colors.neutral.mediumGray} 
            style={styles.separator}
          />
        )}
      </View>
    );
  };

  if (breadcrumbPath.length <= 1) {
    return null; // Don't show breadcrumb for root notes
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.breadcrumbContainer}
      >
        {visiblePath.map((item, index) => 
          renderBreadcrumbItem(item, index, index === visiblePath.length - 1)
        )}
      </ScrollView>
      
      {/* Hierarchy info */}
      <View style={styles.hierarchyInfo}>
        <Text style={styles.hierarchyText}>
          {depth}. seviye
        </Text>
        {isDeepHierarchy && (
          <Text style={styles.warningText}>
            ⚠️ Derin hiyerarşi ({depth}/{HIERARCHY_CONFIG.MAX_DEPTH})
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.neutral.lightGray1,
    maxWidth: 120,
  },
  currentBreadcrumb: {
    backgroundColor: Colors.accent.coral + '20',
  },
  rootBreadcrumb: {
    backgroundColor: Colors.accent.darkBlue + '15',
  },
  homeIcon: {
    marginRight: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: Colors.neutral.darkGray,
    fontWeight: '500',
  },
  currentBreadcrumbText: {
    color: Colors.accent.coral,
    fontWeight: '600',
  },
  rootBreadcrumbText: {
    color: Colors.accent.darkBlue,
    fontWeight: '600',
  },
  ellipsis: {
    fontSize: 12,
    color: Colors.neutral.mediumGray,
    paddingHorizontal: 8,
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 4,
  },
  hierarchyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 6,
    marginTop: 4,
  },
  hierarchyText: {
    fontSize: 12,
    color: Colors.neutral.darkGray,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 11,
    color: Colors.accent.coral,
    fontWeight: '600',
  },
});
