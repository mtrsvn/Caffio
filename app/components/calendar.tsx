import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import HapticTouchable from './_HapticTouchable';
import colors, { neu } from './colors';

interface Props {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  loggedDates?: Set<string>;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CustomCalendar({ onSelectDate, selectedDate, loggedDates }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    d.setDate(1);
    return d;
  });

  const [showPicker, setShowPicker] = useState(false);

  const now = useMemo(() => new Date(), []);
  const isPresentOrFutureMonth = currentMonth.getFullYear() > now.getFullYear() || 
    (currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() >= now.getMonth());
  const isPresentOrFutureYear = currentMonth.getFullYear() >= now.getFullYear();

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  };

  const selectMonth = (mIndex: number) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(mIndex);
      return next;
    });
    setShowPicker(false);
  };

  const adjustYear = (delta: number) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setFullYear(prev.getFullYear() + delta);
      return next;
    });
  };

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInThisMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const monthName = MONTHS[currentMonth.getMonth()];
  const yearName = currentMonth.getFullYear();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HapticTouchable onPress={prevMonth} style={styles.navButton}>
          <ChevronLeft color={colors.accent} size={22} />
        </HapticTouchable>
        
        <HapticTouchable onPress={() => setShowPicker(true)} style={styles.titleBtn}>
          <CalendarIcon color={colors.accent} size={18} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>{monthName} {yearName}</Text>
        </HapticTouchable>

        <HapticTouchable 
          onPress={!isPresentOrFutureMonth ? nextMonth : undefined} 
          style={[styles.navButton, isPresentOrFutureMonth && { opacity: 0.3 }]}
        >
          <ChevronRight color={colors.accent} size={22} />
        </HapticTouchable>
      </View>

      {/* Days of Week */}
      <View style={styles.dowRow}>
        {DAYS_OF_WEEK.map(day => (
          <Text key={day} style={styles.dowText}>{day}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {daysInMonth.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const isSelected = selectedDate && 
            day.getDate() === selectedDate.getDate() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getFullYear() === selectedDate.getFullYear();

          const isToday = new Date().getDate() === day.getDate() &&
            new Date().getMonth() === day.getMonth() &&
            new Date().getFullYear() === day.getFullYear();

          const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const hasLog = loggedDates?.has(dateKey);

          return (
            <View key={day.toISOString()} style={styles.dayCell}>
              <HapticTouchable 
                onPress={() => onSelectDate(day)}
                style={[
                  styles.dayButton,
                  isSelected ? styles.daySelected : styles.dayUnselected,
                  isToday && !isSelected && styles.dayToday,
                  hasLog && !isSelected && styles.dayWithLog
                ]}
              >
                <Text style={[
                  styles.dayText, 
                  isSelected && styles.textSelected,
                  isToday && !isSelected && styles.textToday,
                  hasLog && !isSelected && styles.textWithLog
                ]}>
                  {day.getDate()}
                </Text>
              </HapticTouchable>
            </View>
          );
        })}
      </View>

      {/* Month/Year Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Month & Year</Text>
            
            <View style={styles.yearRow}>
              <HapticTouchable onPress={() => adjustYear(-1)} style={styles.navButton}>
                <ChevronLeft color={colors.accent} size={22} />
              </HapticTouchable>
              <Text style={styles.yearText}>{yearName}</Text>
              <HapticTouchable 
                onPress={!isPresentOrFutureYear ? () => adjustYear(1) : undefined} 
                style={[styles.navButton, isPresentOrFutureYear && { opacity: 0.3 }]}
              >
                <ChevronRight color={colors.accent} size={22} />
              </HapticTouchable>
            </View>

            <View style={styles.monthGrid}>
              {MONTHS.map((m, i) => {
                const isCurrent = i === currentMonth.getMonth();
                const isFutureMonth = currentMonth.getFullYear() >= now.getFullYear() && i > now.getMonth();
                return (
                  <HapticTouchable
                    key={m}
                    onPress={!isFutureMonth ? () => selectMonth(i) : undefined}
                    style={[
                      styles.monthBtn, 
                      isCurrent && styles.monthBtnSelected,
                      isFutureMonth && { opacity: 0.3 }
                    ]}
                  >
                    <Text style={[styles.monthText, isCurrent && styles.monthTextSelected]}>
                      {m.substring(0, 3)}
                    </Text>
                  </HapticTouchable>
                );
              })}
            </View>

            <HapticTouchable style={styles.closeBtn} onPress={() => setShowPicker(false)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </HapticTouchable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EDE8E2',
    ...Platform.select({
      ios: {
        shadowColor: '#C8BEB4',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8E2',
    ...Platform.select({
      ios: {
        shadowColor: '#C8BEB4',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100 / 7
    aspectRatio: 1,
    padding: 6,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EDE8E2',
  },
  dayUnselected: {
    ...Platform.select({
      ios: {
        shadowColor: '#C8BEB4',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.accentLight,
    backgroundColor: '#F8F5F1',
  },
  dayWithLog: {
    backgroundColor: '#CBBBAF',
    borderWidth: 1,
    borderColor: '#BCAAA4',
  },
  daySelected: {
    backgroundColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  textWithLog: {
    color: colors.accent,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentLight,
    position: 'absolute',
    bottom: 6,
  },
  dotSelected: {
    backgroundColor: '#FFFFFF',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#EDE8E2',
    borderRadius: 24,
    padding: 24,
    ...neu.raised,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthBtn: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#EDE8E2',
    ...Platform.select({
      ios: {
        shadowColor: '#C8BEB4',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  monthBtnSelected: {
    ...neu.pressed,
    backgroundColor: '#E4DED7',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  monthTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  }
});
