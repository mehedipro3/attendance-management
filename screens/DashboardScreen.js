import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const DashboardScreen = ({ navigation }) => {
  const { user, isStudent, isSuperAdmin, isTeacher } = useAuth();
  const [totalAttendance, setTotalAttendance] = useState(null);
  const [allCoursesReport, setAllCoursesReport] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [teacherStats, setTeacherStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isStudent) {
      loadStudentData();
    } else if (isSuperAdmin) {
      loadAdminStats();
    } else if (isTeacher) {
      loadTeacherStats();
    }
  }, [isStudent, isSuperAdmin, isTeacher]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [totalResponse, reportResponse] = await Promise.all([
        ApiService.getStudentTotalAttendance(user._id),
        ApiService.getStudentAllCoursesReport(user._id)
      ]);

      if (totalResponse.success) {
        setTotalAttendance(totalResponse.totalAttendance);
      }

      if (reportResponse.success) {
        setAllCoursesReport(reportResponse.report);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      Alert.alert('Error', `Failed to load student data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const [usersResponse, coursesResponse] = await Promise.all([
        ApiService.getAllUsers(),
        ApiService.getAllCourses()
      ]);

      if (usersResponse.success && coursesResponse.success) {
        const users = usersResponse.users;
        const courses = coursesResponse.courses;
        
        const teachers = users.filter(u => u.role === 'teacher').length;
        const students = users.filter(u => u.role === 'student').length;
        
        setAdminStats({
          totalTeachers: teachers,
          totalStudents: students,
          totalCourses: courses.length,
          totalUsers: users.length
        });
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
      Alert.alert('Error', `Failed to load admin statistics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherStats = async () => {
    try {
      setLoading(true);
      const coursesResponse = await ApiService.getCoursesByTeacher(user._id);

      if (coursesResponse.success) {
        const courses = coursesResponse.courses;
        
        // Get enrollments for each course
        let totalEnrollments = 0;
        let uniqueStudents = new Set();
        
        for (const course of courses) {
          try {
            const enrollmentsResponse = await ApiService.getCourseEnrollments(course._id);
            if (enrollmentsResponse.success) {
              totalEnrollments += enrollmentsResponse.enrollments.length;
              enrollmentsResponse.enrollments.forEach(enrollment => {
                uniqueStudents.add(enrollment.studentId);
              });
            }
          } catch (error) {
            console.error(`Error loading enrollments for course ${course.courseCode}:`, error);
          }
        }
        
        setTeacherStats({
          totalCourses: courses.length,
          totalEnrollments: totalEnrollments,
          uniqueStudents: uniqueStudents.size,
          department: user.department
        });
      }
    } catch (error) {
      console.error('Error loading teacher stats:', error);
      Alert.alert('Error', `Failed to load teacher statistics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);

      // Sort attendance data by date (newest first)
      const sortedReportData = allCoursesReport.map(course => ({
        ...course,
        attendance: [...course.attendance].sort((a, b) => new Date(b.date) - new Date(a.date))
      }));

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Student Complete Attendance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              padding: 20px;
              line-height: 1.6;
              color: #333;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              color: #007bff;
              border-bottom: 2px solid #007bff;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .section {
              margin: 25px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #007bff;
            }
            .section-title {
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info {
              margin: 8px 0;
              padding: 5px 0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .summary-item {
              text-align: center;
              padding: 15px;
              background-color: #ffffff;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            }
            .summary-number {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .course-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #ffffff;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            }
            .course-header {
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .course-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin: 10px 0;
            }
            .course-stat {
              text-align: center;
              padding: 8px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .course-stat-number {
              font-weight: bold;
              color: #007bff;
            }
            .course-stat-label {
              font-size: 10px;
              color: #666;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .attendance-table th,
            .attendance-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .attendance-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .present {
              color: #28a745;
              font-weight: bold;
            }
            .absent {
              color: #dc3545;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Complete Attendance Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="info"><strong>Name:</strong> ${user.name}</div>
            <div class="info"><strong>Student ID:</strong> ${user.studentId || 'N/A'}</div>
            <div class="info"><strong>Email:</strong> ${user.email}</div>
            <div class="info"><strong>Department:</strong> ${user.department || 'N/A'}</div>
            <div class="info"><strong>Intake:</strong> ${user.intake || 'N/A'}</div>
            <div class="info"><strong>Section:</strong> ${user.section || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Overall Attendance Summary</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-number">${totalAttendance?.totalDays || 0}</div>
                <div class="summary-label">Total Days</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${totalAttendance?.presentDays || 0}</div>
                <div class="summary-label">Present Days</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${totalAttendance?.absentDays || 0}</div>
                <div class="summary-label">Absent Days</div>
              </div>
            <div class="summary-item">
              <div class="summary-number">${totalAttendance?.attendancePercentage || 0}%</div>
              <div class="summary-label">Attendance %</div>
            </div>
          </div>
          <div class="info"><strong>Total Courses:</strong> ${totalAttendance?.totalCourses || 0}</div>
          </div>

          ${sortedReportData.map(course => `
            <div class="course-section">
              <div class="course-header">${course.courseName} (${course.courseCode})</div>
              <div class="course-stats">
                <div class="course-stat">
                  <div class="course-stat-number">${course.totalDays}</div>
                  <div class="course-stat-label">Total Days</div>
                </div>
                <div class="course-stat">
                  <div class="course-stat-number">${course.presentDays}</div>
                  <div class="course-stat-label">Present</div>
                </div>
                <div class="course-stat">
                  <div class="course-stat-number">${course.absentDays}</div>
                  <div class="course-stat-label">Absent</div>
                </div>
                <div class="course-stat">
                  <div class="course-stat-number">${course.attendancePercentage}%</div>
                  <div class="course-stat-label">Percentage</div>
                </div>
                <div class="course-stat">
                  <div class="course-stat-number" style="color: #ff9800;">${course.attendanceMarks || 0}</div>
                  <div class="course-stat-label">Marks (out of 5)</div>
                </div>
              </div>
              <div class="info"><strong>Intake:</strong> ${course.intake}</div>
              <div class="info"><strong>Section:</strong> ${course.section}</div>
              
              ${course.attendance.length > 0 ? `
                <table class="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${course.attendance.map(record => `
                      <tr>
                        <td>${new Date(record.date).toLocaleDateString()}</td>
                        <td class="${record.status}">${record.status}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p>No attendance records available.</p>'}
            </div>
          `).join('')}

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p>This report was generated automatically by the Student Dashboard System.</p>
            <p>For any discrepancies, please contact your course instructor.</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('PDF generated at:', uri);

      // Create filename
      const fileName = `Student_Attendance_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Share the file directly without moving it
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Complete Attendance Report',
          UTI: 'com.adobe.pdf'
        });
        
        Alert.alert('Success', 'Report shared successfully! You can save it to your device.');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (isSuperAdmin) {
    // Show admin dashboard with statistics and course access
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome, {user?.name || user?.email}!</Text>
            <Text style={styles.welcomeSubtitle}>Super Admin Dashboard</Text>
          </View>

          {/* Admin Statistics */}
          {adminStats && (
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>System Statistics</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#007bff' }]}>{adminStats.totalTeachers}</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#4caf50' }]}>{adminStats.totalStudents}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#ff9800' }]}>{adminStats.totalCourses}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#9c27b0' }]}>{adminStats.totalUsers}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </View>
              </View>
            </View>
          )}

          {/* Admin Actions */}
          <View style={styles.coursesCard}>
            <Text style={styles.cardTitle}>Course Management</Text>
            <Text style={styles.cardSubtitle}>Access and manage all courses like a teacher</Text>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Courses')}
            >
              <Text style={styles.adminButtonText}>📚 View All Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Text style={styles.adminButtonText}>👥 Manage Users</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isTeacher) {
    // Show teacher dashboard with statistics
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        <View style={styles.header}>
          <Text style={styles.title}>Teacher Dashboard</Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome, {user?.name || user?.email}!</Text>
            <Text style={styles.welcomeSubtitle}>Teacher Dashboard - {user?.department}</Text>
          </View>

          {/* Teacher Statistics */}
          {teacherStats && (
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Teaching Statistics</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#007bff' }]}>{teacherStats.totalCourses}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#4caf50' }]}>{teacherStats.totalEnrollments}</Text>
                  <Text style={styles.statLabel}>Enrollments</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#ff9800' }]}>{teacherStats.uniqueStudents}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.coursesCard}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Text style={styles.cardSubtitle}>Manage your courses and students</Text>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Courses')}
            >
              <Text style={styles.adminButtonText}>📚 Manage Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.adminButtonText}>⚙️ Settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          onPress={handleDownloadReport}
          disabled={downloading}
        >
          <Text style={styles.downloadButtonText}>
            {downloading ? '⏳' : '📄'} Download Report
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Student Information Card */}
        <View style={styles.studentInfoCard}>
          <Text style={styles.cardTitle}>Student Information</Text>
          <Text style={styles.infoText}>Name: {user.name}</Text>
          <Text style={styles.infoText}>Student ID: {user.studentId || 'N/A'}</Text>
          <Text style={styles.infoText}>Email: {user.email}</Text>
          <Text style={styles.infoText}>Department: {user.department || 'N/A'}</Text>
          <Text style={styles.infoText}>Intake: {user.intake || 'N/A'}</Text>
          <Text style={styles.infoText}>Section: {user.section || 'N/A'}</Text>
        </View>

        {/* Overall Attendance Summary */}
        {totalAttendance && (
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Overall Attendance Summary</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalAttendance.totalDays}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#4caf50' }]}>{totalAttendance.presentDays}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#f44336' }]}>{totalAttendance.absentDays}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statNumber,
                  { color: parseFloat(totalAttendance.attendancePercentage) >= 75 ? '#4caf50' : '#f44336' }
                ]}>
                  {totalAttendance.attendancePercentage}%
                </Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
            </View>
            <Text style={styles.totalCoursesText}>
              Total Courses: {totalAttendance.totalCourses}
            </Text>
          </View>
        )}

        {/* Course-wise Attendance Breakdown */}
        <View style={styles.coursesCard}>
          <Text style={styles.cardTitle}>Course-wise Attendance Breakdown</Text>
          {allCoursesReport.length > 0 ? (
            allCoursesReport.map((course, index) => (
              <View key={index} style={styles.courseItem}>
                <Text style={styles.courseName}>{course.courseName} ({course.courseCode})</Text>
                <View style={styles.courseStatsRow}>
                  <View style={styles.courseStatItem}>
                    <Text style={styles.courseStatNumber}>{course.totalDays}</Text>
                    <Text style={styles.courseStatLabel}>Days</Text>
                  </View>
                  <View style={styles.courseStatItem}>
                    <Text style={[styles.courseStatNumber, { color: '#4caf50' }]}>{course.presentDays}</Text>
                    <Text style={styles.courseStatLabel}>Present</Text>
                  </View>
                  <View style={styles.courseStatItem}>
                    <Text style={[styles.courseStatNumber, { color: '#f44336' }]}>{course.absentDays}</Text>
                    <Text style={styles.courseStatLabel}>Absent</Text>
                  </View>
                  <View style={styles.courseStatItem}>
                    <Text style={[
                      styles.courseStatNumber,
                      { color: parseFloat(course.attendancePercentage) >= 75 ? '#4caf50' : '#f44336' }
                    ]}>
                      {course.attendancePercentage}%
                    </Text>
                    <Text style={styles.courseStatLabel}>%</Text>
                  </View>
                </View>
                <View style={styles.courseMarksRow}>
                  <View style={styles.courseMarksItem}>
                    <Text style={[styles.courseMarksNumber, { color: '#ff9800' }]}>{course.attendanceMarks || 0}</Text>
                    <Text style={styles.courseMarksLabel}>Marks (out of 5)</Text>
                  </View>
                </View>
                <Text style={styles.courseDetails}>
                  Intake: {course.intake} | Section: {course.section}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No course attendance data available</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  downloadButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  studentInfoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  totalCoursesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  courseMarksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  courseMarksItem: {
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  courseMarksNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  courseMarksLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  coursesCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  courseItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  courseStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  courseStatItem: {
    alignItems: 'center',
  },
  courseStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  courseStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  courseDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Original dashboard styles for non-students
  content: {
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  adminButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;