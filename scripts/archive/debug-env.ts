import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET ? "DEFINED" : "MISSING");
console.log("APP_URL:", process.env.APP_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
