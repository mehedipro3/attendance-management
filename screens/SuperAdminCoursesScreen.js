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

const SuperAdminCoursesScreen = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'CSE', 'EEE', etc.

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAllCourses();
      if (response.success) {
        setCourses(response.courses);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${courseName}"? This will also remove all student enrollments for this course.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteCourse(courseId);
              if (response.success) {
                Alert.alert('Success', 'Course deleted successfully!');
                loadCourses(); // Refresh the list
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const getFilteredCourses = () => {
    if (filter === 'all') return courses;
    return courses.filter(course => course.department === filter);
  };

  const getDepartments = () => {
    const departments = [...new Set(courses.map(course => course.department))];
    return departments.sort();
  };

  const renderCourseCard = (course) => (
    <View key={course._id} style={styles.courseCard}>
      <View style={styles.courseInfo}>
        <Text style={styles.courseCode}>{course.courseCode}</Text>
        <Text style={styles.courseName}>{course.courseName}</Text>
        <Text style={styles.courseDetails}>
          {course.credits} Credits • {course.department} • {course.semester}
        </Text>
        <Text style={styles.teacherInfo}>
          Teacher: {course.teacherName} ({course.teacherId})
        </Text>
        {course.description && (
          <Text style={styles.courseDescription}>{course.description}</Text>
        )}
        <Text style={styles.createdDate}>
          Created: {new Date(course.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.courseActions}>
        <View style={styles.courseStatus}>
          <View style={[styles.statusBadge, course.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, course.isActive ? styles.activeText : styles.inactiveText]}>
              {course.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCourse(course._id, course.courseName)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading courses...</Text>
      </View>
    );
  }

  const filteredCourses = getFilteredCourses();
  const departments = getDepartments();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.title}>All Courses</Text>
        <Text style={styles.courseCount}>{filteredCourses.length} Course(s)</Text>
      </View>

      {/* Department Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({courses.length})
            </Text>
          </TouchableOpacity>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[styles.filterButton, filter === dept && styles.activeFilter]}
              onPress={() => setFilter(dept)}
            >
              <Text style={[styles.filterText, filter === dept && styles.activeFilterText]}>
                {dept} ({courses.filter(c => c.department === dept).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {filter === 'all' ? 'No courses found' : `No courses in ${filter} department`}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {filter === 'all' 
                ? 'No courses have been created yet.' 
                : 'No courses have been created in this department yet.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.courseList}>
            {filteredCourses.map(course => renderCourseCard(course))}
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
  courseCount: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
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
    alignItems: 'flex-start',
    minHeight: 120,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseActions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
    paddingTop: 5,
  },
  courseInfo: {
    flex: 1,
    paddingRight: 15,
    paddingTop: 5,
    maxHeight: 180,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    flexWrap: 'wrap',
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  courseDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  teacherInfo: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  courseDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  createdDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  courseStatus: {
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4caf50',
  },
  inactiveBadge: {
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeText: {
    color: 'white',
  },
  inactiveText: {
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SuperAdminCoursesScreen;
