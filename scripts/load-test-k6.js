import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Load Testing Script using k6
 * Targets: 1,000 to 50,000 concurrent users (scaled via VUs)
 *
 * To run: k6 run scripts/load-test-k6.js
 */

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 5000 }, // Scale to 5000 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = __ENV.APP_URL || 'http://localhost:3000';

export default function () {
  // 1. Home Page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, { 'home status 200': (r) => r.status === 200 });

  // 2. Marketplace Search
  const searchRes = http.get(`${BASE_URL}/api/marketplace/search?query=wedding`);
  check(searchRes, { 'search status 200': (r) => r.status === 200 });

  // 3. Health Check (Infrastructure load)
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });

  sleep(1);
}
