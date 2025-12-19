const ApiService = require('./services/api');

async function testEnrollment() {
  console.log('Testing Enrollment System...\n');

  try {
    // Test 1: Get available courses for a student
    console.log('1. Testing getAvailableCoursesForStudent...');
    const availableResponse = await ApiService.getAvailableCoursesForStudent(
      'test-student-id',
      'CSE',
      '2024'
    );
    console.log('Available courses:', availableResponse);

    // Test 2: Enroll a student in a course
    console.log('\n2. Testing enrollStudent...');
    const enrollmentData = {
      studentId: 'test-student-id',
      courseId: 'test-course-id',
      studentName: 'Test Student',
      studentEmail: 'test@student.com',
      courseCode: 'CSE101',
      courseName: 'Test Course',
      department: 'CSE',
      intake: '2024'
    };
    
    const enrollResponse = await ApiService.enrollStudent(enrollmentData);
    console.log('Enrollment result:', enrollResponse);

    // Test 3: Get student enrollments
    console.log('\n3. Testing getStudentEnrollments...');
    const studentEnrollments = await ApiService.getStudentEnrollments('test-student-id');
    console.log('Student enrollments:', studentEnrollments);

    // Test 4: Get teacher enrollments
    console.log('\n4. Testing getTeacherEnrollments...');
    const teacherEnrollments = await ApiService.getTeacherEnrollments('test-teacher-id');
    console.log('Teacher enrollments:', teacherEnrollments);

    console.log('\n✅ All enrollment tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnrollment();



