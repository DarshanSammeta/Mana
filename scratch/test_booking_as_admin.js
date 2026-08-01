const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2NTA0ZGZhNC02YjNiLTRlYjMtYmE4MC1kOGM4MjM4MGQ1NGEiLCJyb2xlIjoiQURNSU4iLCJpZCI6IjY1MDRkZmE0LTZiM2ItNGV visualizaiMy1iYTgwLWQ4YzgyMzgwZDU0YSIsImlhdCI6MTc4NTE0NDgyMiwiZXhwIjoxNzg1MTQ1NzIyfQ.IL515Cs_tIpfrR5uvHFxTm8v0P0MtihdN2jXbjiMZI8';

// Real IDs from the database (from fetch_test_ids.ts output)
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
  eventName: "Test Admin Booking",
  eventDescription: "Performance testing after optimization",
  specialInstructions: "Handle with care",
  selectedAddonIds: [],
  idempotencyKey: "admin-test-final-" + Date.now()
};

async function run() {
  console.log('--- TESTING BOOKING PERFORMANCE (VALID PAYLOAD) ---');
  try {
    console.log('Submitting valid booking...');
    const startTime = Date.now();
    const res = await axios.post(`${BASE_URL}/api/bookings`, payload, {
      headers: { 'Authorization': `Bearer ${token}` },
      validateStatus: false
    });
    const duration = Date.now() - startTime;

    console.log(`Status Code: ${res.status}`);
    console.log(`Total Request Time: ${duration}ms`);
    console.log('Response data:', JSON.stringify(res.data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
