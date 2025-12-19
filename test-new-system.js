// Test the new 3-role system
async function testNewSystem() {
  try {
    console.log('Testing Super Admin Login...');
    const adminResponse = await fetch('http://192.168.0.102:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'password123' })
    });
    const adminData = await adminResponse.json();
    console.log('Super Admin Login:', adminData.success ? 'SUCCESS' : 'FAILED');
    console.log('Role:', adminData.user?.role);

    console.log('\nTesting Student Registration...');
    const studentResponse = await fetch('http://192.168.0.102:3000/api/auth/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@test.com',
        password: 'student123',
        name: 'Test Student',
        studentId: 'STU001',
        intake: '2024'
      })
    });
    const studentData = await studentResponse.json();
    console.log('Student Registration:', studentData.success ? 'SUCCESS' : 'FAILED');
    console.log('Student Role:', studentData.user?.role);

    console.log('\nTesting Teacher Creation...');
    const teacherResponse = await fetch('http://192.168.0.102:3000/api/users/create-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@test.com',
        password: 'teacher123',
        name: 'Test Teacher',
        createdBy: adminData.user?._id
      })
    });
    const teacherData = await teacherResponse.json();
    console.log('Teacher Creation:', teacherData.success ? 'SUCCESS' : 'FAILED');
    console.log('Teacher Role:', teacherData.teacher?.role);

    console.log('\nTesting Get All Users...');
    const usersResponse = await fetch('http://192.168.0.102:3000/api/users');
    const usersData = await usersResponse.json();
    console.log('Get Users:', usersData.success ? 'SUCCESS' : 'FAILED');
    console.log('Total Users:', usersData.users?.length);
    console.log('User Roles:', usersData.users?.map(u => u.role));

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testNewSystem();

