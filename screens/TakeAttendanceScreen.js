import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import CalendarDatePicker from '../components/CalendarDatePicker';

const TakeAttendanceScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { course } = route.params;
  
  // Core state - minimal and optimized
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(false);
  const [existingAttendanceDates, setExistingAttendanceDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Memoized date string for performance
  const dateString = useMemo(() => 
    selectedDate.toISOString().split('T')[0], [selectedDate]
  );

  // Memoized available intakes and sections from students
  const { intakes, sections } = useMemo(() => {
    const uniqueIntakes = [...new Set(students.map(s => s.intake))].filter(Boolean);
    const uniqueSections = [...new Set(students.map(s => s.section))].filter(Boolean);
    return { intakes: uniqueIntakes, sections: uniqueSections };
  }, [students]);

  // Load students once on mount - single API call
  useEffect(() => {
    loadStudents();
  }, []);

  // Load existing attendance dates when filters change
  useEffect(() => {
    if (selectedIntake && selectedSection) {
      loadExistingAttendanceDates();
    } else {
      setExistingAttendance(false);
      setExistingAttendanceDates([]);
    }
  }, [selectedIntake, selectedSection]);

  // Check existing attendance for current date when dates are loaded
  useEffect(() => {
    if (selectedIntake && selectedSection && existingAttendanceDates.length >= 0) {
      checkExistingAttendance();
    }
  }, [existingAttendanceDates, dateString, selectedIntake, selectedSection]);

  // Single API call to load all students
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiService.getCourseEnrollmentsFast(course._id);
      if (response.success) {
        setStudents(response.enrollments);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [course._id]);

  // Filter students locally - no API calls
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedIntake && student.intake !== selectedIntake) return false;
      if (selectedSection && student.section !== selectedSection) return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          student.studentName.toLowerCase().includes(query) ||
          (student.studentCustomId || '').toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [students, selectedIntake, selectedSection, searchQuery]);

  // Load all existing attendance dates for the selected intake/section
  const loadExistingAttendanceDates = useCallback(async () => {
    try {
      const response = await ApiService.getCourseAttendance(course._id);
      if (response.success) {
        const dates = response.attendance
          .filter(record => 
            record.intake === selectedIntake && 
            record.section === selectedSection
          )
          .map(record => record.date);
        setExistingAttendanceDates(dates);
        
        // Immediately check if today's date has attendance recorded
        const todayString = new Date().toISOString().split('T')[0];
        const hasTodayAttendance = dates.includes(todayString);
        setExistingAttendance(hasTodayAttendance);
      }
    } catch (error) {
      console.error('Error loading attendance dates:', error);
      setExistingAttendanceDates([]);
      setExistingAttendance(false);
    }
  }, [course._id, selectedIntake, selectedSection]);

  // Check existing attendance for specific date - optimized query
  const checkExistingAttendance = useCallback(() => {
    try {
      const hasAttendance = existingAttendanceDates.includes(dateString);
      setExistingAttendance(hasAttendance);
    } catch (error) {
      console.error('Error checking attendance:', error);
      setExistingAttendance(false);
    }
  }, [existingAttendanceDates, dateString]);

  // Handle intake selection
  const handleIntakeSelect = useCallback((intake) => {
    setSelectedIntake(intake);
    setSelectedSection(null);
    setAttendanceData({});
  }, []);

  // Handle section selection
  const handleSectionSelect = useCallback((section) => {
    setSelectedSection(section);
    setAttendanceData({});
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setAttendanceData({});
  }, []);

  // Handle student attendance change
  const handleStudentAttendance = useCallback((studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  }, []);

  // Submit attendance - single optimized API call
  const handleSubmitAttendance = useCallback(async () => {
    if (existingAttendance) {
      Alert.alert('Error', 'Attendance already recorded for this date and section');
      return;
    }

    if (filteredStudents.length === 0) {
      Alert.alert('Error', 'No students found for the selected filters');
      return;
    }

    try {
      setLoading(true);
      
      const submissionData = {
        courseId: course._id,
        date: dateString,
        intake: selectedIntake,
        section: selectedSection,
        students: attendanceData,
        takenBy: user._id
      };

      const response = await ApiService.takeAttendance(submissionData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          `Attendance recorded for ${response.created} students`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // Handle specific error messages
        const errorMessage = response.message || response.errors?.[0] || 'Failed to record attendance';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  }, [existingAttendance, filteredStudents, attendanceData, user._id, course._id, dateString, selectedIntake, selectedSection, navigation]);

  // Render date picker - calendar modal
  const renderDatePicker = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <CalendarDatePicker
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        disabled={!selectedIntake || !selectedSection}
        existingAttendanceDates={existingAttendanceDates}
        selectedIntake={selectedIntake}
        selectedSection={selectedSection}
      />
      {existingAttendance && (
        <Text style={styles.warningText}>
          ⚠️ Attendance already recorded for this date
        </Text>
      )}
    </View>
  );

  // Render intake selector
  const renderIntakeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Intake</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {intakes.map(intake => (
          <TouchableOpacity
            key={intake}
            style={[
              styles.selectorButton,
              selectedIntake === intake && styles.selectorButtonActive
            ]}
            onPress={() => handleIntakeSelect(intake)}
          >
            <Text style={[
              styles.selectorButtonText,
              selectedIntake === intake && styles.selectorButtonTextActive
            ]}>
              {intake}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render section selector
  const renderSectionSelector = () => {
    if (!selectedIntake) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sections.map(section => (
            <TouchableOpacity
              key={section}
              style={[
                styles.selectorButton,
                selectedSection === section && styles.selectorButtonActive
              ]}
              onPress={() => handleSectionSelect(section)}
            >
              <Text style={[
                styles.selectorButtonText,
                selectedSection === section && styles.selectorButtonTextActive
              ]}>
                Section {section}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render student list - using ScrollView instead of FlatList to avoid nesting
  const renderStudentList = () => {
    if (!selectedIntake || !selectedSection) return null;

    const renderStudentItem = (student) => (
      <View key={student.studentId} style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.studentName}</Text>
                      <Text style={styles.studentId}>ID: {student.studentCustomId || 'N/A'}</Text>
        </View>
        <View style={styles.attendanceButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              attendanceData[student.studentId] === 'present' && styles.statusButtonActive
            ]}
            onPress={() => handleStudentAttendance(student.studentId, 'present')}
          >
            <Text style={[
              styles.statusButtonText,
              attendanceData[student.studentId] === 'present' && styles.statusButtonTextActive
            ]}>
              Present
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              attendanceData[student.studentId] === 'absent' && styles.statusButtonActive
            ]}
            onPress={() => handleStudentAttendance(student.studentId, 'absent')}
          >
            <Text style={[
              styles.statusButtonText,
              attendanceData[student.studentId] === 'absent' && styles.statusButtonTextActive
            ]}>
              Absent
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Students ({filteredStudents.length})
        </Text>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.studentList}>
          {filteredStudents.map(renderStudentItem)}
        </View>
      </View>
    );
  };

  if (loading && students.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.courseCode}>{course.courseCode}</Text>
          <Text style={styles.courseName}>{course.courseName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderDatePicker()}
        {renderIntakeSelector()}
        {renderSectionSelector()}
        {renderStudentList()}

      </ScrollView>

      {/* Submit Button */}
      {selectedIntake && selectedSection && filteredStudents.length > 0 && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton, 
              (loading || existingAttendance) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitAttendance}
            disabled={loading || existingAttendance}
          >
            <Text style={[
              styles.submitButtonText,
              existingAttendance && styles.submitButtonTextDisabled
            ]}>
              {loading ? 'Recording...' : 
               existingAttendance ? 'Attendance Already Recorded' :
               `Record Attendance (${Object.keys(attendanceData).length}/${filteredStudents.length})`}
            </Text>
          </TouchableOpacity>
          {existingAttendance && (
            <Text style={styles.submitHelpText}>
              Attendance has already been recorded for this date and section
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 80, // Same width as back button to center the content
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  courseName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 30,
    paddingBottom: 120, // Extra padding for submit button
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  warningText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  selectorButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  selectorButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  selectorButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectorButtonTextActive: {
    color: 'white',
  },
  studentList: {
    // No height constraint needed since we're using ScrollView
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  statusButtonActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: 'white',
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40, // Extra padding for safe area
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#adb5bd',
  },
  submitHelpText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
});

export default TakeAttendanceScreen;
