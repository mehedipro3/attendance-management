// Test registration
async function testRegister() {
  try {
    const response = await fetch('http://192.168.0.102:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123',
        name: 'Test User'
      })
    });
    
    const data = await response.json();
    console.log('Registration test result:', data);
  } catch (error) {
    console.error('Registration test error:', error.message);
  }
}

testRegister();


