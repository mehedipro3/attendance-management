import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';

const DatePicker = ({ selectedDate, onDateSelect, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Generate dates (current date and all past dates) - memoized for performance
  const dates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(2024, 0, 1); // Start from January 1, 2024
    
    // Generate all dates from start date to today
    const currentDate = new Date(today);
    while (currentDate >= startDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return dates;
  }, []); // Empty dependency array means this only runs once

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const handleDateSelect = (date) => {
    onDateSelect(date);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dateButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.dateButtonText, disabled && styles.disabledText]}>
          📅 {formatDateForDisplay(selectedDate)}
        </Text>
        <Text style={[styles.arrow, disabled && styles.disabledText]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
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
            
            <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
              {dates.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateItem,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateItem,
                    isToday(date) && styles.todayDateItem
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[
                    styles.dateItemText,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateItemText,
                    isToday(date) && styles.todayDateItemText
                  ]}>
                    {formatDate(date)}
                    {isToday(date) && ' (Today)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    borderColor: '#ced4da',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  disabledText: {
    color: '#6c757d',
  },
  arrow: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
  },
  dateList: {
    maxHeight: 300,
  },
  dateItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectedDateItem: {
    backgroundColor: '#007bff',
  },
  todayDateItem: {
    backgroundColor: '#e3f2fd',
  },
  dateItemText: {
    fontSize: 16,
    color: '#495057',
  },
  selectedDateItemText: {
    color: 'white',
    fontWeight: '600',
  },
  todayDateItemText: {
    color: '#1976d2',
    fontWeight: '500',
  },
});

export default DatePicker;
