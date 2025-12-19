const { connectDB } = require('../database/config');
const Attendance = require('../database/models/Attendance');
const Enrollment = require('../database/models/Enrollment');

class AttendanceService {
  // Calculate attendance marks based on percentage (0-5 marks)
  static calculateAttendanceMarks(attendancePercentage) {
    const percentage = parseFloat(attendancePercentage);
    return Math.round((percentage * 5) / 100 * 100) / 100; // Round to 2 decimal places
  }

  static async createAttendance(attendanceData) {
    try {
      const db = await connectDB();
      return await Attendance.createAttendance(db, attendanceData);
    } catch (error) {
      throw new Error(`Attendance creation failed: ${error.message}`);
    }
  }

  static async getCourseAttendance(courseId, date = null) {
    try {
      const db = await connectDB();
      return await Attendance.getAttendanceByCourse(db, courseId, date);
    } catch (error) {
      throw new Error(`Failed to get course attendance: ${error.message}`);
    }
  }

  static async getStudentAttendance(studentId, courseId = null) {
    try {
      const db = await connectDB();
      return await Attendance.getAttendanceByStudent(db, studentId, courseId);
    } catch (error) {
      throw new Error(`Failed to get student attendance: ${error.message}`);
    }
  }

  static async updateAttendance(attendanceId, updateData) {
    try {
      const db = await connectDB();
      return await Attendance.updateAttendance(db, attendanceId, updateData);
    } catch (error) {
      throw new Error(`Failed to update attendance: ${error.message}`);
    }
  }

  static async deleteAttendance(attendanceId) {
    try {
      const db = await connectDB();
      return await Attendance.deleteAttendance(db, attendanceId);
    } catch (error) {
      throw new Error(`Failed to delete attendance: ${error.message}`);
    }
  }

  static async getAttendanceStats(courseId, intake = null, section = null) {
    try {
      const db = await connectDB();
      return await Attendance.getAttendanceStats(db, courseId, intake, section);
    } catch (error) {
      throw new Error(`Failed to get attendance stats: ${error.message}`);
    }
  }

  static async getAvailableIntakesAndSections(courseId) {
    try {
      const db = await connectDB();
      return await Attendance.getAvailableIntakesAndSections(db, courseId);
    } catch (error) {
      throw new Error(`Failed to get available intakes and sections: ${error.message}`);
    }
  }

  // Fast method for getting intakes and sections - no complex aggregation
  static async getAvailableIntakesAndSectionsFast(courseId) {
    try {
      const db = await connectDB();
      const enrollments = await Enrollment.getEnrollmentsByCourseFast(db, courseId);
      
      const intakes = [...new Set(enrollments.map(e => e.intake))].filter(Boolean);
      const sections = [...new Set(enrollments.map(e => e.section))].filter(Boolean);
      
      const intakeSectionMap = {};
      intakes.forEach(intake => {
        intakeSectionMap[intake] = [...new Set(
          enrollments.filter(e => e.intake === intake).map(e => e.section)
        )].filter(Boolean);
      });
      
      return {
        success: true,
        intakes,
        sections,
        intakeSectionMap
      };
    } catch (error) {
      throw new Error(`Failed to get available intakes and sections: ${error.message}`);
    }
  }

  // Fast method for getting course enrollments - no complex aggregation
  static async getCourseEnrollmentsFast(courseId) {
    try {
      const db = await connectDB();
      const enrollments = await Enrollment.getEnrollmentsByCourseFast(db, courseId);
      
      return {
        success: true,
        enrollments
      };
    } catch (error) {
      throw new Error(`Failed to get course enrollments: ${error.message}`);
    }
  }

  static async getTeacherAttendanceReport(courseId, intake, section, month, year) {
    try {
      const db = await connectDB();
      return await Attendance.getTeacherAttendanceReport(db, courseId, intake, section, month, year);
    } catch (error) {
      throw new Error(`Failed to get teacher attendance report: ${error.message}`);
    }
  }

  static async getTeacherAttendanceReportTotal(courseId, intake, section) {
    try {
      const db = await connectDB();
      return await Attendance.getTeacherAttendanceReportTotal(db, courseId, intake, section);
    } catch (error) {
      throw new Error(`Failed to get teacher attendance report total: ${error.message}`);
    }
  }

  static async getStudentAttendanceReport(studentId, courseId, month, year) {
    try {
      const db = await connectDB();
      return await Attendance.getStudentAttendanceReport(db, studentId, courseId, month, year);
    } catch (error) {
      throw new Error(`Failed to get student attendance report: ${error.message}`);
    }
  }

  static async getAvailableMonths(courseId, studentId = null) {
    try {
      const db = await connectDB();
      return await Attendance.getAvailableMonths(db, courseId, studentId);
    } catch (error) {
      throw new Error(`Failed to get available months: ${error.message}`);
    }
  }

