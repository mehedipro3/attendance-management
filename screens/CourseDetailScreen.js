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

const CourseDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { course } = route.params;
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableIntakes, setAvailableIntakes] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEnrollments();
  }, []);

  useEffect(() => {
    // Check if we need to refresh attendance data
    if (route.params?.refreshAttendance) {
      loadEnrollments();
      // Clear the refresh flag
      navigation.setParams({ refreshAttendance: false });
    }
  }, [route.params?.refreshAttendance]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getCourseEnrollments(course._id);
      if (response.success) {
        setEnrollments(response.enrollments);
        setFilteredEnrollments(response.enrollments);
        
        // Get available intakes and sections
        try {
          const intakesResponse = await ApiService.getAvailableIntakesAndSections(course._id);
          if (intakesResponse.success) {
            setAvailableIntakes(intakesResponse.intakes);
            setAvailableSections(intakesResponse.sections);
            console.log('Loaded intakes:', intakesResponse.intakes);
            console.log('Loaded sections:', intakesResponse.sections);
          } else {
            console.log('Failed to load intakes/sections:', intakesResponse.error);
          }
        } catch (intakesError) {
          console.log('Error loading intakes/sections:', intakesError.message);
          // Fallback: extract intakes and sections from enrollments
          const intakes = [...new Set(response.enrollments.map(e => e.intake).filter(Boolean))];
          const sections = [...new Set(response.enrollments.map(e => e.section).filter(Boolean))];
          setAvailableIntakes(intakes);
          setAvailableSections(sections);
          console.log('Using fallback intakes:', intakes);
          console.log('Using fallback sections:', sections);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load enrolled students');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEnrollments();
    setRefreshing(false);
  };

  const filterEnrollments = (intake, section) => {
    let filtered = enrollments;
    
    if (intake) {
      filtered = filtered.filter(enrollment => enrollment.intake === intake);
    }
    
    if (section) {
      filtered = filtered.filter(enrollment => enrollment.section === section);
    }
    
    setFilteredEnrollments(filtered);
  };

  const handleIntakeSelect = (intake) => {
    setSelectedIntake(intake);
    setSelectedSection(null);
    filterEnrollments(intake, null);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    filterEnrollments(selectedIntake, section);
  };

  const clearFilters = () => {
    setSelectedIntake(null);
    setSelectedSection(null);
    setFilteredEnrollments(enrollments);
  };

  const handleTakeAttendance = () => {
    navigation.navigate('TakeAttendance', { 
      course
    });
  };

  const handleViewAttendanceReport = () => {
    navigation.navigate('TeacherAttendanceReport', { 
      course
    });
  };

  const handleViewMyAttendance = () => {
    navigation.navigate('StudentAttendanceReport', { 
      course
    });
  };

  const handleRemoveStudent = async (enrollment) => {
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove "${enrollment.studentName}" from this course?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.dropEnrollment(enrollment._id);
              if (response.success) {
                Alert.alert('Success', 'Student removed from course successfully!');
                loadEnrollments();
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove student');
            }
          },
        },
      ]
    );
  };

  const renderStudentCard = (enrollment) => (
    <View key={enrollment._id} style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{enrollment.studentName}</Text>
        <Text style={styles.studentEmail}>{enrollment.studentEmail}</Text>
        {enrollment.studentCustomId && (
          <Text style={styles.studentId}>Student ID: {enrollment.studentCustomId}</Text>
        )}
        <Text style={styles.studentDetails}>
          Dept: {enrollment.department} | Intake: {enrollment.intake} | Section: {enrollment.section || 'N/A'}
        </Text>
        <Text style={styles.enrolledDate}>
          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveStudent(enrollment)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading course details...</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Course Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Course Information */}
        <View style={styles.courseInfoCard}>
          <Text style={styles.courseCode}>{course.courseCode}</Text>
          <Text style={styles.courseName}>{course.courseName}</Text>
          <View style={styles.courseDetails}>
            <Text style={styles.detailItem}>Credits: {course.credits || 'N/A'}</Text>
            <Text style={styles.detailItem}>Department: {course.department}</Text>
            {course.semester && (
              <Text style={styles.detailItem}>Semester: {course.semester}</Text>
            )}
          </View>
          {course.description && (
            <Text style={styles.courseDescription}>{course.description}</Text>
          )}
        </View>

        {/* Attendance Buttons - Only for teachers, not super admin */}
        {user.role === 'teacher' && filteredEnrollments.length > 0 && (
          <View style={styles.attendanceButtonsContainer}>
            <TouchableOpacity style={styles.attendanceButton} onPress={handleTakeAttendance}>
              <Text style={styles.attendanceButtonText}>📋 Take Attendance</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Attendance Report Button */}
        {(user.role === 'teacher' || user.role === 'superadmin') && filteredEnrollments.length > 0 && (
          <TouchableOpacity style={styles.reportButton} onPress={handleViewAttendanceReport}>
            <Text style={styles.reportButtonText}>📊 Attendance Report</Text>
          </TouchableOpacity>
        )}

        {/* Student Attendance Report Button */}
        {user.role === 'student' && (
          <TouchableOpacity style={styles.reportButton} onPress={handleViewMyAttendance}>
            <Text style={styles.reportButtonText}>📊 My Attendance</Text>
          </TouchableOpacity>
        )}

        {/* Filter Options - Only visible to teachers */}
        {(user.role === 'teacher' || user.role === 'superadmin') && enrollments.length > 0 && (
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Students</Text>
              <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                <Text style={styles.filterToggle}>
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Text>
              </TouchableOpacity>
            </View>

            {showFilters && (
              <View style={styles.filterOptions}>
                {/* Intake Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Intake:</Text>
                  <View style={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.filterButton, !selectedIntake && styles.filterButtonActive]}
                      onPress={clearFilters}
                    >
                      <Text style={[styles.filterButtonText, !selectedIntake && styles.filterButtonTextActive]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {availableIntakes.map(intake => (
                      <TouchableOpacity
                        key={intake}
                        style={[styles.filterButton, selectedIntake === intake && styles.filterButtonActive]}
                        onPress={() => handleIntakeSelect(intake)}
                      >
                        <Text style={[styles.filterButtonText, selectedIntake === intake && styles.filterButtonTextActive]}>
                          {intake}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Section Filter */}
                {selectedIntake && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Section:</Text>
                    <View style={styles.filterButtons}>
                      <TouchableOpacity
                        style={[styles.filterButton, !selectedSection && styles.filterButtonActive]}
                        onPress={() => handleSectionSelect(null)}
                      >
                        <Text style={[styles.filterButtonText, !selectedSection && styles.filterButtonTextActive]}>
                          All
                        </Text>
                      </TouchableOpacity>
                      {availableSections.map(section => (
                        <TouchableOpacity
                          key={section}
                          style={[styles.filterButton, selectedSection === section && styles.filterButtonActive]}
                          onPress={() => handleSectionSelect(section)}
                        >
                          <Text style={[styles.filterButtonText, selectedSection === section && styles.filterButtonTextActive]}>
                            {section}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Enrolled Students - Only visible to teachers */}
        {(user.role === 'teacher' || user.role === 'superadmin') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Enrolled Students</Text>
              <Text style={styles.studentCount}>
                ({filteredEnrollments.length}{selectedIntake || selectedSection ? ` of ${enrollments.length}` : ''})
              </Text>
            </View>

            {filteredEnrollments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {enrollments.length === 0 ? 'No students enrolled' : 'No students match the filter'}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {enrollments.length === 0 
                    ? 'No students have enrolled in this course yet.'
                    : 'Try adjusting your filter criteria.'
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.studentList}>
                {filteredEnrollments.map(enrollment => renderStudentCard(enrollment))}
              </View>
            )}
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
  scrollContent: {
    paddingBottom: 20,
  },
  courseInfoCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  courseDetails: {
    marginBottom: 15,
  },
  detailItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  courseDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  studentCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    gap: 10,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  studentId: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
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
  removeButton: {
    backgroundColor: '#f44336',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  attendanceButtonsContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  attendanceButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  attendanceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: '#2196f3',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  filterToggle: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  filterOptions: {
    marginTop: 10,
  },
  filterGroup: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CourseDetailScreen;

