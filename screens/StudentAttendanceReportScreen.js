import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const StudentAttendanceReportScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { course } = route.params;
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourseAttendance();
  }, []);

  const loadCourseAttendance = async () => {
    try {
      setLoading(true);
      console.log('🔍 StudentAttendanceReportScreen Debug:');
      console.log('  User ID:', user._id);
      console.log('  Course object:', course);
      console.log('  Course._id:', course._id);
      console.log('  Course.courseId:', course.courseId);
      
      const response = await ApiService.getStudentAllCoursesReport(user._id);
      
      console.log('  API Response:', response);
      
      if (response.success) {
        console.log('  Available courses in report:', response.report.map(r => ({
          courseId: r.courseId,
          courseName: r.courseName,
          courseIdType: typeof r.courseId
        })));
        
        // Find the attendance data for this specific course
        // For enrolled courses, we need to use course.courseId instead of course._id
        const courseIdToMatch = course.courseId || course._id;
        const courseAttendance = response.report.find(
          courseReport => courseReport.courseId.toString() === courseIdToMatch.toString()
        );
        
        console.log('  Course ID to match:', courseIdToMatch);
        console.log('  Found course attendance:', courseAttendance ? 'YES' : 'NO');
        
        if (courseAttendance) {
          setReportData(courseAttendance);
        } else {
          Alert.alert('No Data', 'No attendance data found for this course');
        }
      } else {
        Alert.alert('Error', 'Failed to load course attendance');
      }
    } catch (error) {
      console.error('Error loading course attendance:', error);
      Alert.alert('Error', error.message || 'Failed to load course attendance');
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

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      default: return 'Unknown';
    }
  };


  const renderReport = () => {
    if (!reportData) return null;

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Course Info */}
        <View style={styles.courseInfoCard}>
          <Text style={styles.courseCode}>{course.courseCode}</Text>
          <Text style={styles.courseName}>{course.courseName}</Text>
          <Text style={styles.reportPeriod}>Total Attendance</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Attendance Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reportData.totalDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4caf50' }]}>
                {reportData.presentDays}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f44336' }]}>
                {reportData.absentDays}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: parseFloat(reportData.attendancePercentage) >= 75 ? '#4caf50' : '#f44336' }
              ]}>
                {reportData.attendancePercentage}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
          <View style={styles.marksRow}>
            <View style={styles.marksItem}>
              <Text style={[styles.marksNumber, { color: '#ff9800' }]}>{reportData.attendanceMarks || 0}</Text>
              <Text style={styles.marksLabel}>Attendance Marks (out of 5)</Text>
            </View>
          </View>
        </View>

        {/* Attendance Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Attendance Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: parseFloat(reportData.attendancePercentage) >= 75 ? '#e8f5e8' : '#ffebee' }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: parseFloat(reportData.attendancePercentage) >= 75 ? '#2e7d32' : '#c62828' }
              ]}>
                {parseFloat(reportData.attendancePercentage) >= 75 ? 'Good Attendance' : 'Poor Attendance'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusMessage}>
            {parseFloat(reportData.attendancePercentage) >= 75 
              ? 'Great job! You have maintained good attendance overall.'
              : 'Your attendance is below 75%. Please try to attend classes regularly.'
            }
          </Text>
        </View>

        {/* Daily Attendance Details */}
        {reportData.attendance.length > 0 && (
          <View style={styles.dailyCard}>
            <Text style={styles.dailyTitle}>Daily Attendance Details</Text>
            {reportData.attendance.map((record, index) => (
              <View key={index} style={styles.dailyItem}>
                <View style={styles.dailyDate}>
                  <Text style={styles.dailyDateText}>
                    {new Date(record.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
                <View style={styles.dailyStatus}>
                  <Text style={styles.dailyStatusIcon}>
                    {getStatusIcon(record.status)}
                  </Text>
                  <Text style={[
                    styles.dailyStatusText,
                    { color: getStatusColor(record.status) }
                  ]}>
                    {getStatusText(record.status)}
                  </Text>
                </View>
                {record.notes && (
                  <View style={styles.dailyNotes}>
                    <Text style={styles.dailyNotesText}>{record.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* No Attendance Message */}
        {reportData.attendance.length === 0 && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataTitle}>No Attendance Records</Text>
            <Text style={styles.noDataMessage}>
              No attendance has been taken for this course yet.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Attendance</Text>
        <View style={styles.placeholder} />
      </View>

      {renderReport()}
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
  monthSelectionCard: {
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
  monthSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  monthPicker: {
    marginTop: 10,
  },
  monthButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  monthButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  monthButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  monthButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  courseInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
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
  reportPeriod: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  marksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  marksItem: {
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  marksNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  marksLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dailyCard: {
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
  dailyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dailyDate: {
    flex: 1,
  },
  dailyDateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dailyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dailyStatusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dailyStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dailyNotes: {
    flex: 2,
    marginLeft: 10,
  },
  dailyNotesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noDataCard: {
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
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  noDataMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StudentAttendanceReportScreen;

