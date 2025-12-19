const Enrollment = require('../database/models/Enrollment');
const { connectDB } = require('../database/config');

class EnrollmentService {
  static async enrollStudent(enrollmentData) {
    try {
      const db = await connectDB();
      const enrollment = await Enrollment.enrollStudent(db, enrollmentData);
      return { success: true, enrollment };
    } catch (error) {
      throw new Error(`Failed to enroll student: ${error.message}`);
    }
  }

  static async getStudentEnrollments(studentId) {
    try {
      const db = await connectDB();
      const enrollments = await Enrollment.getEnrollmentsByStudent(db, studentId);
      
      // Fetch full course details for each enrollment
      const enrollmentsWithCourseDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const coursesCollection = db.collection('courses');
            const { ObjectId } = require('mongodb');
            
            const course = await coursesCollection.findOne({
              _id: new ObjectId(enrollment.courseId)
            });
            
            if (course) {
              return {
                ...enrollment,
                credits: course.credits || 3,
                description: course.description || '',
                semester: course.semester || 'Fall 2024',
                teacherName: course.teacherName || 'N/A'
              };
            }
          } catch (error) {
            console.error('Error fetching course details:', error);
          }
          
          // Return enrollment with default values if course not found
          return {
            ...enrollment,
            credits: 3,
            description: '',
            semester: 'Fall 2024',
            teacherName: 'N/A'
          };
        })
      );
      
      return { success: true, enrollments: enrollmentsWithCourseDetails };
    } catch (error) {
      throw new Error(`Failed to get student enrollments: ${error.message}`);
    }
  }

  static async getCourseEnrollments(courseId) {
    try {
      const db = await connectDB();
      const enrollments = await Enrollment.getEnrollmentsByCourse(db, courseId);
      return { success: true, enrollments };
    } catch (error) {
      throw new Error(`Failed to get course enrollments: ${error.message}`);
    }
  }

  static async getTeacherEnrollments(teacherId) {
    try {
      const db = await connectDB();
      const enrollments = await Enrollment.getEnrollmentsByTeacher(db, teacherId);
      return { success: true, enrollments };
    } catch (error) {
      throw new Error(`Failed to get teacher enrollments: ${error.message}`);
    }
  }

  static async getAvailableCoursesForStudent(studentId, studentDepartment, studentIntake) {
    try {
      const db = await connectDB();
      const courses = await Enrollment.getAvailableCoursesForStudent(db, studentId, studentDepartment, studentIntake);
      return { success: true, courses };
    } catch (error) {
      throw new Error(`Failed to get available courses: ${error.message}`);
    }
  }

  static async dropEnrollment(enrollmentId) {
    try {
      const db = await connectDB();
      const result = await Enrollment.dropEnrollment(db, enrollmentId);
      return { success: true, ...result };
    } catch (error) {
      throw new Error(`Failed to drop enrollment: ${error.message}`);
    }
  }
}

module.exports = EnrollmentService;


