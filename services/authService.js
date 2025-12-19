const jwt = require('jsonwebtoken');
const { connectDB } = require('../database/config');
const User = require('../database/models/User');

const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  static async registerStudent(email, password, name, studentId, intake, section, department) {
    try {
      const db = await connectDB();
      const user = await User.createUser(db, { 
        email, 
        password, 
        name, 
        role: 'student',
        studentId,
        intake,
        section,
        department
      });
      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      throw new Error(`Student registration failed: ${error.message}`);
    }
  }

  static async login(email, password) {
    try {
      const db = await connectDB();
      const user = await User.authenticateUser(db, email, password);
      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  static generateToken(user) {
    return jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async getAllUsers(role = null) {
    try {
      const db = await connectDB();
      return await User.getAllUsers(db, role);
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  static async createTeacher(email, password, name, department, createdBy) {
    try {
      const db = await connectDB();
      const teacher = await User.createTeacher(db, { email, password, name, department }, createdBy);
      return teacher;
    } catch (error) {
      throw new Error(`Failed to create teacher: ${error.message}`);
    }
  }

  static async deleteUser(userId) {
    try {
      const db = await connectDB();
      const usersCollection = db.collection('users');
      const enrollmentsCollection = db.collection('enrollments');
      const { ObjectId } = require('mongodb');
      
      // Convert string ID to ObjectId
      const objectId = new ObjectId(userId);
      
      // First, delete all enrollments for this user
      const enrollmentResult = await enrollmentsCollection.deleteMany({
        $or: [
          { studentId: userId },
          { studentId: objectId }
        ]
      });
      console.log(`Deleted ${enrollmentResult.deletedCount} enrollments for user ${userId}`);
      
      // Then delete the user
      const result = await usersCollection.deleteOne({ _id: objectId });
      
      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  static async createSuperAdmin() {
    try {
      const db = await connectDB();
      
      // Check if super admin already exists
      const existingAdmin = await User.findByEmail(db, 'admin@gmail.com');
      if (existingAdmin) {
        console.log('Super admin already exists');
        return existingAdmin;
      }
      
      // Create super admin
      const admin = await User.createUser(db, {
        email: 'admin@gmail.com',
        password: 'password123',
        role: 'superadmin',
        name: 'Super Admin'
      });
      
      console.log('Super admin created successfully');
      return admin;
    } catch (error) {
      console.error('Error creating super admin:', error);
      throw error;
    }
  }
}

module.exports = AuthService;

