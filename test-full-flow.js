const http = require('http');

async function testFullFlow() {
  console.log('🧪 Testing Full Frontend Flow...\n');

  // Step 1: Get enrolled courses for the student
  console.log('📚 Step 1: Getting enrolled courses...');
  const enrolledCoursesOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/enrollments/student/68e0fd0296a3137f84eb1fe1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(enrolledCoursesOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Enrolled Courses Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('✅ Enrolled Courses Response:', JSON.stringify(response, null, 2));
          
          if (response.success && response.enrollments) {
            console.log(`\n📈 Found ${response.enrollments.length} enrolled courses`);
            
            response.enrollments.forEach((enrollment, index) => {
              console.log(`\n📚 Enrolled Course ${index + 1}:`);
              console.log(`  Course ID: ${enrollment.courseId} (type: ${typeof enrollment.courseId})`);
              console.log(`  Course Name: ${enrollment.courseName}`);
              console.log(`  Course Code: ${enrollment.courseCode}`);
              
              // Step 2: Test attendance for this specific course
              testAttendanceForSpecificCourse(enrollment.courseId, enrollment.courseName);
            });
          } else {
            console.log('❌ No enrolled courses found');
          }
        } catch (error) {
          console.log('❌ Failed to parse enrolled courses response:', error.message);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Enrolled courses request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

function testAttendanceForSpecificCourse(courseId, courseName) {
  console.log(`\n🔍 Step 2: Testing attendance for course: ${courseName} (${courseId})`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/attendance/report/student/all-courses/68e0fd0296a3137f84eb1fe1`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success && response.report) {
          console.log(`\n📊 Attendance report for student 68e0fd0296a3137f84eb1fe1:`);
          
          response.report.forEach((course, index) => {
            console.log(`\n📚 Course ${index + 1} in attendance report:`);
            console.log(`  CourseId: ${course.courseId} (type: ${typeof course.courseId})`);
            console.log(`  CourseName: ${course.courseName}`);
            console.log(`  Total Days: ${course.totalDays}`);
            
            // Test the frontend comparison
            console.log(`\n🔍 Frontend comparison test:`);
            console.log(`  course.courseId: ${course.courseId}`);
            console.log(`  courseId from enrollment: ${courseId}`);
            console.log(`  course.courseId === courseId: ${course.courseId === courseId}`);
            console.log(`  course.courseId.toString() === courseId.toString(): ${course.courseId.toString() === courseId.toString()}`);
            
            if (course.courseId.toString() === courseId.toString()) {
              console.log('  ✅ MATCH! This course will be displayed in the frontend.');
              console.log(`  📊 Attendance: ${course.totalDays} days, ${course.presentDays} present, ${course.absentDays} absent (${course.attendancePercentage}%)`);
            } else {
              console.log('  ❌ No match - this course will not be displayed.');
            }
          });
        }
      } catch (error) {
        console.log('❌ Failed to parse attendance response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Attendance request failed:', error.message);
  });

  req.end();
}

testFullFlow().catch(console.error);

