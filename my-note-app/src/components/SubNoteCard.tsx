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
      
      {/* Content with adjusted lines based on media */}
      <Text 
        style={styles.content} 
        numberOfLines={hasImages ? 1 : 2}
      >
        {note.content}
      </Text>
      
      {/* Images preview (if any) - show more images */}
      {hasImages && (
        <View style={styles.imagesContainer}>
          {note.imageUris!.slice(0, 2).map((uri, index) => (
            <Image 
              key={index}
              source={{ uri }} 
              style={styles.previewImage}
              contentFit="cover"
            />
          ))}
          {note.imageUris!.length > 2 && (
            <View style={styles.moreImagesIndicator}>
              <Text style={styles.moreImagesText}>
                +{note.imageUris!.length - 2}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Tags - show more tags */}
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 4).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 4 && (
            <Text style={styles.moreTagsText}>+{note.tags.length - 4}</Text>
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
    gap: 6,
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  moreImagesIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    backgroundColor: Colors.neutral.lightGray1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray2,
  },
  moreImagesText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textGray,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.accent.coral + '25',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    ...Typography.tag,
    color: Colors.accent.darkBlue,
    fontSize: 11,
    fontWeight: '500',
  },
  moreTagsText: {
    ...Typography.caption,
    color: Colors.textGray,
    fontWeight: '600',
    fontSize: 11,
  },
});
