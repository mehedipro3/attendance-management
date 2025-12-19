// Using built-in fetch (Node.js 18+)

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
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
    console.log('Login test result:', data);
  } catch (error) {
    console.error('Login test error:', error.message);
  }
}

testLogin();
