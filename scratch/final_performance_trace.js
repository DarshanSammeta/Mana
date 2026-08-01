const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- FINAL PERFORMANCE TRACE (FULL FLOW) ---');
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@manaevents.com',
      password: 'Mana@123'
    }, { timeout: 60000 });

    const token = loginRes.data.accessToken;
    console.log('   Login successful.');

    // 2. Prepare Payload (using valid IDs from previous fetch)
    const payload = {
      vendorId: "091be15f-7604-4a52-b62d-f0227c3fddc7",
      eventTypeId: "03bb1c67-eb71-4d76-80cc-366e2bc7b842",
      categoryId: "14cf9180-ac94-4885-910c-084f47e21a9d",
      subcategoryId: "84d95b50-7a92-42dc-8c6b-ebdbe84035fe",
      serviceTypeId: "fbe07fcd-45bd-4dc0-944c-1e84ea11f579",
      packageId: "96a91230-e9aa-407a-beb9-e37f5454f639",
      eventDate: "2026-12-25",
      eventTime: "18:00",
      eventLocation: "Test Venue, Hyderabad",
      landmark: "Near Test Landmark",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500001",
      guestCount: 150,
      eventName: "Test Final Trace",
      eventDescription: "Final performance trace before close",
      specialInstructions: "Handle with care",
      selectedAddonIds: [],
      idempotencyKey: "final-trace-" + Date.now()
    };

    // 3. Submit Booking
    console.log('2. Submitting valid booking...');
    const startTime = Date.now();
    const res = await axios.post(`${BASE_URL}/api/bookings`, payload, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 60000,
      validateStatus: false
    });
    const duration = Date.now() - startTime;

    console.log(`   Status Code: ${res.status}`);
    console.log(`   Total Request Time: ${duration}ms`);

    if (res.status === 201) {
      console.log('   RESULT: PASS (Booking Created)');
    } else {
      console.log('   RESULT: FAIL (Unexpected Status)');
      console.log('   Body:', JSON.stringify(res.data, null, 2));
    }

  } catch (error) {
    console.error('   Error:', error.message);
  }
}

run();
