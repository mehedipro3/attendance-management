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

const TeacherStudentsScreen = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCourses(),
        loadEnrollments()
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await ApiService.getCoursesByTeacher(user._id);
      if (response.success) {
        setCourses(response.courses);
        if (response.courses.length > 0) {
          setSelectedCourse(response.courses[0]._id);
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadEnrollments = async () => {
    try {
      const response = await ApiService.getTeacherEnrollments(user._id);
      if (response.success) {
        setEnrollments(response.enrollments);
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getEnrollmentsForSelectedCourse = () => {
    if (!selectedCourse) return [];
    return enrollments.filter(enrollment => enrollment.courseId === selectedCourse);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    return course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course';
  };

  const renderStudentCard = (enrollment) => (
    <View key={enrollment._id} style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{enrollment.studentName}</Text>
        <Text style={styles.studentEmail}>{enrollment.studentEmail}</Text>
        <Text style={styles.studentDetails}>
          Dept: {enrollment.department} | Intake: {enrollment.intake}
        </Text>
        <Text style={styles.enrolledDate}>
          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading students...</Text>
      </View>
    );
  }

  const filteredEnrollments = getEnrollmentsForSelectedCourse();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Students</Text>
      </View>

      {courses.length > 0 && (
        <View style={styles.courseSelector}>
          <Text style={styles.selectorLabel}>Select Course:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {courses.map(course => (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.courseButton,
                  selectedCourse === course._id && styles.selectedCourseButton
                ]}
                onPress={() => setSelectedCourse(course._id)}
              >
                <Text style={[
                  styles.courseButtonText,
                  selectedCourse === course._id && styles.selectedCourseButtonText
                ]}>
                  {course.courseCode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedCourse ? (
          <>
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>
                {getCourseName(selectedCourse)}
              </Text>
              <Text style={styles.studentCount}>
                {filteredEnrollments.length} student(s) enrolled
              </Text>
            </View>

            {filteredEnrollments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No students enrolled</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No students have enrolled in this course yet.
                </Text>
              </View>
            ) : (
              <View style={styles.studentList}>
                {filteredEnrollments.map(enrollment => renderStudentCard(enrollment))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No courses available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create some courses first to see enrolled students.
            </Text>
          </View>
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
  courseSelector: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  courseButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCourseButton: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  courseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCourseButtonText: {
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  courseInfo: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studentCount: {
    fontSize: 14,
    color: '#666',
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
  studentList: {
    padding: 10,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  enrolledDate: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
});

export default TeacherStudentsScreen;


