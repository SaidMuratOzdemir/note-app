import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Note } from '../types/Note';
import { Colors, Typography, Layout } from '../theme';

interface Props {
  note: Note;
  index: number;
  onPress: () => void;
}

export const NoteCard: React.FC<Props> = ({ note, index, onPress }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const backgroundColor = Colors.primaryPastels[index % 4];

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header: Title + Timestamp */}
      <View style={styles.header}>
        {note.title && <Text style={styles.title}>{note.title}</Text>}
        <Text style={styles.timestamp}>{formatTime(note.createdAt)}</Text>
      </View>
      
      {/* Images Section */}
      {note.imageUris && note.imageUris.length > 0 && (
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
        numberOfLines={note.imageUris && note.imageUris.length > 0 ? 2 : 3}
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
});
