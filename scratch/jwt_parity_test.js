const jwt = require('jsonwebtoken');
const jose = require('jose');
require('dotenv').config();

const SECRETS = {
  ACCESS: {
    value: process.env.JWT_ACCESS_SECRET,
    expiry: '15m'
  },
  REFRESH: {
    value: process.env.JWT_REFRESH_SECRET,
    expiry: '7d'
  }
};

async function testParity(name, config) {
  console.log(`--- Testing ${name} Secret ---`);
  const { value: secret, expiry } = config;
  const payload = { userId: 'test-user-123', role: 'CUSTOMER' };
  const encodedSecret = new TextEncoder().encode(secret);

  // 1. jsonwebtoken SIGN -> jose VERIFY
  const legacyToken = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: expiry });
  const { payload: joseVerified } = await jose.jwtVerify(legacyToken, encodedSecret);
  const pass1 = joseVerified.userId === payload.userId && !!joseVerified.exp;
  console.log(`[PASS 1] jsonwebtoken sign -> jose verify: ${pass1}`);

  // 2. jose SIGN -> jsonwebtoken VERIFY
  const joseToken = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(encodedSecret);
  const legacyVerified = jwt.verify(joseToken, secret);
  const pass2 = legacyVerified.userId === payload.userId && !!legacyVerified.exp;
  console.log(`[PASS 2] jose sign -> jsonwebtoken verify: ${pass2}`);

  // 3. Hex Match
  const legacyHex = Buffer.from(secret).toString('hex');
  const joseHex = Buffer.from(encodedSecret).toString('hex');
  const pass3 = legacyHex === joseHex;
  console.log(`[PASS 3] Secret Hex Match: ${pass3}`);

  return pass1 && pass2 && pass3;
}

async function run() {
  const accessPass = await testParity('ACCESS', SECRETS.ACCESS);
  const refreshPass = await testParity('REFRESH', SECRETS.REFRESH);

  if (accessPass && refreshPass) {
    console.log('\nOVERALL RESULT: PASSED');
  } else {
    console.error('\nOVERALL RESULT: FAILED');
    process.exit(1);
  }
}

run().catch(console.error);
