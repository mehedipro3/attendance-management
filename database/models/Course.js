class Course {
  constructor(data) {
    this.courseCode = data.courseCode;
    this.courseName = data.courseName;
    this.department = data.department;
    this.credits = data.credits || 3;
    this.description = data.description || '';
    this.teacherId = data.teacherId;
    this.teacherName = data.teacherName;
    this.semester = data.semester || 'Fall 2024';
    this.createdAt = new Date();
    this.isActive = true;
  }

  toJSON() {
    return {
      _id: this._id,
      courseCode: this.courseCode,
      courseName: this.courseName,
      department: this.department,
      credits: this.credits,
      description: this.description,
      teacherId: this.teacherId,
      teacherName: this.teacherName,
      semester: this.semester,
      createdAt: this.createdAt,
      isActive: this.isActive
    };
  }

  static async createCourse(db, courseData) {
    const coursesCollection = db.collection('courses');
    
    const course = new Course(courseData);
    const result = await coursesCollection.insertOne(course);
    
    return {
      _id: result.insertedId,
      ...course.toJSON()
    };
  }

  static async getCoursesByTeacher(db, teacherId) {
    const coursesCollection = db.collection('courses');
    const courses = await coursesCollection.find({ 
      teacherId: teacherId,
      isActive: true 
    }).toArray();
    
    return courses.map(course => {
      const { _id, ...courseData } = course;
      return { _id: _id.toString(), ...courseData };
    });
  }

  static async getCoursesByDepartment(db, department) {
    const coursesCollection = db.collection('courses');
    const courses = await coursesCollection.find({ 
      department: department,
      isActive: true 
    }).toArray();
    
    return courses.map(course => {
      const { _id, ...courseData } = course;
      return { _id: _id.toString(), ...courseData };
    });
  }

  static async getAllCourses(db) {
    const coursesCollection = db.collection('courses');
    const courses = await coursesCollection.find({ isActive: true }).toArray();
    
    return courses.map(course => {
      const { _id, ...courseData } = course;
      return { _id: _id.toString(), ...courseData };
    });
  }

  static async updateCourse(db, courseId, updateData) {
    const coursesCollection = db.collection('courses');
    const { ObjectId } = require('mongodb');
    
    const result = await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Course not found');
    }
    
    return { success: true };
  }

  static async deleteCourse(db, courseId) {
    const coursesCollection = db.collection('courses');
    const enrollmentsCollection = db.collection('enrollments');
    const { ObjectId } = require('mongodb');
    
    // First, delete all enrollments for this course (handle both string and ObjectId)
    const enrollmentResult = await enrollmentsCollection.deleteMany({
      $or: [
        { courseId: courseId },
        { courseId: new ObjectId(courseId) }
      ]
    });
    
    console.log(`Deleted ${enrollmentResult.deletedCount} enrollments for course ${courseId}`);
    
    // Then delete the course
    const result = await coursesCollection.deleteOne({
      _id: new ObjectId(courseId)
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Course not found');
    }
    
    console.log(`Deleted course ${courseId}`);
    return { success: true };
  }
}

module.exports = Course;
