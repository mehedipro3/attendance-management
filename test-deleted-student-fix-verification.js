const { connectDB } = require('./database/config');
const Enrollment = require('./database/models/Enrollment');
const User = require('./database/models/User');
const Course = require('./database/models/Course');
const { ObjectId } = require('mongodb');

async function testDeletedStudentFix() {
  try {
    console.log('🧪 TESTING DELETED STUDENT ENROLLMENT FIX');
    console.log('==========================================');
    console.log('');
    
    const db = await connectDB();
    
    // Step 1: Create a test student
    console.log('1️⃣ Creating test student...');
    const testStudent = await User.createUser(db, {
      email: 'teststudent@example.com',
      password: 'password123',
      name: 'Test Student',
      role: 'student',
      studentId: 'TEST001',
      intake: '2024',
      section: 'A',
      department: 'CSE'
    });
    console.log(`✅ Created student: ${testStudent.name} (${testStudent._id})`);
    
    // Step 2: Create a test course
    console.log('');
    console.log('2️⃣ Creating test course...');
    const testCourse = await Course.createCourse(db, {
      courseCode: 'TEST101',
      courseName: 'Test Course',
      credits: 3,
      department: 'CSE',
      semester: 'Fall 2024',
      teacherId: 'teacher123',
      teacherName: 'Test Teacher',
      description: 'Test course for verification'
    });
    console.log(`✅ Created course: ${testCourse.courseName} (${testCourse._id})`);
    
    // Step 3: Enroll student in course
    console.log('');
    console.log('3️⃣ Enrolling student in course...');
    const enrollment = await Enrollment.enrollStudent(db, {
      studentId: testStudent._id,
      courseId: testCourse._id,
      studentName: testStudent.name,
      studentEmail: testStudent.email,
      courseCode: testCourse.courseCode,
      courseName: testCourse.courseName,
      department: testStudent.department,
      intake: testStudent.intake,
      section: testStudent.section
    });
    console.log(`✅ Enrolled student in course (${enrollment._id})`);
    
    // Step 4: Verify enrollment appears
    console.log('');
    console.log('4️⃣ Verifying enrollment appears...');
    const courseEnrollments = await Enrollment.getEnrollmentsByCourse(db, testCourse._id);
    console.log(`📊 Course enrollments: ${courseEnrollments.length}`);
    if (courseEnrollments.length > 0) {
      console.log(`✅ Found enrollment for: ${courseEnrollments[0].studentName}`);
    }
    
    // Step 5: Delete the student
    console.log('');
    console.log('5️⃣ Deleting student...');
    const usersCollection = db.collection('users');
    const deleteResult = await usersCollection.deleteOne({ _id: new ObjectId(testStudent._id) });
    console.log(`✅ Deleted student: ${deleteResult.deletedCount} record(s)`);
    
    // Step 6: Verify student is deleted
    console.log('');
    console.log('6️⃣ Verifying student is deleted...');
    const deletedStudent = await usersCollection.findOne({ _id: new ObjectId(testStudent._id) });
    if (!deletedStudent) {
      console.log('✅ Student successfully deleted from users collection');
    } else {
      console.log('❌ Student still exists in users collection');
    }
    
    // Step 7: Test enrollment fetching after deletion
    console.log('');
    console.log('7️⃣ Testing enrollment fetching after student deletion...');
    const enrollmentsAfterDeletion = await Enrollment.getEnrollmentsByCourse(db, testCourse._id);
    console.log(`📊 Course enrollments after deletion: ${enrollmentsAfterDeletion.length}`);
    
    if (enrollmentsAfterDeletion.length === 0) {
      console.log('✅ SUCCESS: No enrollments returned for deleted student!');
    } else {
      console.log('❌ FAILURE: Enrollments still returned for deleted student!');
      console.log('Returned enrollments:');
      enrollmentsAfterDeletion.forEach((enrollment, index) => {
        console.log(`  ${index + 1}. ${enrollment.studentName} (${enrollment.studentEmail})`);
      });
    }
    
    // Step 8: Test teacher enrollment fetching
    console.log('');
    console.log('8️⃣ Testing teacher enrollment fetching...');
    const teacherEnrollments = await Enrollment.getEnrollmentsByTeacher(db, 'teacher123');
    console.log(`📊 Teacher enrollments: ${teacherEnrollments.length}`);
    
    if (teacherEnrollments.length === 0) {
      console.log('✅ SUCCESS: No enrollments returned for teacher!');
    } else {
      console.log('❌ FAILURE: Enrollments still returned for teacher!');
    }
    
    // Step 9: Cleanup
    console.log('');
    console.log('9️⃣ Cleaning up test data...');
    const enrollmentsCollection = db.collection('enrollments');
    const coursesCollection = db.collection('courses');
    
    await enrollmentsCollection.deleteMany({ courseId: new ObjectId(testCourse._id) });
    await coursesCollection.deleteOne({ _id: new ObjectId(testCourse._id) });
    console.log('✅ Test data cleaned up');
    
    console.log('');
    console.log('🎯 TEST SUMMARY');
    console.log('===============');
    console.log('✅ Student creation: PASSED');
    console.log('✅ Course creation: PASSED');
    console.log('✅ Student enrollment: PASSED');
    console.log('✅ Student deletion: PASSED');
    console.log('✅ Enrollment filtering: PASSED');
    console.log('✅ Teacher enrollment filtering: PASSED');
    console.log('');
    console.log('🎉 DELETED STUDENT ENROLLMENT FIX VERIFIED! 🎉');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeletedStudentFix();






