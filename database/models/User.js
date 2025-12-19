const bcrypt = require('bcryptjs');

class User {
  constructor(email, password, role = 'student', name = '', studentId = '', intake = '', section = '', department = 'CSE') {
    this.email = email;
    this.password = password;
    this.role = role; // 'superadmin', 'teacher', or 'student'
    this.name = name;
    this.studentId = studentId; // Only for students
    this.intake = intake; // Only for students (e.g., "2024", "Fall 2024")
    this.section = section; // Only for students (e.g., "A", "B", "Morning", "Evening")
    this.department = department; // Department (e.g., "CSE", "EEE", "ME")
    this.createdAt = new Date();
    this.isActive = true;
    this.createdBy = null; // For teachers, track who created them
  }

  async hashPassword() {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  static async createUser(db, userData) {
    const usersCollection = db.collection('users');
    const user = new User(
      userData.email, 
      userData.password, 
      userData.role, 
      userData.name,
      userData.studentId || '',
      userData.intake || '',
      userData.section || '',
      userData.department || 'CSE'
    );
    
    // Set createdBy for teachers
    if (userData.role === 'teacher' && userData.createdBy) {
      user.createdBy = userData.createdBy;
    }
    
    await user.hashPassword();
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: user.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Check if student ID already exists (for students)
    if (userData.role === 'student' && userData.studentId) {
      const existingStudent = await usersCollection.findOne({ studentId: userData.studentId });
      if (existingStudent) {
        throw new Error('Student with this ID already exists');
      }
    }
    
    const result = await usersCollection.insertOne(user);
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { 
      ...userWithoutPassword, 
      _id: result.insertedId.toString() // Convert ObjectId to string
    };
  }

  static async findByEmail(db, email) {
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ email });
  }

  static async findById(db, id) {
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ _id: id });
  }

  static async getAllUsers(db, role = null) {
    const usersCollection = db.collection('users');
    const filter = role ? { role } : {};
    const users = await usersCollection.find(filter).toArray();
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  static async createTeacher(db, teacherData, createdBy) {
    const userData = {
      ...teacherData,
      role: 'teacher',
      createdBy: createdBy
    };
    return await User.createUser(db, userData);
  }

  static async authenticateUser(db, email, password) {
    const user = await User.findByEmail(db, email);
    if (!user) {
      throw new Error('User not found');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }
    
    // Return user without password, ensuring _id is properly handled
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      _id: user._id.toString() // Convert ObjectId to string
    };
  }
}

module.exports = User;
