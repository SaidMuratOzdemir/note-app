import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Note } from '../types/Note';
import { TagPill } from './TagPill';
import { colors } from '../theme/colors';

interface Props {
  note: Note;
  onPress: () => void;
}

const cardColors = [colors.card, colors.cardAlt, colors.success, colors.warning];

export const NoteCard: React.FC<Props> = ({ note, onPress }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Use note ID hash to consistently pick a color
  const colorIndex = note.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % cardColors.length;
  const cardColor = cardColors[colorIndex];

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: cardColor }]}>
      {note.title && <Text style={styles.title}>{note.title}</Text>}
      
      <Text style={styles.time}>{formatTime(note.createdAt)}</Text>
      
      {note.imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: note.imageUri }} style={styles.image} contentFit="cover" />
        </View>
      )}
      
      <Text numberOfLines={note.imageUri ? 2 : 3} style={styles.content}>
        {note.content}
      </Text>
      
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.slice(0, 3).map(tag => (
            <TagPill key={tag} label={`#${tag}`} />
          ))}
          {note.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  time: { 
    fontSize: 12, 
    color: '#666',
    marginBottom: 8,
  },
  imageContainer: {
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  content: { 
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  tags: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
});
