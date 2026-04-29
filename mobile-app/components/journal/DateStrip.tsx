import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DateStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysAroundDate(center: Date, range: number = 14): Date[] {
  const days: Date[] = [];
  for (let i = -range; i <= range; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export default function DateStrip({ selectedDate, onDateChange }: DateStripProps) {
  const days = getDaysAroundDate(selectedDate);
  const todayIndex = days.findIndex((d) => isToday(d));

  const goToPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatHeader = () => {
    if (isToday(selectedDate)) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(selectedDate, yesterday)) return 'Yesterday';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow';
    return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with arrows */}
      <View style={styles.header}>
        <Pressable onPress={goToPrevDay} style={styles.arrowBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color="#9ca3af" />
        </Pressable>

        <Pressable onPress={goToToday}>
          <Text style={styles.headerTitle}>{formatHeader()}</Text>
        </Pressable>

        <Pressable onPress={goToNextDay} style={styles.arrowBtn} hitSlop={12}>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Day strip */}
      <FlatList
        data={days}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={days.findIndex((d) => isSameDay(d, selectedDate))}
        getItemLayout={(_, index) => ({
          length: 52,
          offset: 52 * index,
          index,
        })}
        keyExtractor={(item) => item.toISOString()}
        contentContainerStyle={styles.stripContent}
        renderItem={({ item }) => {
          const selected = isSameDay(item, selectedDate);
          const today = isToday(item);

          return (
            <Pressable
              onPress={() => onDateChange(item)}
              style={[
                styles.dayItem,
                selected && styles.dayItemSelected,
              ]}
            >
              <Text style={[
                styles.dayName,
                selected && styles.dayNameSelected,
                today && !selected && styles.dayNameToday,
              ]}>
                {DAY_NAMES[item.getDay()]}
              </Text>
              <Text style={[
                styles.dayNumber,
                selected && styles.dayNumberSelected,
                today && !selected && styles.dayNumberToday,
              ]}>
                {item.getDate()}
              </Text>
              {today && <View style={[styles.todayDot, selected && styles.todayDotSelected]} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  arrowBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  stripContent: {
    paddingHorizontal: 12,
    gap: 4,
  },
  dayItem: {
    width: 48,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 4,
  },
  dayItemSelected: {
    backgroundColor: '#8b5cf6',
  },
  dayName: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNameSelected: {
    color: '#ffffff',
  },
  dayNameToday: {
    color: '#c77ffb',
  },
  dayNumber: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
  dayNumberToday: {
    color: '#c77ffb',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c77ffb',
    position: 'absolute',
    bottom: 6,
  },
  todayDotSelected: {
    backgroundColor: '#ffffff',
  },
});
