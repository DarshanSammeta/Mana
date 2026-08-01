import { spawn } from "child_process";
import axios from "axios";
import { execSync } from "child_process";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("🚀 Starting Production Server...");
  const server = spawn("node", ["server.js"], {
    env: { ...process.env, NODE_ENV: "production", PORT: "3001" },
    stdio: "inherit"
  });

  // Wait for server to be ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get("http://localhost:3001/api/health");
      ready = true;
      break;
    } catch (e) {
      await sleep(2000);
    }
  }

  if (!ready) {
    console.error("❌ Server failed to start.");
    server.kill();
    process.exit(1);
  }

  console.log("✅ Server Ready. Running Benchmark...");
  try {
    // Pass APP_URL to benchmark
    execSync("npx tsx scripts/performance-bench.ts", {
      env: { ...process.env, APP_URL: "http://localhost:3001" },
      stdio: "inherit"
    });
  } catch (e) {
    console.error("❌ Benchmark failed.");
  } finally {
    console.log("🛑 Shutting down server...");
    server.kill();
  }
}

main();
