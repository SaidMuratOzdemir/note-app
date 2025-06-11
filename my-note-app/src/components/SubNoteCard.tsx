import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../theme';
import { Note } from '../types/Note';

interface SubNoteCardProps {
  note: Note;
  parentNote: Note;
  onPress: () => void;
  onLongPress?: () => void;
}

export const SubNoteCard: React.FC<SubNoteCardProps> = ({ 
  note, 
  parentNote,
  onPress, 
  onLongPress 
}) => {
  const hasImages = note.imageUris && note.imageUris.length > 0;
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* Sub-note indicator */}
      <View style={styles.indicator} />
      
      {/* Header with parent context */}
      <View style={styles.header}>
        <View style={styles.parentContext}>
          <Ionicons name="chevron-up" size={12} color={Colors.textGray} />
          <Text style={styles.parentTitle} numberOfLines={1}>
            {parentNote.title || 'Ana Not'}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(note.createdAt)}</Text>
      </View>
      
      {/* Sub-note title */}
      {note.title && (
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>
      )}
      
      {/* Content with limited lines when images present */}
      <Text 
        style={styles.content} 
        numberOfLines={hasImages ? 2 : 3}
      >
        {note.content}
      </Text>
      
      {/* Images preview (if any) */}
      {hasImages && (
        <View style={styles.imagesContainer}>
          <Image 
            source={{ uri: note.imageUris![0] }} 
            style={styles.previewImage}
            contentFit="cover"
          />
          {note.imageUris!.length > 1 && (
            <View style={styles.moreImagesIndicator}>
              <Text style={styles.moreImagesText}>
                +{note.imageUris!.length - 1}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Tags (simplified for sub-notes) */}
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{note.tags.length - 2}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.coral,
    marginLeft: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  indicator: {
    position: 'absolute',
    left: -3,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.accent.coral,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  parentContext: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentTitle: {
    ...Typography.caption,
    color: Colors.textGray,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    ...Typography.timestamp,
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: 4,
  },
  content: {
    ...Typography.body,
    color: Colors.neutral.darkGray,
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  moreImagesIndicator: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 4,
  },
  moreImagesText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Layout.tagGap,
  },
  tag: {
    backgroundColor: Colors.accent.coral + '30',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    ...Typography.tag,
    color: Colors.accent.darkBlue,
  },
  moreTagsText: {
    ...Typography.caption,
    color: Colors.textGray,
    fontWeight: '600',
  },
});
