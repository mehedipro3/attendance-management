const http = require('http');

async function testRealStudent() {
  console.log('🧪 Testing with REAL student data...\n');

  // Use the actual student ID from the database
  const realStudentId = '68e0fd0296a3137f84eb1fe1'; // Rohan's ID
  const realCourseId = '68e0fd1796a3137f84eb1fe2'; // C++ course ID

  console.log(`👤 Testing with student: ${realStudentId} (Rohan)`);
  console.log(`📚 Testing with course: ${realCourseId} (C++)`);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/attendance/report/student/all-courses/${realStudentId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 API Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('✅ API Response:', JSON.stringify(response, null, 2));
          
          if (response.success && response.report) {
            console.log(`\n📈 Found ${response.report.length} courses in report`);
            
            response.report.forEach((course, index) => {
              console.log(`\n📚 Course ${index + 1}:`);
              console.log(`  CourseId: ${course.courseId} (type: ${typeof course.courseId})`);
              console.log(`  CourseName: ${course.courseName}`);
              console.log(`  Total Days: ${course.totalDays}`);
              console.log(`  Present Days: ${course.presentDays}`);
              console.log(`  Absent Days: ${course.absentDays}`);
              console.log(`  Attendance Percentage: ${course.attendancePercentage}%`);
              
              console.log(`\n📅 Attendance Records (${course.attendance.length}):`);
              course.attendance.forEach((record, recordIndex) => {
                console.log(`    ${recordIndex + 1}. ${record.date} - ${record.status} ${record.notes ? `(${record.notes})` : ''}`);
              });
            });
            
            // Test the frontend comparison logic with real course ID
            console.log('\n🔍 Testing Frontend Comparison Logic:');
            console.log(`Real course ID: ${realCourseId}`);
            
            response.report.forEach((course, index) => {
              console.log(`\nCourse ${index + 1} comparison:`);
              console.log(`  course.courseId: ${course.courseId} (type: ${typeof course.courseId})`);
              console.log(`  realCourseId: ${realCourseId} (type: ${typeof realCourseId})`);
              console.log(`  course.courseId === realCourseId: ${course.courseId === realCourseId}`);
              console.log(`  course.courseId.toString() === realCourseId.toString(): ${course.courseId.toString() === realCourseId.toString()}`);
              
              if (course.courseId.toString() === realCourseId.toString()) {
                console.log('  ✅ MATCH FOUND! This course should be displayed in the frontend.');
              } else {
                console.log('  ❌ No match - this course will not be displayed.');
              }
            });
            
          } else {
            console.log('❌ No report data found');
          }
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

testRealStudent().catch(console.error);

