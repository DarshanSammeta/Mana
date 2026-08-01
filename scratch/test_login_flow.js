const axios = require('axios');
require('dotenv').config();

async function run() {
  console.log('--- TESTING LOGIN TO BOOKINGS FLOW ---');
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }, { validateStatus: false });

    if (loginRes.status !== 200) {
      console.log('Login Failed:', loginRes.data);
      return;
    }

    const token = loginRes.data.accessToken;
    console.log('Login Successful. Token received.');

    // 2. Fetch Bookings
    console.log('Fetching bookings...');
    const bookingsRes = await axios.get('http://localhost:3000/api/customer/bookings', {
      headers: { 'Authorization': `Bearer ${token}` },
      validateStatus: false
    });

    console.log('Status Code:', bookingsRes.status);
    if (bookingsRes.status === 200) {
      console.log('PASS: Successfully fetched bookings with new JWT logic.');
    } else {
      console.log('FAIL: Could not fetch bookings. Status:', bookingsRes.status);
      console.log('Body:', bookingsRes.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
