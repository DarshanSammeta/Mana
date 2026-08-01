const axios = require('axios');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setup() {
  const TOXIPROXY_URL = 'http://localhost:8474';
  const MAX_RETRIES = 10;
  let retries = 0;

  console.log("⏳ Waiting for Toxiproxy to be ready...");

  while (retries < MAX_RETRIES) {
    try {
      await axios.get(`${TOXIPROXY_URL}/version`);
      break;
    } catch (e) {
      retries++;
      if (retries === MAX_RETRIES) {
        console.error("❌ Toxiproxy not reachable after 10 attempts.");
        process.exit(1);
      }
      await sleep(2000);
    }
  }

  const proxies = [
    { name: "postgres", listen: "0.0.0.0:5433", upstream: "postgres:5432" },
    { name: "redis", listen: "0.0.0.0:6380", upstream: "redis:6379" }
  ];

  for (const proxy of proxies) {
    try {
      // 1. Delete if exists (Idempotency)
      try {
        await axios.delete(`${TOXIPROXY_URL}/proxies/${proxy.name}`);
        console.log(`🗑️ Deleted existing proxy: ${proxy.name}`);
      } catch (e) {
        // Ignore 404
      }

      // 2. Create Proxy
      await axios.post(`${TOXIPROXY_URL}/proxies`, proxy);
      console.log(`✅ Created proxy: ${proxy.name}`);

      // 3. Add Latency Toxic (850ms base, 100ms jitter)
      await axios.post(`${TOXIPROXY_URL}/proxies/${proxy.name}/toxics`, {
        type: "latency",
        attributes: {
          latency: 850,
          jitter: 100
        }
      });
      console.log(`🔥 Added 850ms±100ms latency to: ${proxy.name}`);
    } catch (error) {
      console.error(`❌ Failed to configure ${proxy.name}:`, error.response?.data || error.message);
    }
  }
}

setup();
