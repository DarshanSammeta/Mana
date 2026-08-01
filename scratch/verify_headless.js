const http = require('http');

const ROUTES = [
  '/',
  '/marketplace',
  '/customer/bookings'
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Audit-Agent/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const isHealthy = res.statusCode === 200 && (data.includes('<!DOCTYPE html>') || data.includes('Mana Events'));
        console.log(`Route: ${path} | Status: ${res.statusCode} | Healthy: ${isHealthy}`);
        if (res.statusCode !== 200) {
           console.log('--- ERROR BODY PREVIEW ---');
           console.log(data.substring(0, 500));
        }
        resolve(isHealthy);
      });
    });

    req.on('error', (e) => {
      console.log(`Route: ${path} | Error: ${e.message}`);
      resolve(false);
    });
    req.end();
  });
}

async function run() {
  console.log('--- HEADLESS VERIFICATION START ---');
  let allHealthy = true;
  for (const route of ROUTES) {
    const healthy = await checkRoute(route);
    if (!healthy) allHealthy = false;
  }
  console.log('--- HEADLESS VERIFICATION END ---');
  process.exit(allHealthy ? 0 : 1);
}

run();
