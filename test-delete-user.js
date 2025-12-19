// Test user deletion functionality
async function testDeleteUser() {
  try {
    console.log('Testing User Deletion...');
    
    // First, get all users to see what we have
    const usersResponse = await fetch('http://localhost:3000/api/users');
    const usersData = await usersResponse.json();
    console.log('Current users:', usersData.users?.length);
    
    // Find a test user to delete (not admin)
    const testUser = usersData.users?.find(user => user.role !== 'admin');
    if (testUser) {
      console.log('Found test user to delete:', testUser.name, testUser.email);
      
      // Test delete API
      const deleteResponse = await fetch(`http://localhost:3000/api/users/${testUser._id}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      console.log('Delete result:', deleteData);
      
      // Check users again
      const usersAfterResponse = await fetch('http://localhost:3000/api/users');
      const usersAfterData = await usersAfterResponse.json();
      console.log('Users after deletion:', usersAfterData.users?.length);
    } else {
      console.log('No test user found to delete');
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testDeleteUser();

