const axios = require('axios');
const jwt = require('jsonwebtoken');
const jose = require('jose');
require('dotenv').config();

async function run() {
  console.log('--- PHASE 1: PARITY TEST ---');
  const secret = process.env.JWT_ACCESS_SECRET;
  const payload = { userId: 'test-user', role: 'ADMIN' };
  const encodedSecret = new TextEncoder().encode(secret);

  const legacyToken = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '15m' });
  const { payload: joseVerified } = await jose.jwtVerify(legacyToken, encodedSecret);
  console.log('Legacy Sign -> Jose Verify:', joseVerified.userId === 'test-user' ? 'PASS' : 'FAIL');

  const joseToken = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(encodedSecret);
  const legacyVerified = jwt.verify(joseToken, secret);
  console.log('Jose Sign -> Legacy Verify:', legacyVerified.userId === 'test-user' ? 'PASS' : 'FAIL');

  console.log('\n--- PHASE 2: RUNTIME API TEST ---');
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@manaevents.com',
      password: 'Mana@123'
    });
    const token = loginRes.data.accessToken;
    console.log('Login: PASS');

    const bookingsRes = await axios.get('http://localhost:3000/api/customer/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Get Bookings (Customer/Admin):', bookingsRes.status === 200 ? 'PASS' : 'FAIL');

    const adminRes = await axios.get('http://localhost:3000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Get Admin Users:', adminRes.status === 200 ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('API Test Error:', error.response ? error.response.data : error.message);
  }
}

run();
