const { Redis } = require('@upstash/redis');
require('dotenv').config();

async function test() {
  console.log("Testing Upstash Redis REST...");
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error("❌ Upstash credentials missing in .env");
    return;
  }

  try {
    const redis = new Redis({ url, token });
    const res = await redis.set('health-check', 'ok');
    console.log("SET result:", res);
    const val = await redis.get('health-check');
    console.log("GET result:", val);
    if (val === 'ok') {
      console.log("✅ Upstash Redis REST: OK");
    } else {
      console.log("❌ Upstash Redis REST: Value mismatch");
    }
  } catch (e) {
    console.error("❌ Upstash Redis REST: Failed", e.message);
  }
}

test();
