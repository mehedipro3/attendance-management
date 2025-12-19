const Course = require('../database/models/Course');
const { connectDB } = require('../database/config');

class CourseService {
  static async createCourse(courseData) {
    try {
      const db = await connectDB();
      const course = await Course.createCourse(db, courseData);
      return { success: true, course };
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  static async getCoursesByTeacher(teacherId) {
    try {
      const db = await connectDB();
      const courses = await Course.getCoursesByTeacher(db, teacherId);
      return { success: true, courses };
    } catch (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }
  }

  static async getCoursesByDepartment(department) {
    try {
      const db = await connectDB();
      const courses = await Course.getCoursesByDepartment(db, department);
      return { success: true, courses };
    } catch (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }
  }

  static async getAllCourses() {
    try {
      const db = await connectDB();
      const courses = await Course.getAllCourses(db);
      return { success: true, courses };
    } catch (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }
  }

  static async updateCourse(courseId, updateData) {
    try {
      const db = await connectDB();
      const result = await Course.updateCourse(db, courseId, updateData);
      return { success: true, ...result };
    } catch (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  static async deleteCourse(courseId) {
    try {
      const db = await connectDB();
      const result = await Course.deleteCourse(db, courseId);
      return { success: true, ...result };
    } catch (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }
}

module.exports = CourseService;


