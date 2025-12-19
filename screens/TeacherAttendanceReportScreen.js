import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import ApiService from '../services/api';

const TeacherAttendanceReportScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const [step, setStep] = useState(1); // 1: Select filters, 2: Show report
  const [availableIntakes, setAvailableIntakes] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load available intakes and sections
      const intakesResponse = await ApiService.getAvailableIntakesAndSections(course._id);
      if (intakesResponse.success) {
        setAvailableIntakes(intakesResponse.intakes);
        setAvailableSections(intakesResponse.sections);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load initial data');
    }
  };

  const handleIntakeSelect = (intake) => {
    setSelectedIntake(intake);
    setSelectedSection(null);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
  };

  const generateReport = async () => {
    if (!selectedIntake || !selectedSection) {
      Alert.alert('Error', 'Please select intake and section');
      return;
    }

    try {
      setLoading(true);
      
      // Get total attendance for all dates (no month/year filter)
      const response = await ApiService.getTeacherAttendanceReportTotal(
        course._id,
        selectedIntake,
        selectedSection
      );

      if (response.success) {
        setReportData(response.report);
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#4caf50';
      case 'absent': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      default: return '❓';
    }
  };

  const renderFilterSelection = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Course Info */}
      <View style={styles.courseInfoCard}>
        <Text style={styles.courseCode}>{course.courseCode}</Text>
        <Text style={styles.courseName}>{course.courseName}</Text>
        <Text style={styles.reportTitle}>Attendance Report</Text>
      </View>

      {/* Intake Selection */}
      <View style={styles.selectionCard}>
        <Text style={styles.selectionTitle}>Select Intake *</Text>
        <View style={styles.selectionButtons}>
          {availableIntakes.map(intake => (
            <TouchableOpacity
              key={intake}
              style={[
                styles.selectionButton,
                selectedIntake === intake && styles.selectionButtonActive
              ]}
              onPress={() => handleIntakeSelect(intake)}
            >
              <Text style={[
                styles.selectionButtonText,
                selectedIntake === intake && styles.selectionButtonTextActive
              ]}>
                {intake}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section Selection */}
      {selectedIntake && (
        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>Select Section *</Text>
          <View style={styles.selectionButtons}>
            <TouchableOpacity
              style={[
                styles.selectionButton,
                !selectedSection && styles.selectionButtonActive
              ]}
              onPress={() => handleSectionSelect(null)}
            >
              <Text style={[
                styles.selectionButtonText,
                !selectedSection && styles.selectionButtonTextActive
              ]}>
                All Sections
              </Text>
            </TouchableOpacity>
            {availableSections.map(section => (
              <TouchableOpacity
                key={section}
                style={[
                  styles.selectionButton,
                  selectedSection === section && styles.selectionButtonActive
                ]}
                onPress={() => handleSectionSelect(section)}
              >
                <Text style={[
                  styles.selectionButtonText,
                  selectedSection === section && styles.selectionButtonTextActive
                ]}>
                  Section {section}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Generate Report Button */}
      {selectedIntake && selectedSection && (
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generateReport}
          disabled={loading}
        >
          <Text style={styles.generateButtonText}>
            {loading ? 'Generating...' : '📊 Generate Report'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // Filter report data by search query
  const filteredReportData = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    
    const query = searchQuery.toLowerCase();
            return reportData.filter(student => 
              student.studentName.toLowerCase().includes(query) ||
              (student.studentCustomId || '').toLowerCase().includes(query)
            );
  }, [reportData, searchQuery]);

  const renderReport = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Report Header */}
      <View style={styles.reportHeaderCard}>
        <Text style={styles.courseCode}>{course.courseCode}</Text>
        <Text style={styles.courseName}>{course.courseName}</Text>
        <Text style={styles.reportPeriod}>
          Total Attendance - {selectedIntake}
          {selectedSection && ` - Section ${selectedSection}`}
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Class Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredReportData.length}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#4caf50' }]}>
              {filteredReportData.filter(s => parseFloat(s.attendancePercentage) >= 75).length}
            </Text>
            <Text style={styles.statLabel}>Good Attendance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#f44336' }]}>
              {filteredReportData.filter(s => parseFloat(s.attendancePercentage) < 75).length}
            </Text>
            <Text style={styles.statLabel}>Poor Attendance</Text>
          </View>
        </View>
      </View>

      {/* Student Reports */}
      <View style={styles.studentsCard}>
        <Text style={styles.studentsTitle}>Student Attendance Details</Text>
        
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
        
        {filteredReportData.map((student, index) => (
          <View key={student.studentId} style={styles.studentReportCard}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{student.studentName}</Text>
                      <Text style={styles.studentId}>ID: {student.studentCustomId || 'N/A'}</Text>
            </View>
            
            <View style={styles.studentStats}>
              <View style={styles.studentStatItem}>
                <Text style={styles.studentStatNumber}>{student.totalDays}</Text>
                <Text style={styles.studentStatLabel}>Total Days</Text>
              </View>
              <View style={styles.studentStatItem}>
                <Text style={[styles.studentStatNumber, { color: '#4caf50' }]}>
                  {student.presentDays}
                </Text>
                <Text style={styles.studentStatLabel}>Present</Text>
              </View>
              <View style={styles.studentStatItem}>
                <Text style={[styles.studentStatNumber, { color: '#f44336' }]}>
                  {student.absentDays}
                </Text>
                <Text style={styles.studentStatLabel}>Absent</Text>
              </View>
              <View style={styles.studentStatItem}>
                <Text style={[
                  styles.studentStatNumber, 
                  { color: parseFloat(student.attendancePercentage) >= 75 ? '#4caf50' : '#f44336' }
                ]}>
                  {student.attendancePercentage}%
                </Text>
                <Text style={styles.studentStatLabel}>Attendance</Text>
              </View>
            </View>
            <View style={styles.studentMarksRow}>
              <View style={styles.studentMarksItem}>
                <Text style={[styles.studentMarksNumber, { color: '#ff9800' }]}>{student.attendanceMarks || 0}</Text>
                <Text style={styles.studentMarksLabel}>Marks (out of 5)</Text>
              </View>
            </View>

            {/* View Details Button */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('IndividualStudentReport', {
                student,
                course,
                selectedIntake,
                selectedSection
              })}
            >
              <Text style={styles.viewDetailsButtonText}>📋 View Full Attendance Details</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 2) {
              setStep(1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {step === 1 ? 'Attendance Report' : 'Report Results'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {step === 1 ? renderFilterSelection() : renderReport()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  scrollContainer: {
    flex: 1,
  },
  courseInfoCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectionCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  monthPicker: {
    marginTop: 10,
  },
  selectionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectionButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  selectionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectionButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#4caf50',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportHeaderCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportPeriod: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  studentsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  studentReportCard: {
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  studentHeader: {
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
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
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  studentStatItem: {
    alignItems: 'center',
  },
  studentStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  studentMarksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  studentMarksItem: {
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  studentMarksNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentMarksLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  dailyAttendance: {
    marginTop: 10,
  },
  dailyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    minWidth: 40,
  },
  dayDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dayStatus: {
    fontSize: 16,
  },
});

export default TeacherAttendanceReportScreen;

