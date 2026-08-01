import { GET as getProfile } from "../src/app/api/vendor/profile/route";
import { GET as getSessions } from "../src/app/api/vendor/auth/sessions/route";
import { signAccessToken } from "../src/lib/auth-core";

async function runTests() {
  const vendorUserId = "2929976c-00f9-47cf-9f3c-11926ee860ba";
  const token = await signAccessToken({
    userId: vendorUserId,
    role: "VENDOR",
    verificationStatus: "APPROVED"
  });

  const endpoints = [
    { name: "Vendor Profile", handler: getProfile, url: "http://localhost/api/vendor/profile" },
    { name: "Auth Sessions", handler: getSessions, url: "http://localhost/api/vendor/auth/sessions" }
  ];

  console.log("Starting optimization verification...");
  console.log("Vendor User ID:", vendorUserId);

  for (const endpoint of endpoints) {
    console.log(`\n--- Testing ${endpoint.name} ---`);

    // Test with headers (Optimized path)
    const optimizedReq = new Request(endpoint.url, {
      headers: {
        "authorization": `Bearer ${token}`,
        "x-user-id": vendorUserId,
        "x-user-role": "VENDOR",
        "x-request-id": `test_opt_${Math.random().toString(36).substring(7)}`
      }
    });

    const startOpt = Date.now();
    const resOpt = await endpoint.handler(optimizedReq);
    const durationOpt = Date.now() - startOpt;

    console.log(`Optimized (Header-based) Duration: ${durationOpt}ms`);
    console.log(`Status: ${resOpt.status}`);

    // Test without x-user-id (Fallback path)
    const fallbackReq = new Request(endpoint.url, {
      headers: {
        "authorization": `Bearer ${token}`,
        "x-request-id": `test_fallback_${Math.random().toString(36).substring(7)}`
      }
    });

    const startFall = Date.now();
    const resFall = await endpoint.handler(fallbackReq);
    const durationFall = Date.now() - startFall;

    console.log(`Fallback (JWT-based) Duration: ${durationFall}ms`);
    console.log(`Status: ${resFall.status}`);

    if (resOpt.status === 200) {
        const data = await resOpt.json();
        console.log(`Data returned: ${endpoint.name === "Vendor Profile" ? data.businessName : "Array length " + data.length}`);
    } else {
        const err = await resOpt.json();
        console.error("Error response:", err);
    }
  }
}

runTests().catch(console.error);
