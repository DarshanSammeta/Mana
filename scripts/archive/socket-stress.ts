import { io } from "socket.io-client";
import { signAccessToken } from "../../src/lib/auth/token-logic";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

async function main() {
  const users = await prisma.user.findMany({ take: 100 });
  console.log(`--- SOCKET STRESS TEST (${users.length} clients) ---`);

  const connections: any[] = [];
  let successful = 0;
  let failed = 0;

  for (const user of users) {
    const token = signAccessToken({ userId: user.id, role: user.role });
    const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || "/api/socket/io";
    const socket = io(SOCKET_URL, {
      path: socketPath,
      auth: { token },
      transports: ["polling", "websocket"]
    });

    socket.on("connect", () => {
      successful++;
    });

    socket.on("connect_error", (err) => {
      failed++;
    });

    connections.push(socket);
  }

  await new Promise(r => setTimeout(r, 5000));

  console.log(`> Result:`);
  console.log(`  Target: ${users.length} | Success: ${successful} | Failed: ${failed}`);

  connections.forEach(s => s.disconnect());
  console.log("--- STRESS TEST COMPLETE ---");
}

main().finally(() => prisma.$disconnect());
