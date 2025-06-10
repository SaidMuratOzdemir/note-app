import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';

const NOTES_KEY = 'notes';

export async function getNotes(): Promise<Note[]> {
  const json = await AsyncStorage.getItem(NOTES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function addNote(note: Note): Promise<void> {
  const notes = await getNotes();
  notes.push(note);
  await saveNotes(notes);
}

export async function updateNote(note: Note): Promise<void> {
  const notes = await getNotes();
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx !== -1) {
    notes[idx] = note;
    await saveNotes(notes);
  }
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  const filtered = notes.filter(n => n.id !== id);
  await saveNotes(filtered);
}
