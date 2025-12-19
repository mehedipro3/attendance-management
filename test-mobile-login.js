// Test login with IP address (like mobile app would use)
async function testMobileLogin() {
  try {
    const response = await fetch('http://192.168.0.102:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Mobile login test result:', data);
  } catch (error) {
    console.error('Mobile login test error:', error.message);
  }
}

testMobileLogin();


