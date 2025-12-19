const { connectDB } = require('./database/config');

async function cleanupOrphanedEnrollments() {
  try {
    console.log('Cleaning up orphaned enrollments...');
    
    const db = await connectDB();
    const coursesCollection = db.collection('courses');
    const enrollmentsCollection = db.collection('enrollments');
    
    // Get all course IDs that exist
    const existingCourses = await coursesCollection.find({}).toArray();
    const existingCourseIds = existingCourses.map(course => course._id.toString());
    
    console.log(`Found ${existingCourseIds.length} existing courses`);
    
    // Find enrollments that reference non-existent courses
    const allEnrollments = await enrollmentsCollection.find({}).toArray();
    console.log(`Found ${allEnrollments.length} total enrollments`);
    
    const orphanedEnrollments = allEnrollments.filter(enrollment => {
      return !existingCourseIds.includes(enrollment.courseId.toString());
    });
    
    console.log(`Found ${orphanedEnrollments.length} orphaned enrollments`);
    
    if (orphanedEnrollments.length > 0) {
      // Delete orphaned enrollments
      const result = await enrollmentsCollection.deleteMany({
        _id: { $in: orphanedEnrollments.map(e => e._id) }
      });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned enrollments`);
    } else {
      console.log('✅ No orphaned enrollments found');
    }
    
    console.log('Cleanup completed!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupOrphanedEnrollments();








