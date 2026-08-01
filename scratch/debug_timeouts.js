const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- DEBUGGING TIMEOUTS ---');
  try {
    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@manaevents.com',
      password: 'Mana@123'
    }, { timeout: 60000 });

    const token = loginRes.data.accessToken;
    console.log('Login successful.');

    // 2. Test Notifications (GET)
    console.log('Testing GET /api/notifications?limit=1...');
    const startNotif = Date.now();
    try {
      const notifRes = await axios.get(`${BASE_URL}/api/notifications?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });
      console.log(`Notifications Success: ${notifRes.status} in ${Date.now() - startNotif}ms`);
    } catch (err) {
      console.log(`Notifications Failed: ${err.message} after ${Date.now() - startNotif}ms`);
      if (err.response) console.log('Response data:', err.response.data);
    }

    // 3. Test Bookings (POST) - just a minimal body that might trigger the start of the logic
    console.log('Testing POST /api/bookings...');
    const startBookings = Date.now();
    try {
      const bookingsRes = await axios.post(`${BASE_URL}/api/bookings`, {
        idempotencyKey: 'test-idempotency-' + Date.now()
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
        validateStatus: false
      });
      console.log(`Bookings Response: ${bookingsRes.status} in ${Date.now() - startBookings}ms`);
      console.log('Response data:', bookingsRes.data);
    } catch (err) {
      console.log(`Bookings Failed: ${err.message} after ${Date.now() - startBookings}ms`);
    }

  } catch (error) {
    console.error('Global Error:', error.message);
    if (error.response) console.error('Global Response data:', error.response.data);
  }
}

run();
