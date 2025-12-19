import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const StudentCoursesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('enrolled'); // 'available' or 'enrolled'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAvailableCourses(),
        loadEnrolledCourses()
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const response = await ApiService.getAvailableCoursesForStudent(
        user._id,
        user.department,
        user.intake
      );
      if (response.success) {
        setAvailableCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading available courses:', error);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      const response = await ApiService.getStudentEnrollments(user._id);
      if (response.success) {
        // Fetch attendance data for each enrolled course
        const enrollmentsWithAttendance = await Promise.all(
          response.enrollments.map(async (enrollment) => {
            try {
              const attendanceResponse = await ApiService.getStudentAllCoursesReport(user._id);
              if (attendanceResponse.success) {
                const courseAttendance = attendanceResponse.report.find(
                  courseReport => courseReport.courseId.toString() === enrollment.courseId.toString()
                );
                return {
                  ...enrollment,
                  attendanceMarks: courseAttendance ? courseAttendance.attendanceMarks : 0,
                  attendancePercentage: courseAttendance ? courseAttendance.attendancePercentage : '0'
                };
              }
            } catch (error) {
              console.error('Error loading attendance for course:', enrollment.courseName);
            }
            return {
              ...enrollment,
              attendanceMarks: 0,
              attendancePercentage: '0'
            };
          })
        );
        setEnrolledCourses(enrollmentsWithAttendance);
      }
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    }
  };

  const handleEnroll = async (course) => {
    Alert.alert(
      'Enroll in Course',
      `Are you sure you want to enroll in "${course.courseName}" (${course.courseCode})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: async () => {
            try {
              const enrollmentData = {
                studentId: user._id,
                courseId: course._id,
                studentName: user.name,
                studentEmail: user.email,
                studentCustomId: user.studentId, // Add the custom student ID
                courseCode: course.courseCode,
                courseName: course.courseName,
                department: user.department,
                intake: user.intake,
                section: user.section
              };
              
              const response = await ApiService.enrollStudent(enrollmentData);
              if (response.success) {
                Alert.alert('Success', 'Successfully enrolled in the course!');
                loadData(); // Refresh both lists
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to enroll in course');
            }
          },
        },
      ]
    );
  };

  const handleDrop = async (enrollment) => {
    Alert.alert(
      'Drop Course',
      `Are you sure you want to drop "${enrollment.courseName}" (${enrollment.courseCode})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Drop',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.dropEnrollment(enrollment._id);
              if (response.success) {
                Alert.alert('Success', 'Successfully dropped the course!');
                loadData(); // Refresh both lists
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to drop course');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleViewCourseDetails = (course) => {
    navigation.navigate('CourseDetail', { course });
  };

  const renderCourseCard = (course, isEnrolled = false) => (
    <TouchableOpacity 
      key={course._id} 
      style={styles.courseCard}
      onPress={() => handleViewCourseDetails(course)}
    >
      <View style={styles.courseInfo}>
        <Text style={styles.courseCode}>{course.courseCode}</Text>
        <Text style={styles.courseName}>{course.courseName}</Text>
        <Text style={styles.courseDetails}>
          Credits: {course.credits || 'N/A'} | Dept: {course.department}
        </Text>
        {course.semester && (
          <Text style={styles.courseDetails}>Semester: {course.semester}</Text>
        )}
        {course.teacherName && (
          <Text style={styles.teacherName}>Teacher: {course.teacherName}</Text>
        )}
        {course.description && (
          <Text style={styles.courseDescription}>{course.description}</Text>
        )}
        {isEnrolled && (
          <>
            <Text style={styles.enrolledDate}>
              Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
            </Text>
            <View style={styles.attendanceInfo}>
              <Text style={styles.attendanceMarks}>
                Attendance Marks: <Text style={styles.marksValue}>{course.attendanceMarks || 0}</Text>
              </Text>
              <Text style={styles.attendancePercentage}>
                Attendance: <Text style={styles.percentageValue}>{course.attendancePercentage || '0'}%</Text>
              </Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.courseActions}>
        <TouchableOpacity
          style={isEnrolled ? styles.dropButton : styles.enrollButton}
          onPress={(e) => {
            e.stopPropagation();
            isEnrolled ? handleDrop(course) : handleEnroll(course);
          }}
        >
          <Text style={styles.buttonText}>
            {isEnrolled ? '×' : '+'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Courses</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available ({availableCourses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>
            Enrolled ({enrolledCourses.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'available' ? (
          availableCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No available courses</Text>
              <Text style={styles.emptyStateSubtitle}>
                All courses in your department have been enrolled or no courses exist yet.
              </Text>
            </View>
          ) : (
            <View style={styles.courseList}>
              {availableCourses.map(course => renderCourseCard(course, false))}
            </View>
          )
        ) : (
          enrolledCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No enrolled courses</Text>
              <Text style={styles.emptyStateSubtitle}>
                You haven't enrolled in any courses yet.
              </Text>
            </View>
          ) : (
            <View style={styles.courseList}>
              {enrolledCourses.map(course => renderCourseCard(course, true))}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196f3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2196f3',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  courseList: {
    padding: 10,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  courseDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  courseDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  teacherName: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '500',
  },
  enrolledDate: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 5,
    fontWeight: '600',
  },
  attendanceInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  attendanceMarks: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  marksValue: {
    fontWeight: 'bold',
    color: '#ff9800',
  },
  attendancePercentage: {
    fontSize: 12,
    color: '#666',
  },
  percentageValue: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  courseActions: {
    marginLeft: 10,
  },
  enrollButton: {
    backgroundColor: '#4caf50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropButton: {
    backgroundColor: '#f44336',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
});

export default StudentCoursesScreen;

