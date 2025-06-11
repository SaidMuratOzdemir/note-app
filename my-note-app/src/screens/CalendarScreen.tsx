import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNotes } from '../services/storage';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/RootStack';

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;

const { width } = Dimensions.get('window');
const dayWidth = (width - 32) / 7; // 7 days in a week

export const CalendarScreen: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [noteDays, setNoteDays] = useState<Set<string>>(new Set());
  const navigation = useNavigation<CalendarScreenNavigationProp>();

  useEffect(() => {
    loadNoteDays();
  }, []);

  const loadNoteDays = async () => {
    const notes = await getNotes();
    const days = new Set(notes.map(note => note.createdAt.split('T')[0]));
    setNoteDays(days);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const onDatePress = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    navigation.navigate('DateNotes', { date: dateString });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasNotes = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return noteDays.has(dateString);
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
        
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendar}>
        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {weekDays.map(day => (
            <View key={day} style={styles.weekDayHeader}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar days */}
        <View style={styles.daysContainer}>
          {days.map((date, index) => (
            <View key={index} style={styles.dayContainer}>
              {date ? (
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    isToday(date) && styles.todayButton,
                    hasNotes(date) && styles.hasNotesButton,
                  ]}
                  onPress={() => onDatePress(date)}
                >
                  <Text style={[
                    styles.dayText,
                    isToday(date) && styles.todayText,
                    hasNotes(date) && styles.hasNotesText,
                  ]}>
                    {date.getDate()}
                  </Text>
                  {hasNotes(date) && <View style={styles.noteDot} />}
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyDay} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent.darkBlue }]} />
          <Text style={styles.legendText}>Bugün</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Not var</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  calendar: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeader: {
    width: dayWidth,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.placeholder,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: dayWidth,
    height: dayWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: dayWidth - 8,
    height: dayWidth - 8,
    borderRadius: (dayWidth - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayButton: {
    backgroundColor: Colors.accent.darkBlue,
  },
  hasNotesButton: {
    backgroundColor: Colors.success,
  },
  dayText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  hasNotesText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noteDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  emptyDay: {
    width: dayWidth - 8,
    height: dayWidth - 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: Colors.text,
  },
});
