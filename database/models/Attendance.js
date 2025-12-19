const { connectDB } = require('../config');

class Attendance {
  constructor(data) {
    this.courseId = data.courseId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.studentEmail = data.studentEmail;
    this.intake = data.intake;
    this.section = data.section;
    this.date = data.date;
    this.status = data.status; // 'present', 'absent', 'late'
    this.notes = data.notes || '';
    this.takenBy = data.takenBy; // teacherId
    this.takenAt = data.takenAt || new Date();
  }

  toJSON() {
    return {
      courseId: this.courseId,
      studentId: this.studentId,
      studentName: this.studentName,
      studentEmail: this.studentEmail,
      intake: this.intake,
      section: this.section,
      date: this.date,
      status: this.status,
      notes: this.notes,
      takenBy: this.takenBy,
      takenAt: this.takenAt
    };
  }

  // Calculate attendance marks based on percentage (0-5 marks)
  static calculateAttendanceMarks(attendancePercentage) {
    const percentage = parseFloat(attendancePercentage);
    return Math.round((percentage * 5) / 100 * 100) / 100; // Round to 2 decimal places
  }

  static async createAttendance(db, attendanceData) {
    try {
      console.log('Creating attendance record:', attendanceData);
      
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      // Use upsert to update existing or create new attendance
      const attendance = new Attendance(attendanceData);
      const filter = {
        courseId: new ObjectId(attendanceData.courseId),
        studentId: new ObjectId(attendanceData.studentId),
        date: attendanceData.date,
        intake: attendanceData.intake,
        section: attendanceData.section
      };
      
      console.log('Upsert filter:', filter);
      
      const result = await attendanceCollection.updateOne(
        filter,
        { $set: attendance.toJSON() },
        { upsert: true }
      );
      
      console.log('Upsert result:', result);
      
      return {
        _id: result.upsertedId || result.matchedCount,
        ...attendance.toJSON()
      };
    } catch (error) {
      console.error('Error in createAttendance:', error);
      throw new Error(`Failed to create attendance: ${error.message}`);
    }
  }

  static async getAttendanceByCourse(db, courseId, date = null) {
    try {
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      const query = {
        courseId: new ObjectId(courseId)
      };
      
      if (date) {
        query.date = date;
      }
      
      const attendance = await attendanceCollection.find(query).toArray();
      
      return attendance.map(record => {
        const { _id, ...attendanceData } = record;
        return { _id: _id.toString(), ...attendanceData };
      });
    } catch (error) {
      throw new Error(`Failed to get attendance: ${error.message}`);
    }
  }

  static async getAttendanceByStudent(db, studentId, courseId = null) {
    try {
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      const query = {
        studentId: new ObjectId(studentId)
      };
      
      if (courseId) {
        query.courseId = new ObjectId(courseId);
      }
      
      const attendance = await attendanceCollection.find(query).sort({ date: -1 }).toArray();
      
      return attendance.map(record => {
        const { _id, ...attendanceData } = record;
        return { _id: _id.toString(), ...attendanceData };
      });
    } catch (error) {
      throw new Error(`Failed to get student attendance: ${error.message}`);
    }
  }

