import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const CalendarDatePicker = ({ 
  selectedDate, 
  onDateSelect, 
  disabled = false,
  existingAttendanceDates = [],
  selectedIntake = null,
  selectedSection = null
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Generate all dates (today and past dates)
  const allDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    // Generate dates from 30 days ago to today
    for (let i = 0; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  }, []);

  // Check if a date has attendance recorded
  const hasAttendanceRecorded = useCallback((date) => {
    if (!selectedIntake || !selectedSection) return false;
    const dateString = date.toISOString().split('T')[0];
    return existingAttendanceDates.includes(dateString);
  }, [selectedIntake, selectedSection, existingAttendanceDates]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDatePress = (date) => {
    onDateSelect(date);
    setIsVisible(false);
  };

  const handleDateButtonPress = () => {
    if (disabled) return;
    
    if (!selectedIntake || !selectedSection) {
      Alert.alert(
        'Select Filters First',
        'Please select intake and section before choosing a date',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dateButton, disabled && styles.disabledButton]}
        onPress={handleDateButtonPress}
        disabled={disabled}
      >
        <Text style={styles.dateButtonText}>
          📅 {formatDateForDisplay(selectedDate)}
        </Text>
        <Text style={styles.dateButtonSubtext}>
          {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
        </Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.helpText}>
              Select a date to take attendance. Dates with "Recorded" already have attendance.
            </Text>
            
            <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
              {allDates.map((date, index) => {
                const hasRecorded = hasAttendanceRecorded(date);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateOption,
                      isToday(date) && styles.todayOption,
                      hasRecorded && styles.recordedOption,
                      date.toDateString() === selectedDate.toDateString() && styles.selectedOption,
                    ]}
                    onPress={() => handleDatePress(date)}
                    disabled={false} // Allow selection of all dates
                  >
                    <Text style={[
                      styles.dateOptionText,
                      isToday(date) && styles.todayOptionText,
                      hasRecorded && styles.recordedOptionText,
                      date.toDateString() === selectedDate.toDateString() && styles.selectedOptionText,
                    ]}>
                      {formatDate(date)}
                    </Text>
                    <View style={styles.dateLabels}>
                      {isToday(date) && (
                        <Text style={styles.todayLabel}>Today</Text>
                      )}
                      {hasRecorded && (
                        <Text style={styles.recordedLabel}>Recorded</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007bff',
    alignItems: 'center',
    minWidth: 160,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  dateButtonSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    maxHeight: '70%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6c757d',
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
  },
  todayOption: {
    backgroundColor: '#e3f2fd',
  },
  todayOptionText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  dateLabels: {
    flexDirection: 'row',
    gap: 5,
  },
  todayLabel: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    backgroundColor: '#bbdefb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recordedOption: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  recordedOptionText: {
    color: '#856404',
  },
  recordedLabel: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    backgroundColor: '#ffeaa7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: '#28a745',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CalendarDatePicker;
