require('dotenv').config();
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function run() {
  if (!redisUrl || !redisToken) {
    console.log('Redis config missing');
    return;
  }
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await fetch(`${redisUrl}/get/ping`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    console.log(`Redis Ping ${i}: ${Date.now() - start}ms`);
  }
}
run();
