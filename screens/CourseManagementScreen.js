import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const CourseManagementScreen = ({ navigation }) => {
  const { user, isSuperAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    courseCode: '',
    courseName: '',
    credits: '3',
    description: '',
    semester: 'Fall 2024'
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      let response;
      if (isSuperAdmin) {
        // Super admin can see all courses
        response = await ApiService.getAllCourses();
      } else {
        // Teachers see only their courses
        response = await ApiService.getCoursesByTeacher(user._id);
      }
      
      if (response.success) {
        setCourses(response.courses);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async () => {
    if (!courseData.courseCode || !courseData.courseName) {
      Alert.alert('Error', 'Please fill in course code and name');
      return;
    }

    try {
      const response = await ApiService.createCourse({
        ...courseData,
        teacherId: user._id,
        teacherName: user.name,
        department: user.department,
        credits: parseInt(courseData.credits)
      });
      
      if (response.success) {
        Alert.alert('Success', 'Course created successfully');
        setShowCreateCourse(false);
        setCourseData({
          courseCode: '',
          courseName: '',
          credits: '3',
          description: '',
          semester: 'Fall 2024'
        });
        loadCourses();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create course');
    }
  };

  const deleteCourse = async (courseId, courseName) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${courseName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteCourse(courseId);
              if (response.success) {
                Alert.alert('Success', 'Course deleted successfully');
                loadCourses();
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete course');
            }
          }
        }
      ]
    );
  };

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetail', { course: item })}
    >
      <View style={styles.courseInfo}>
        <Text style={styles.courseCode}>{item.courseCode}</Text>
        <Text style={styles.courseName}>{item.courseName}</Text>
        <Text style={styles.courseDetails}>
          {item.credits} Credits • {item.department} • {item.semester}
        </Text>
        {item.description && (
          <Text style={styles.courseDescription}>{item.description}</Text>
        )}
      </View>
      <View style={styles.courseActions}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteCourse(item._id, item.courseName);
          }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
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
        <Text style={styles.title}>
          {isSuperAdmin ? 'All Courses' : 'Course Management'}
        </Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateCourse(true)}
        >
          <Text style={styles.createButtonIcon}>📚</Text>
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.departmentInfo}>
          <Text style={styles.departmentTitle}>
            {isSuperAdmin ? 'All Departments' : `Department: ${user.department}`}
          </Text>
          <Text style={styles.courseCount}>{courses.length} Course(s)</Text>
        </View>

        <View style={styles.courseList}>
          {courses.map((course) => (
            <View key={course._id}>
              {renderCourseItem({ item: course })}
            </View>
          ))}
        </View>

        {courses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Courses Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first course to get started with teaching
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateCourse}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateCourse(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Course</Text>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputContainer}>
              <Text style={styles.label}>Course Code</Text>
              <TextInput
                style={styles.input}
                value={courseData.courseCode}
                onChangeText={(text) => setCourseData({...courseData, courseCode: text})}
                placeholder="e.g., CSE101"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Course Name</Text>
              <TextInput
                style={styles.input}
                value={courseData.courseName}
                onChangeText={(text) => setCourseData({...courseData, courseName: text})}
                placeholder="e.g., Introduction to Programming"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Credits</Text>
              <TextInput
                style={styles.input}
                value={courseData.credits}
                onChangeText={(text) => setCourseData({...courseData, credits: text})}
                placeholder="3"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Semester</Text>
              <TextInput
                style={styles.input}
                value={courseData.semester}
                onChangeText={(text) => setCourseData({...courseData, semester: text})}
                placeholder="Fall 2024"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={courseData.description}
                onChangeText={(text) => setCourseData({...courseData, description: text})}
                placeholder="Course description..."
                multiline
                numberOfLines={3}
              />
            </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateCourse(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={createCourse}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  createButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  departmentInfo: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  departmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  courseCount: {
    fontSize: 14,
    color: '#666',
  },
  courseList: {
    paddingHorizontal: 20,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  courseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  courseActions: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    paddingBottom: 30,
    width: '90%',
    maxHeight: '80%',
    minHeight: 400,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
});

export default CourseManagementScreen;
