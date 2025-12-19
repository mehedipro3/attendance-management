const { connectDB } = require('./database/config');
const { ObjectId } = require('mongodb');

async function testEnrollmentCleanup() {
  try {
    console.log('🔍 Testing Enrollment Cleanup...');
    console.log('');
    
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const enrollmentsCollection = db.collection('enrollments');
    
    // Get all enrollments
    const allEnrollments = await enrollmentsCollection.find({}).toArray();
    console.log(`📊 Total enrollments in database: ${allEnrollments.length}`);
    
    // Check for orphaned enrollments
    let orphanedCount = 0;
    const orphanedEnrollments = [];
    
    for (const enrollment of allEnrollments) {
      const studentExists = await usersCollection.findOne({
        _id: new ObjectId(enrollment.studentId)
      });
      
      if (!studentExists) {
        orphanedCount++;
        orphanedEnrollments.push(enrollment);
        console.log(`❌ Orphaned enrollment found: ${enrollment.studentName} (${enrollment.studentEmail})`);
      }
    }
    
    console.log('');
    console.log(`🚨 Found ${orphanedCount} orphaned enrollments`);
    
    if (orphanedCount > 0) {
      console.log('');
      console.log('🧹 Cleaning up orphaned enrollments...');
      
      // Delete orphaned enrollments
      const deleteResult = await enrollmentsCollection.deleteMany({
        _id: { $in: orphanedEnrollments.map(e => e._id) }
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned enrollments`);
    }
    
    // Verify cleanup
    const remainingEnrollments = await enrollmentsCollection.find({}).toArray();
    console.log(`📊 Remaining enrollments: ${remainingEnrollments.length}`);
    
    // Test enrollment fetching
    console.log('');
    console.log('🧪 Testing enrollment fetching methods...');
    
    if (remainingEnrollments.length > 0) {
      const testCourseId = remainingEnrollments[0].courseId;
      console.log(`Testing getEnrollmentsByCourse for course: ${testCourseId}`);
      
      const Enrollment = require('./database/models/Enrollment');
      const courseEnrollments = await Enrollment.getEnrollmentsByCourse(db, testCourseId);
      console.log(`✅ Course enrollments returned: ${courseEnrollments.length}`);
      
      // Verify all returned students exist
      for (const enrollment of courseEnrollments) {
        const studentExists = await usersCollection.findOne({
          _id: new ObjectId(enrollment.studentId)
        });
        if (!studentExists) {
          console.log(`❌ ERROR: Enrollment returned for non-existent student: ${enrollment.studentName}`);
        } else {
          console.log(`✅ Valid enrollment: ${enrollment.studentName}`);
        }
      }
    }
    
    console.log('');
    console.log('✅ Enrollment cleanup test completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup test:', error);
  }
}

testEnrollmentCleanup();






