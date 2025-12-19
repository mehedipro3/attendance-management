const { MongoClient, ObjectId } = require('mongodb');

async function checkExistingData() {
  console.log('🔍 Checking EXISTING Database Data (READ ONLY)...\n');

  try {
    // Connect to MongoDB Atlas
    const MONGODB_URI = 'mongodb+srv://admin:admin123@db.ru3huqi.mongodb.net/?retryWrites=true&w=majority&appName=db';
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('sdp_app');

    console.log('✅ Connected to MongoDB (READ ONLY)');

    // Check all collections WITHOUT modifying anything
    const collections = ['users', 'courses', 'enrollments', 'attendance'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      const documents = await collection.find({}).toArray();
      
      console.log(`\n📊 ${collectionName.toUpperCase()} Collection:`);
      console.log(`  Count: ${count}`);
      
      if (documents.length > 0) {
        console.log(`  Documents:`);
        documents.forEach((doc, index) => {
          console.log(`    ${index + 1}. ID: ${doc._id}`);
          if (collectionName === 'users') {
            console.log(`       Name: ${doc.name}, Email: ${doc.email}, Role: ${doc.role}`);
            if (doc.studentId) console.log(`       Student ID: ${doc.studentId}`);
          } else if (collectionName === 'courses') {
            console.log(`       Code: ${doc.courseCode}, Name: ${doc.courseName}`);
            console.log(`       Active: ${doc.isActive}, Teacher: ${doc.teacherId}`);
          } else if (collectionName === 'enrollments') {
            console.log(`       Student: ${doc.studentName}, Course: ${doc.courseName}, Status: ${doc.status}`);
            console.log(`       Student ID: ${doc.studentId}, Course ID: ${doc.courseId}`);
          } else if (collectionName === 'attendance') {
            console.log(`       Student: ${doc.studentId}, Course: ${doc.courseId}, Date: ${doc.date}, Status: ${doc.status}`);
          }
        });
      }
    }

    await client.close();
    console.log('\n✅ Database check complete (NO DATA MODIFIED)!');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkExistingData();

