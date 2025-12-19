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

const StudentProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [totalAttendance, setTotalAttendance] = useState(null);
  const [allCoursesReport, setAllCoursesReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, []);

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
              font-size: 16px;
              font-weight: bold;
            }
            .course-stat-label {
              font-size: 10px;
              color: #666;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .table th, .table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .table th {
              background-color: #007bff;
              color: white;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .table td {
              background-color: #ffffff;
            }
            .table tr:nth-child(even) td {
              background-color: #f8f9fa;
            }
            .present {
              color: #4caf50;
              font-weight: bold;
            }
            .absent {
              color: #f44336;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #666;
              font-size: 12px;
              border-top: 2px solid #007bff;
              padding-top: 15px;
            }
            @media print {
              body { 
                margin: 40px; 
                padding: 20px; 
              }
              .header { page-break-after: avoid; }
              .section { page-break-inside: avoid; }
              .course-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>COMPLETE ATTENDANCE REPORT</h1>
          </div>

          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="info"><strong>Student Name:</strong> ${user.name}</div>
            <div class="info"><strong>Student ID:</strong> ${user.studentId || 'N/A'}</div>
            <div class="info"><strong>Email:</strong> ${user.email}</div>
            <div class="info"><strong>Department:</strong> ${user.department}</div>
            <div class="info"><strong>Intake:</strong> ${user.intake}</div>
            <div class="info"><strong>Section:</strong> ${user.section}</div>
            <div class="info"><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Overall Attendance Summary</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-number">${totalAttendance?.totalDays || 0}</div>
                <div class="summary-label">Total Days</div>
              </div>
              <div class="summary-item">
                <div class="summary-number" style="color: #4caf50;">${totalAttendance?.presentDays || 0}</div>
                <div class="summary-label">Present Days</div>
              </div>
              <div class="summary-item">
                <div class="summary-number" style="color: #f44336;">${totalAttendance?.absentDays || 0}</div>
                <div class="summary-label">Absent Days</div>
              </div>
              <div class="summary-item">
                <div class="summary-number" style="color: ${parseFloat(totalAttendance?.attendancePercentage || 0) >= 75 ? '#4caf50' : '#f44336'};">
                  ${totalAttendance?.attendancePercentage || 0}%
                </div>
                <div class="summary-label">Attendance Rate</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Course-wise Attendance Details</div>
            ${sortedReportData.length > 0 ? sortedReportData.map(course => `
              <div class="course-section">
                <div class="course-header">${course.courseName} (${course.courseCode}) - ${course.intake} - Section ${course.section}</div>
                <div class="course-stats">
                  <div class="course-stat">
                    <div class="course-stat-number">${course.totalDays}</div>
                    <div class="course-stat-label">Total Days</div>
                  </div>
                  <div class="course-stat">
                    <div class="course-stat-number" style="color: #4caf50;">${course.presentDays}</div>
                    <div class="course-stat-label">Present</div>
                  </div>
                  <div class="course-stat">
                    <div class="course-stat-number" style="color: #f44336;">${course.absentDays}</div>
                    <div class="course-stat-label">Absent</div>
                  </div>
                  <div class="course-stat">
                    <div class="course-stat-number" style="color: ${parseFloat(course.attendancePercentage) >= 75 ? '#4caf50' : '#f44336'};">
                      ${course.attendancePercentage}%
                    </div>
                    <div class="course-stat-label">Attendance</div>
                  </div>
                </div>
                ${course.attendance.length > 0 ? `
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${course.attendance.map(record => `
                        <tr>
                          <td>${new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}</td>
                          <td class="${record.status}">${record.status.toUpperCase()}</td>
                          <td>${record.notes || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : '<p>No attendance records found for this course.</p>'}
              </div>
            `).join('') : '<p>No course attendance records found.</p>'}
          </div>

          <div class="footer">
            <p>Generated by SDP Attendance System</p>
          </div>
        </body>
        </html>
      `;

      // Create filename
      const fileName = `${user.name.replace(/\s+/g, '_')}_Complete_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      // Generate PDF with expo-print and save directly to device
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Save PDF directly to device downloads folder
      try {
        // Create downloads directory if it doesn't exist
        const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
        const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
        }

        // Copy PDF to downloads folder
        const downloadPath = downloadsDir + fileName;
        await FileSystem.copyAsync({
          from: uri,
          to: downloadPath
        });

        Alert.alert('Success', `PDF saved to Downloads folder: ${fileName}`);

      } catch (fileError) {
        console.log('Direct save failed, using share as fallback:', fileError);

        // Fallback to sharing if direct save fails
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: fileName,
          });
        } else {
          const { Share } = require('react-native');
          await Share.share({
            url: uri,
            title: fileName,
            type: 'application/pdf',
          });
        }

        Alert.alert('Success', `PDF shared: ${fileName}`);
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
  };


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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          onPress={handleDownloadReport}
          disabled={downloading}
        >
          <Text style={styles.downloadButtonText}>
            {downloading ? '⏳' : '📄'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.infoText}>Name: {user.name}</Text>
          <Text style={styles.infoText}>Student ID: {user.studentId || 'N/A'}</Text>
          <Text style={styles.infoText}>Email: {user.email}</Text>
          <Text style={styles.infoText}>Department: {user.department}</Text>
          <Text style={styles.infoText}>Intake: {user.intake}</Text>
          <Text style={styles.infoText}>Section: {user.section}</Text>
        </View>

        {/* Total Attendance Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Overall Attendance Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalAttendance?.totalDays || 0}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4caf50' }]}>
                {totalAttendance?.presentDays || 0}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f44336' }]}>
                {totalAttendance?.absentDays || 0}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: parseFloat(totalAttendance?.attendancePercentage || 0) >= 75 ? '#4caf50' : '#f44336' }
              ]}>
                {totalAttendance?.attendancePercentage || 0}%
              </Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
          </View>
          <Text style={styles.totalCoursesText}>
            Enrolled in {totalAttendance?.totalCourses || 0} course(s)
          </Text>
        </View>

        {/* Course-wise Summary */}
        <View style={styles.coursesCard}>
          <Text style={styles.cardTitle}>Course-wise Attendance</Text>
          {allCoursesReport.length > 0 ? (
            allCoursesReport.map((course, index) => (
              <View key={index} style={styles.courseItem}>
                <Text style={styles.courseName}>{course.courseName} ({course.courseCode})</Text>
                <Text style={styles.courseDetails}>
                  {course.intake} - Section {course.section}
                </Text>
                <View style={styles.courseStats}>
                  <View style={styles.courseStatItem}>
                    <Text style={styles.courseStatNumber}>{course.totalDays}</Text>
                    <Text style={styles.courseStatLabel}>Days</Text>
                  </View>
                  <View style={styles.courseStatItem}>
                    <Text style={[styles.courseStatNumber, { color: '#4caf50' }]}>
                      {course.presentDays}
                    </Text>
                    <Text style={styles.courseStatLabel}>Present</Text>
                  </View>
                  <View style={styles.courseStatItem}>
                    <Text style={[styles.courseStatNumber, { color: '#f44336' }]}>
                      {course.absentDays}
                    </Text>
                    <Text style={styles.courseStatLabel}>Absent</Text>
                  </View>
                  <View style={styles.courseStatItem}>
                    <Text style={[
                      styles.courseStatNumber,
                      { color: parseFloat(course.attendancePercentage) >= 75 ? '#4caf50' : '#f44336' }
                    ]}>
                      {course.attendancePercentage}%
                    </Text>
                    <Text style={styles.courseStatLabel}>Rate</Text>
                  </View>
                </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  downloadButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#007bff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0056b3',
  },
  downloadButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  totalCoursesText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  coursesCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  courseItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  courseDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  courseStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  courseStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courseStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default StudentProfileScreen;
