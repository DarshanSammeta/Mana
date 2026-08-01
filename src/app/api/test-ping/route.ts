import { NextResponse } from "next/server";

export async function GET() {
  console.log("[PING] Received ping request");
  return NextResponse.json({ message: "pong", timestamp: new Date().toISOString() });
}
