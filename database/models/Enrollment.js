class Enrollment {
  constructor(data) {
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.studentName = data.studentName;
    this.studentEmail = data.studentEmail;
    this.studentCustomId = data.studentCustomId; // Custom student ID set by user
    this.courseCode = data.courseCode;
    this.courseName = data.courseName;
    this.department = data.department;
    this.intake = data.intake;
    this.section = data.section;
    this.enrolledAt = new Date();
    this.status = 'active'; // active, dropped
  }

  toJSON() {
    return {
      _id: this._id,
      studentId: this.studentId,
      courseId: this.courseId,
      studentName: this.studentName,
      studentEmail: this.studentEmail,
      studentCustomId: this.studentCustomId,
      courseCode: this.courseCode,
      courseName: this.courseName,
      department: this.department,
      intake: this.intake,
      section: this.section,
      enrolledAt: this.enrolledAt,
      status: this.status
    };
  }

  static async enrollStudent(db, enrollmentData) {
    const enrollmentsCollection = db.collection('enrollments');
    
    // Check if student is already enrolled in this course
    const existingEnrollment = await enrollmentsCollection.findOne({
      studentId: enrollmentData.studentId,
      courseId: enrollmentData.courseId,
      status: 'active'
    });
    
    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this course');
    }
    
    const enrollment = new Enrollment(enrollmentData);
    const result = await enrollmentsCollection.insertOne(enrollment);
    
    return {
      _id: result.insertedId,
      ...enrollment.toJSON()
    };
  }

  static async getEnrollmentsByStudent(db, studentId) {
    const enrollmentsCollection = db.collection('enrollments');
    const enrollments = await enrollmentsCollection.find({
      studentId: studentId,
      status: 'active'
    }).toArray();
    
    return enrollments.map(enrollment => {
      const { _id, ...enrollmentData } = enrollment;
      return { _id: _id.toString(), ...enrollmentData };
    });
  }

  static async getEnrollmentsByCourse(db, courseId) {
    const enrollmentsCollection = db.collection('enrollments');
    const { ObjectId } = require('mongodb');
    
    // Use aggregation to join with users collection and filter out deleted students
    const enrollments = await enrollmentsCollection.aggregate([
      {
        $match: {
          $or: [
            { courseId: new ObjectId(courseId) },
            { courseId: courseId }
          ],
          status: 'active'
        }
      },
      {
        $addFields: {
          studentIdObjectId: {
            $cond: {
              if: { $eq: [{ $type: '$studentId' }, 'objectId'] },
              then: '$studentId',
              else: { $toObjectId: '$studentId' }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentIdObjectId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $match: {
          'student.0': { $exists: true } // Only include enrollments where student exists
        }
      },
      {
        $project: {
          _id: 1,
          studentId: 1,
          studentName: 1,
          studentEmail: 1,
          courseCode: 1,
          courseName: 1,
          department: 1,
          intake: 1,
          section: 1,
          enrolledAt: 1,
          status: 1,
          courseId: 1
        }
      }
    ]).toArray();
    
    return enrollments.map(enrollment => {
      const { _id, ...enrollmentData } = enrollment;
      return { _id: _id.toString(), ...enrollmentData };
    });
  }

  // Fast method for attendance - no user verification needed
  static async getEnrollmentsByCourseFast(db, courseId) {
    const enrollmentsCollection = db.collection('enrollments');
    const { ObjectId } = require('mongodb');
    
    // Simple query without aggregation - much faster
    const enrollments = await enrollmentsCollection.find({
      $or: [
        { courseId: new ObjectId(courseId) },
        { courseId: courseId }
      ],
      status: 'active'
    }).toArray();
    
    return enrollments.map(enrollment => {
      const { _id, ...enrollmentData } = enrollment;
      return { _id: _id.toString(), ...enrollmentData };
    });
  }

  static async getEnrollmentsByTeacher(db, teacherId) {
    const enrollmentsCollection = db.collection('enrollments');
    const { ObjectId } = require('mongodb');
    
    const enrollments = await enrollmentsCollection.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $match: {
          'course.teacherId': teacherId,
          status: 'active'
        }
      },
      {
        $addFields: {
          studentIdObjectId: {
            $cond: {
              if: { $eq: [{ $type: '$studentId' }, 'objectId'] },
              then: '$studentId',
              else: { $toObjectId: '$studentId' }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentIdObjectId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $match: {
          'student.0': { $exists: true } // Only include enrollments where student exists
        }
      },
      {
        $project: {
          _id: 1,
          studentId: 1,
          studentName: 1,
          studentEmail: 1,
          courseCode: 1,
          courseName: 1,
          department: 1,
          intake: 1,
          section: 1,
          enrolledAt: 1,
          status: 1,
          courseId: 1
        }
      }
    ]).toArray();
    
    return enrollments.map(enrollment => {
      const { _id, ...enrollmentData } = enrollment;
      return { _id: _id.toString(), ...enrollmentData };
    });
  }

  static async dropEnrollment(db, enrollmentId) {
    const enrollmentsCollection = db.collection('enrollments');
    const { ObjectId } = require('mongodb');
    
    const result = await enrollmentsCollection.updateOne(
      { _id: new ObjectId(enrollmentId) },
      { $set: { status: 'dropped' } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Enrollment not found');
    }
    
    return { success: true };
  }

  static async getAvailableCoursesForStudent(db, studentId, studentDepartment, studentIntake) {
    const coursesCollection = db.collection('courses');
    const enrollmentsCollection = db.collection('enrollments');
    
    // Get all courses for the student's department
    const courses = await coursesCollection.find({
      department: studentDepartment
    }).toArray();
    
    // Get student's current enrollments
    const studentEnrollments = await enrollmentsCollection.find({
      studentId: studentId,
      status: 'active'
    }).toArray();
    
    const enrolledCourseIds = studentEnrollments.map(e => e.courseId);
    
    // Filter out courses the student is already enrolled in
    const availableCourses = courses.filter(course => 
      !enrolledCourseIds.some(enrolledId => 
        enrolledId.toString() === course._id.toString()
      )
    );
    
    return availableCourses.map(course => {
      const { _id, ...courseData } = course;
      return { _id: _id.toString(), ...courseData };
    });
  }
}

module.exports = Enrollment;