  static async takeBulkAttendance(courseId, attendanceData, takenBy) {
    try {
      const db = await connectDB();
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      // Check if attendance already exists for this date, intake, and section
      const existingAttendance = await attendanceCollection.findOne({
        courseId: new ObjectId(courseId),
        date: attendanceData.date,
        intake: attendanceData.intake,
        section: attendanceData.section
      });
      
      if (existingAttendance) {
        return {
          success: false,
          created: 0,
          errors: ['Attendance already recorded for this date and section'],
          message: 'Attendance already exists for this date, intake, and section'
        };
      }
      
      // Create attendance records in batch
      const attendanceRecords = [];
      const studentIds = Object.keys(attendanceData.students);
      
      for (const studentId of studentIds) {
        const status = attendanceData.students[studentId];
        if (status) {
          attendanceRecords.push({
            courseId: new ObjectId(courseId),
            studentId: new ObjectId(studentId),
            date: attendanceData.date,
            intake: attendanceData.intake,
            section: attendanceData.section,
            status: status,
            notes: attendanceData.notes || '',
            takenBy: new ObjectId(takenBy),
            takenAt: new Date()
          });
        }
      }
      
      if (attendanceRecords.length === 0) {
        return {
          success: true,
          created: 0,
          errors: [],
          message: 'No attendance records to create'
        };
      }
      
      // Use bulkWrite for maximum performance
      const bulkOps = attendanceRecords.map(record => ({
        updateOne: {
          filter: {
            courseId: record.courseId,
            studentId: record.studentId,
            date: record.date,
            intake: record.intake,
            section: record.section
          },
          update: { $set: record },
          upsert: true
        }
      }));
      
      const result = await attendanceCollection.bulkWrite(bulkOps);
      
      return {
        success: true,
        created: result.upsertedCount + result.modifiedCount,
        errors: [],
        message: `Attendance taken for ${result.upsertedCount + result.modifiedCount} students`
      };
    } catch (error) {
      console.error('Error in takeBulkAttendance:', error);
      throw new Error(`Failed to take bulk attendance: ${error.message}`);
    }
  }

  // Get student total attendance across all courses
  static async getStudentTotalAttendance(studentId) {
    try {
      const db = await connectDB();
      const attendanceCollection = db.collection('attendance');
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      // Get all enrollments for the student (handle both ObjectId and string)
      const studentObjectId = studentId instanceof ObjectId ? studentId : new ObjectId(studentId);
      const enrollments = await enrollmentsCollection.find({
        $or: [
          { studentId: studentObjectId },
          { studentId: studentId }
        ],
        status: 'active'
      }).toArray();
      
      if (enrollments.length === 0) {
        return {
          success: true,
          totalAttendance: {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            attendancePercentage: 0,
            totalCourses: 0
          },
          courses: []
        };
      }
      
      const courseIds = enrollments.map(e => e.courseId);
      
      // Get all attendance records for this student across all courses
      const attendanceRecords = await attendanceCollection.find({
        $or: [
          { studentId: studentObjectId },
          { studentId: studentId }
        ]
      }).sort({ date: 1 }).toArray();
      
      // Calculate totals
      let totalDays = 0;
      let presentDays = 0;
      let absentDays = 0;
      
      attendanceRecords.forEach(record => {
        totalDays++;
        if (record.status === 'present') {
          presentDays++;
        } else {
          absentDays++;
        }
      });
      
      const attendancePercentage = totalDays > 0 ? Math.round(presentDays / totalDays * 100) : 0;
      const attendanceMarks = this.calculateAttendanceMarks(attendancePercentage);
      
      return {
        success: true,
        totalAttendance: {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage,
          attendanceMarks,
          totalCourses: enrollments.length
        },
        courses: enrollments.map(enrollment => ({
          courseId: enrollment.courseId,
          courseCode: enrollment.courseCode,
          courseName: enrollment.courseName,
          intake: enrollment.intake,
          section: enrollment.section
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get student total attendance: ${error.message}`);
    }
  }

  // Get student attendance report for all courses
  static async getStudentAllCoursesReport(studentId) {
    try {
      const db = await connectDB();
      const attendanceCollection = db.collection('attendance');
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      // Get all enrollments for the student (handle both ObjectId and string)
      const studentObjectId = studentId instanceof ObjectId ? studentId : new ObjectId(studentId);
      const enrollments = await enrollmentsCollection.find({
        $or: [
          { studentId: studentObjectId },
          { studentId: studentId }
        ],
        status: 'active'
      }).toArray();
      
      if (enrollments.length === 0) {
        return {
          success: true,
          report: []
        };
      }
      
      const courseIds = enrollments.map(e => e.courseId);
      
      // Get all attendance records for this student across all courses
      const attendanceRecords = await attendanceCollection.find({
        $or: [
          { studentId: studentObjectId },
          { studentId: studentId }
        ]
      }).sort({ date: -1 }).toArray();
      
      // Group attendance by course
      const courseAttendanceMap = {};
      
      enrollments.forEach(enrollment => {
        const courseIdKey = enrollment.courseId.toString();
        courseAttendanceMap[courseIdKey] = {
          courseId: enrollment.courseId.toString(), // Convert to string for frontend
          courseCode: enrollment.courseCode,
          courseName: enrollment.courseName,
          intake: enrollment.intake,
          section: enrollment.section,
          attendance: [],
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendancePercentage: 0
        };
      });
      
      // Process attendance records
      attendanceRecords.forEach(record => {
        const courseIdKey = record.courseId.toString();
        if (courseAttendanceMap[courseIdKey]) {
          courseAttendanceMap[courseIdKey].attendance.push({
            date: record.date,
            status: record.status,
            notes: record.notes
          });
          
          courseAttendanceMap[courseIdKey].totalDays++;
          if (record.status === 'present') {
            courseAttendanceMap[courseIdKey].presentDays++;
          } else {
            courseAttendanceMap[courseIdKey].absentDays++;
          }
        }
      });
      
      // Calculate attendance percentages and marks
      Object.values(courseAttendanceMap).forEach(course => {
        if (course.totalDays > 0) {
          course.attendancePercentage = Math.round(course.presentDays / course.totalDays * 100);
          course.attendanceMarks = this.calculateAttendanceMarks(course.attendancePercentage);
        } else {
          course.attendanceMarks = 0;
        }
      });
      
      return {
        success: true,
        report: Object.values(courseAttendanceMap)
      };
    } catch (error) {
      throw new Error(`Failed to get student all courses report: ${error.message}`);
    }
  }
}

module.exports = AttendanceService;

