import * as SecureStore from 'expo-secure-store';

// For Expo Go, use your computer's IP address instead of localhost
// Auto-detect IP or use fallback
const getAPIBaseURL = () => {
  // Try to detect the current IP, fallback to known IPs
  const possibleIPs = [
    '192.168.0.103',  // Current IP
    '192.168.0.102',  // Previous IP
    'localhost'        // Fallback
  ];
  
  // For now, use the current IP
  return __DEV__ 
    ? 'http://192.168.0.103:3000/api'
    : 'http://localhost:3000/api';
};

const API_BASE_URL = getAPIBaseURL();

class ApiService {
  // Test connection to the server
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token for authenticated requests
    let authHeaders = {};
    if (endpoint !== '/auth/login' && endpoint !== '/auth/register-student' && endpoint !== '/auth/register-teacher') {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          authHeaders = {
            Authorization: `Bearer ${token}`,
          };
        }
      } catch (error) {
        console.log('Could not get auth token:', error);
      }
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making API request to:', url);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle login errors specifically
        if (endpoint === '/auth/login' && response.status === 401) {
          throw new Error('Wrong email or password');
        }
        
        // Handle registration errors specifically
        if (endpoint === '/auth/register-student' && response.status === 400) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error && errorData.error.includes('already exists')) {
              throw new Error('Student already exists');
            }
          } catch (parseError) {
            // If we can't parse the error, use a generic message
            throw new Error('Student already exists');
          }
        }
        
        // Don't log errors for login and registration attempts
        if (endpoint !== '/auth/login' && endpoint !== '/auth/register-student') {
          console.error('API Error Response:', errorText);
        }
        
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Success:', data);
      return data;
    } catch (error) {
      // Don't log errors for login and registration attempts to avoid showing them in the app
      if (endpoint !== '/auth/login' && endpoint !== '/auth/register-student') {
        console.error('API request failed:', error);
      }
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Make sure the server is running on localhost:3000');
      }
      throw error;
    }
  }

  static async registerStudent(email, password, name, studentId, intake, section, department) {
    return this.request('/auth/register-student', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, studentId, intake, section, department }),
    });
  }

  static async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async verifyToken(token) {
    return this.request('/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async getAllUsers(role = null) {
    const url = role ? `/users?role=${role}` : '/users';
    return this.request(url, {
      method: 'GET',
    });
  }

  static async createTeacher(teacherData) {
    return this.request('/users/create-teacher', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  static async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Course Management
  static async createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  static async getCoursesByTeacher(teacherId) {
    return this.request(`/courses/teacher/${teacherId}`, {
      method: 'GET',
    });
  }

  static async getCoursesByDepartment(department) {
    return this.request(`/courses/department/${department}`, {
      method: 'GET',
    });
  }

  static async getAllCourses() {
    return this.request('/courses', {
      method: 'GET',
    });
  }

  static async updateCourse(courseId, updateData) {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  static async deleteCourse(courseId) {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  // Enrollment methods
  static async enrollStudent(enrollmentData) {
    return this.request('/enrollments', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });
  }

  static async getStudentEnrollments(studentId) {
    return this.request(`/enrollments/student/${studentId}`, {
      method: 'GET',
    });
  }

  static async getCourseEnrollments(courseId) {
    return this.request(`/enrollments/course/${courseId}`, {
      method: 'GET',
    });
  }

  static async getTeacherEnrollments(teacherId) {
    return this.request(`/enrollments/teacher/${teacherId}`, {
      method: 'GET',
    });
  }

  static async getAvailableCoursesForStudent(studentId, department, intake) {
    return this.request(`/courses/available/${studentId}?department=${department}&intake=${intake}`, {
      method: 'GET',
    });
  }

  static async dropEnrollment(enrollmentId) {
    return this.request(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  // Attendance API methods
  static async takeAttendance(attendanceData) {
    console.log('API: Taking attendance with data:', attendanceData);
    const result = await this.request('/attendance/take', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
    console.log('API: Attendance result:', result);
    return result;
  }

  static async getCourseAttendance(courseId, date = null) {
    const url = date 
      ? `/attendance/course/${courseId}?date=${date}`
      : `/attendance/course/${courseId}`;
    return this.request(url, {
      method: 'GET',
    });
  }

  static async getStudentAttendance(studentId, courseId = null) {
    const url = courseId 
      ? `/attendance/student/${studentId}?courseId=${courseId}`
      : `/attendance/student/${studentId}`;
    return this.request(url, {
      method: 'GET',
    });
  }

  static async getAttendanceStats(courseId, intake = null, section = null) {
    let url = `/attendance/stats/${courseId}`;
    const params = [];
    if (intake) params.push(`intake=${intake}`);
    if (section) params.push(`section=${section}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  static async getAvailableIntakesAndSections(courseId) {
    return this.request(`/attendance/intakes-sections/${courseId}`, {
      method: 'GET',
    });
  }

  static async getAvailableIntakesAndSectionsFast(courseId) {
    return this.request(`/attendance/intakes-sections-fast/${courseId}`, {
      method: 'GET',
    });
  }

  static async getCourseEnrollmentsFast(courseId) {
    return this.request(`/enrollments/course-fast/${courseId}`, {
      method: 'GET',
    });
  }

  static async updateAttendance(attendanceId, updateData) {
    return this.request(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  static async deleteAttendance(attendanceId) {
    return this.request(`/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
  }

  // Attendance Report API methods
  static async getTeacherAttendanceReport(courseId, intake, section, month, year) {
    let url = `/attendance/report/teacher/${courseId}?month=${month}&year=${year}`;
    if (intake) url += `&intake=${intake}`;
    if (section) url += `&section=${section}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  static async getTeacherAttendanceReportTotal(courseId, intake, section) {
    let url = `/attendance/report/teacher/${courseId}/total`;
    if (intake) url += `?intake=${intake}`;
    if (section) url += `${intake ? '&' : '?'}section=${section}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  static async getStudentAttendanceReport(studentId, courseId, month, year) {
    return this.request(`/attendance/report/student/${studentId}/${courseId}?month=${month}&year=${year}`, {
      method: 'GET',
    });
  }

  static async getAvailableMonths(courseId, studentId = null) {
    let url = `/attendance/months/${courseId}`;
    if (studentId) url += `?studentId=${studentId}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  // Student total attendance across all courses
  static async getStudentTotalAttendance(studentId) {
    return this.request(`/attendance/report/student/total/${studentId}`, {
      method: 'GET',
    });
  }

  // Student attendance report for all courses
  static async getStudentAllCoursesReport(studentId) {
    return this.request(`/attendance/report/student/all-courses/${studentId}`, {
      method: 'GET',
    });
  }
}

export default ApiService;
