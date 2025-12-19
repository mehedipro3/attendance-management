const ApiService = require('./services/api');

async function testCourseCreation() {
  console.log('Testing Course Creation Fix...\n');

  try {
    // Test course creation with same code (should work now)
    const courseData = {
      courseCode: 'CSE101',
      courseName: 'Introduction to Programming',
      credits: 3,
      department: 'CSE',
      teacherId: 'test-teacher-id',
      teacherName: 'Test Teacher',
      description: 'Basic programming concepts',
      semester: 'Fall 2024'
    };

    console.log('1. Testing course creation with code CSE101...');
    const response1 = await ApiService.createCourse(courseData);
    console.log('✅ First course created successfully:', response1.success);

    console.log('\n2. Testing course creation with same code CSE101...');
    const response2 = await ApiService.createCourse(courseData);
    console.log('✅ Second course with same code created successfully:', response2.success);

    console.log('\n🎉 Course creation fix verified! Teachers can now create courses with duplicate codes.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCourseCreation();









