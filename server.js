const express = require('express');
const cors = require('cors');
const { connectDB } = require('./database/config');
const AuthService = require('./services/authService');
const CourseService = require('./services/courseService');
const EnrollmentService = require('./services/enrollmentService');
const AttendanceService = require('./services/attendanceService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and create super admin
const initializeApp = async () => {
  try {
    await connectDB();
    await AuthService.createSuperAdmin();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running' 
  });
});

// Routes
app.post('/api/auth/register-student', async (req, res) => {
  try {
    const { email, password, name, studentId, intake, section, department } = req.body;
    const result = await AuthService.registerStudent(email, password, name, studentId, intake, section, department);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const decoded = AuthService.verifyToken(token);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

// User Management Routes (Super Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    const users = await AuthService.getAllUsers(role);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users/create-teacher', async (req, res) => {
  try {
    const { email, password, name, department, createdBy } = req.body;
    const teacher = await AuthService.createTeacher(email, password, name, department, createdBy);
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await AuthService.deleteUser(userId);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Course Management Routes
app.post('/api/courses', async (req, res) => {
  try {
    const courseData = req.body;
    const course = await CourseService.createCourse(courseData);
    res.json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/courses/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const result = await CourseService.getCoursesByTeacher(teacherId);
    res.json({ success: true, courses: result.courses });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/courses/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const result = await CourseService.getCoursesByDepartment(department);
    res.json({ success: true, courses: result.courses });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const result = await CourseService.getAllCourses();
    res.json({ success: true, courses: result.courses });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;
    const result = await CourseService.updateCourse(courseId, updateData);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await CourseService.deleteCourse(courseId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Enrollment Routes
app.post('/api/enrollments', async (req, res) => {
  try {
    const enrollmentData = req.body;
    const enrollment = await EnrollmentService.enrollStudent(enrollmentData);
    res.json({ success: true, enrollment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/enrollments/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await EnrollmentService.getStudentEnrollments(studentId);
    res.json({ success: true, enrollments: result.enrollments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/enrollments/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await EnrollmentService.getCourseEnrollments(courseId);
    res.json({ success: true, enrollments: result.enrollments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/enrollments/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const result = await EnrollmentService.getTeacherEnrollments(teacherId);
    res.json({ success: true, enrollments: result.enrollments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/courses/available/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { department, intake } = req.query;
    const result = await EnrollmentService.getAvailableCoursesForStudent(studentId, department, intake);
    res.json({ success: true, courses: result.courses });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Attendance endpoints
app.post('/api/attendance/take', async (req, res) => {
  try {
    const attendanceData = req.body;
    const result = await AttendanceService.takeBulkAttendance(
      attendanceData.courseId,
      attendanceData,
      attendanceData.takenBy
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;
    const result = await AttendanceService.getCourseAttendance(courseId, date);
    res.json({ success: true, attendance: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    const result = await AttendanceService.getStudentAttendance(studentId, courseId);
    res.json({ success: true, attendance: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/stats/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { intake, section } = req.query;
    const result = await AttendanceService.getAttendanceStats(courseId, intake, section);
    res.json({ success: true, stats: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/intakes-sections/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await AttendanceService.getAvailableIntakesAndSections(courseId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Fast endpoints for attendance taking
app.get('/api/attendance/intakes-sections-fast/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await AttendanceService.getAvailableIntakesAndSectionsFast(courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/enrollments/course-fast/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await AttendanceService.getCourseEnrollmentsFast(courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/attendance/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;
    const result = await AttendanceService.updateAttendance(attendanceId, updateData);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/attendance/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const result = await AttendanceService.deleteAttendance(attendanceId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Attendance Report endpoints
app.get('/api/attendance/report/teacher/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { intake, section, month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'Month and year are required' });
    }
    
    const result = await AttendanceService.getTeacherAttendanceReport(
      courseId, 
      intake, 
      section, 
      parseInt(month), 
      parseInt(year)
    );
    res.json({ success: true, report: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/report/teacher/:courseId/total', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { intake, section } = req.query;
    
    const result = await AttendanceService.getTeacherAttendanceReportTotal(
      courseId, 
      intake, 
      section
    );
    res.json({ success: true, report: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Student total attendance endpoints - MUST come before the more general route
app.get('/api/attendance/report/student/total/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await AttendanceService.getStudentTotalAttendance(studentId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.log('Total attendance endpoint error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/report/student/all-courses/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await AttendanceService.getStudentAllCoursesReport(studentId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.log('All courses report endpoint error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/report/student/:studentId/:courseId', async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'Month and year are required' });
    }
    
    const result = await AttendanceService.getStudentAttendanceReport(
      studentId, 
      courseId, 
      parseInt(month), 
      parseInt(year)
    );
    res.json({ success: true, report: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/months/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.query;
    const result = await AttendanceService.getAvailableMonths(courseId, studentId);
    res.json({ success: true, months: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/enrollments/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const result = await EnrollmentService.dropEnrollment(enrollmentId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeApp();
});

module.exports = app;

