const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Real IDs from the database
const payload = {
  vendorId: "091be15f-7604-4a52-b62d-f0227c3fddc7",
  eventTypeId: "44b143cd-adb5-485a-a1ba-35d9d72a1cf4",
  categoryId: "bb537cc3-9f61-49ba-a037-8d72bd654bf6",
  subcategoryId: "c46e0594-13a0-46b0-9dc2-4669240f59c8",
  serviceTypeId: "7d4b64c0-8657-4048-8895-dfe1efd203be",
  packageId: "96a91230-e9aa-407a-beb9-e37f5454f639",
  eventDate: "2026-12-25",
  eventTime: "18:00",
  eventLocation: "Test Venue, Hyderabad",
  landmark: "Near Test Landmark",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500001",
  guestCount: 150,
  eventName: "Test Wedding Performance",
  eventDescription: "Performance testing after optimization",
  specialInstructions: "Handle with care",
  selectedAddonIds: [],
  idempotencyKey: "perf-test-" + Date.now()
};

async function run() {
  console.log('--- TESTING BOOKING PERFORMANCE ---');
  try {
    // 1. Login
    console.log('Logging in as customer...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'customer2@example.com',
      password: 'Mana@123'
    });
    const token = loginRes.data.accessToken;
    console.log('Login successful.');

    // 2. Submit Booking
    console.log('Submitting valid booking...');
    const startTime = Date.now();
    const res = await axios.post(`${BASE_URL}/api/bookings`, payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const duration = Date.now() - startTime;

    console.log(`Status Code: ${res.status}`);
    console.log(`Total Request Time: ${duration}ms`);

    if (res.status === 201) {
      console.log('PASS: Booking created successfully.');
      console.log('Booking ID:', res.data.id);
    } else {
      console.log('FAIL: Unexpected status code.');
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

run();