  static async updateAttendance(db, attendanceId, updateData) {
    try {
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      const result = await attendanceCollection.updateOne(
        { _id: new ObjectId(attendanceId) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Attendance record not found');
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update attendance: ${error.message}`);
    }
  }

  static async deleteAttendance(db, attendanceId) {
    try {
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      const result = await attendanceCollection.deleteOne({
        _id: new ObjectId(attendanceId)
      });
      
      if (result.deletedCount === 0) {
        throw new Error('Attendance record not found');
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete attendance: ${error.message}`);
    }
  }

  static async getAttendanceStats(db, courseId, intake = null, section = null) {
    try {
      const attendanceCollection = db.collection('attendance');
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      // Get all enrollments for the course
      let enrollmentQuery = {
        courseId: new ObjectId(courseId),
        status: 'active'
      };
      
      if (intake) {
        enrollmentQuery.intake = intake;
      }
      
      if (section) {
        enrollmentQuery.section = section;
      }
      
      const enrollments = await enrollmentsCollection.find(enrollmentQuery).toArray();
      
      // Get attendance records for these students
      const studentIds = enrollments.map(e => e.studentId);
      
      const attendanceRecords = await attendanceCollection.find({
        courseId: new ObjectId(courseId),
        studentId: { $in: studentIds }
      }).toArray();
      
      // Calculate stats
      const stats = {
        totalStudents: enrollments.length,
        totalAttendanceRecords: attendanceRecords.length,
        presentCount: attendanceRecords.filter(r => r.status === 'present').length,
        absentCount: attendanceRecords.filter(r => r.status === 'absent').length,
        lateCount: attendanceRecords.filter(r => r.status === 'late').length,
        attendanceRate: 0
      };
      
      if (stats.totalAttendanceRecords > 0) {
        stats.attendanceRate = ((stats.presentCount + stats.lateCount) / stats.totalAttendanceRecords * 100).toFixed(2);
      }
      
      return stats;
    } catch (error) {
      throw new Error(`Failed to get attendance stats: ${error.message}`);
    }
  }

  static async getAvailableIntakesAndSections(db, courseId) {
    try {
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      const enrollments = await enrollmentsCollection.find({
        $or: [
          { courseId: new ObjectId(courseId) },
          { courseId: courseId }
        ],
        status: 'active'
      }).toArray();
      
      // Get unique intakes and sections
      const intakes = [...new Set(enrollments.map(e => e.intake).filter(Boolean))];
      const sections = [...new Set(enrollments.map(e => e.section).filter(Boolean))];
      
      // Group sections by intake
      const intakeSectionMap = {};
      enrollments.forEach(enrollment => {
        if (enrollment.intake && enrollment.section) {
          if (!intakeSectionMap[enrollment.intake]) {
            intakeSectionMap[enrollment.intake] = new Set();
          }
          intakeSectionMap[enrollment.intake].add(enrollment.section);
        }
      });
      
      // Convert sets to arrays
      Object.keys(intakeSectionMap).forEach(intake => {
        intakeSectionMap[intake] = Array.from(intakeSectionMap[intake]);
      });
      
      return {
        intakes: intakes.sort(),
        sections: sections.sort(),
        intakeSectionMap
      };
    } catch (error) {
      throw new Error(`Failed to get available intakes and sections: ${error.message}`);
    }
  }

  static async getTeacherAttendanceReportTotal(db, courseId, intake, section) {
    try {
      const attendanceCollection = db.collection('attendance');
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      // Get enrollments for the course with filters (handle both ObjectId and string)
      let enrollmentQuery = {
        $or: [
          { courseId: new ObjectId(courseId) },
          { courseId: courseId }
        ],
        status: 'active'
      };
      
      if (intake) {
        enrollmentQuery.intake = intake;
      }
      
      if (section) {
        enrollmentQuery.section = section;
      }
      
      const enrollments = await enrollmentsCollection.find(enrollmentQuery).toArray();
      const studentIds = enrollments.map(e => e.studentId);
      
      // Convert studentIds to ObjectIds for the query (handle both string and ObjectId)
      const studentObjectIds = studentIds.map(id => 
        id instanceof ObjectId ? id : new ObjectId(id)
      );
      
      // Also create string versions for comparison
      const studentStrings = studentIds.map(id => id.toString());
      
      // Get ALL attendance records for these students (no date filter)
      const attendanceRecords = await attendanceCollection.find({
        $and: [
          {
            $or: [
              { courseId: courseId }, // String version
              { courseId: new ObjectId(courseId) } // ObjectId version
            ]
          },
          {
            $or: [
              { studentId: { $in: studentObjectIds } }, // ObjectId version
              { studentId: { $in: studentStrings } } // String version
            ]
          }
        ]
      }).sort({ date: 1 }).toArray();
      
      // Group attendance by student
      const studentAttendanceMap = {};
      enrollments.forEach(enrollment => {
        const studentIdKey = enrollment.studentId.toString();
        studentAttendanceMap[studentIdKey] = {
          studentId: enrollment.studentId,
          studentCustomId: enrollment.studentCustomId,
          studentName: enrollment.studentName,
          studentEmail: enrollment.studentEmail,
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
        const studentIdStr = record.studentId.toString();
        if (studentAttendanceMap[studentIdStr]) {
          studentAttendanceMap[studentIdStr].attendance.push({
            date: record.date,
            status: record.status,
            notes: record.notes
          });
          
          studentAttendanceMap[studentIdStr].totalDays++;
          if (record.status === 'present') {
            studentAttendanceMap[studentIdStr].presentDays++;
          } else {
            studentAttendanceMap[studentIdStr].absentDays++;
          }
        }
      });
      
      // Calculate attendance percentages and marks
      Object.values(studentAttendanceMap).forEach(student => {
        if (student.totalDays > 0) {
          student.attendancePercentage = Math.round(student.presentDays / student.totalDays * 100);
          student.attendanceMarks = this.calculateAttendanceMarks(student.attendancePercentage);
        } else {
          student.attendanceMarks = 0;
        }
      });
      
      return Object.values(studentAttendanceMap);
    } catch (error) {
      throw new Error(`Failed to get teacher attendance report total: ${error.message}`);
    }
  }

  static async getTeacherAttendanceReport(db, courseId, intake, section, month, year) {
    try {
      const attendanceCollection = db.collection('attendance');
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      // Create date range for the month (as strings)
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      // Get enrollments for the course with filters (handle both ObjectId and string)
      let enrollmentQuery = {
        $or: [
          { courseId: new ObjectId(courseId) },
          { courseId: courseId }
        ],
        status: 'active'
      };
      
      if (intake) {
        enrollmentQuery.intake = intake;
      }
      
      if (section) {
        enrollmentQuery.section = section;
      }
      
      const enrollments = await enrollmentsCollection.find(enrollmentQuery).toArray();
      const studentIds = enrollments.map(e => e.studentId);
      
      // Convert studentIds to ObjectIds for the query (handle both string and ObjectId)
      const studentObjectIds = studentIds.map(id => 
        id instanceof ObjectId ? id : new ObjectId(id)
      );
      
      // Also create string versions for comparison
      const studentStrings = studentIds.map(id => id.toString());
      
      // Get attendance records for the month (handle both ObjectId and string types)
      const attendanceRecords = await attendanceCollection.find({
        $and: [
          {
            $or: [
              { courseId: courseId }, // String version
              { courseId: new ObjectId(courseId) } // ObjectId version
            ]
          },
          {
            $or: [
              { studentId: { $in: studentObjectIds } }, // ObjectId version
              { studentId: { $in: studentStrings } } // String version
            ]
          },
          { date: { $gte: startDate, $lte: endDate } }
        ]
      }).sort({ date: 1 }).toArray();
      
      // Group attendance by student
      const studentAttendanceMap = {};
      enrollments.forEach(enrollment => {
        const studentIdKey = enrollment.studentId.toString();
        studentAttendanceMap[studentIdKey] = {
          studentId: enrollment.studentId,
          studentCustomId: enrollment.studentCustomId,
          studentName: enrollment.studentName,
          studentEmail: enrollment.studentEmail,
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
        const studentIdStr = record.studentId.toString();
        if (studentAttendanceMap[studentIdStr]) {
          studentAttendanceMap[studentIdStr].attendance.push({
            date: record.date,
            status: record.status,
            notes: record.notes
          });
          
          studentAttendanceMap[studentIdStr].totalDays++;
          if (record.status === 'present') {
            studentAttendanceMap[studentIdStr].presentDays++;
          } else {
            studentAttendanceMap[studentIdStr].absentDays++;
          }
        }
      });
      
      // Calculate attendance percentages and marks
      Object.values(studentAttendanceMap).forEach(student => {
        if (student.totalDays > 0) {
          student.attendancePercentage = Math.round(student.presentDays / student.totalDays * 100);
          student.attendanceMarks = this.calculateAttendanceMarks(student.attendancePercentage);
        } else {
          student.attendanceMarks = 0;
        }
      });
      
      return Object.values(studentAttendanceMap);
    } catch (error) {
      throw new Error(`Failed to get teacher attendance report: ${error.message}`);
    }
  }

  static async getStudentAttendanceReport(db, studentId, courseId, month, year) {
    try {
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      // Create date range for the month
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      // Get attendance records for the student
      const attendanceRecords = await attendanceCollection.find({
        studentId: new ObjectId(studentId),
        courseId: new ObjectId(courseId),
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 }).toArray();
      
      // Calculate summary
      const summary = {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(r => r.status === 'present').length,
        absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
        attendancePercentage: 0
      };
      
      if (summary.totalDays > 0) {
        summary.attendancePercentage = Math.round(summary.presentDays / summary.totalDays * 100);
      }
      
      return {
        summary,
        attendanceRecords: attendanceRecords.map(record => ({
          date: record.date,
          status: record.status,
          notes: record.notes,
          takenAt: record.takenAt
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get student attendance report: ${error.message}`);
    }
  }

  static async getAvailableMonths(db, courseId, studentId = null) {
    try {
      const attendanceCollection = db.collection('attendance');
      const { ObjectId } = require('mongodb');
      
      let query = { courseId: new ObjectId(courseId) };
      if (studentId) {
        query.studentId = new ObjectId(studentId);
      }
      
      const records = await attendanceCollection.find(query).toArray();
      
      // Get unique months
      const months = new Set();
      records.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      });
      
      return Array.from(months).sort().reverse(); // Most recent first
    } catch (error) {
      throw new Error(`Failed to get available months: ${error.message}`);
    }
  }
}

module.exports = Attendance;

