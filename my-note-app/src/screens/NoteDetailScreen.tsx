import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Note } from '../types/Note';
import { getNotes, deleteNote } from '../services/storage';
import { TagPill } from '../components/TagPill';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/RootStack';

type NoteDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type NoteDetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export const NoteDetailScreen: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const navigation = useNavigation<NoteDetailScreenNavigationProp>();
  const route = useRoute<NoteDetailScreenRouteProp>();

  useEffect(() => {
    loadNote();
    setupHeaderButtons();
  }, []);

  const loadNote = async () => {
    const all = await getNotes();
    const foundNote = all.find(n => n.id === route.params.id);
    setNote(foundNote || null);
  };

  const setupHeaderButtons = () => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditNote', { id: route.params.id })} 
            style={styles.headerButton}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.headerButton}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Notu Sil',
      'Bu notu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    await deleteNote(route.params.id);
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const noteDate = dateString.split('T')[0];
    
    let datePrefix = '';
    if (noteDate === today) {
      datePrefix = 'Bugün, ';
    } else if (noteDate === yesterday) {
      datePrefix = 'Dün, ';
    } else {
      datePrefix = date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }) + ', ';
    }
    
    const time = date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return datePrefix + time;
  };

  if (!note) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Not bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {note.title && (
          <Text style={styles.title}>{note.title}</Text>
        )}
        
        <Text style={styles.time}>{formatDate(note.createdAt)}</Text>
        
        {note.imageUris && note.imageUris.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {note.imageUris.map((uri, index) => (
                <Image 
                  key={index} 
                  source={{ uri }} 
                  style={[styles.image, index > 0 && styles.imageMargin]} 
                  contentFit="cover" 
                />
              ))}
            </ScrollView>
          </View>
        )}
        
        <Text style={styles.noteContent}>{note.content}</Text>
        
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Etiketler:</Text>
            <View style={styles.tags}>
              {note.tags.map(tag => (
                <TagPill key={tag} label={`#${tag}`} />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.placeholder,
  },
  content: {
    padding: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 34,
  },
  time: { 
    fontSize: 14, 
    color: Colors.placeholder, 
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageMargin: {
    marginLeft: 12,
  },
  noteContent: { 
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 14,
    color: Colors.placeholder,
    marginBottom: 8,
    fontWeight: '500',
  },
  tags: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  editIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
