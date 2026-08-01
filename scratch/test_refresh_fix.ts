import { SessionService } from "../src/services/server/session.service";
import { signAccessToken, signRefreshToken } from "../src/lib/auth/token-logic";
import { prisma } from "../src/lib/prisma";

async function testFix() {
    console.log("--- START FIX TEST ---");

    const user = await prisma.user.findFirst({ where: { email: { contains: "customer39" } } });
    if (!user) return;

    // 1. Create a session
    const { refreshToken } = await SessionService.createSession({
        userId: user.id,
        role: user.role,
    });
    console.log(`Initial RT: ${refreshToken.substring(0, 10)}...`);

    // 2. Simulate first refresh (WITH FIX: client uses the NEW token)
    console.log("\n--- SIMULATING FIRST REFRESH (WITH FIX) ---");
    const result1 = await SessionService.refreshSession(refreshToken);
    if (!result1) {
        console.error("First refresh failed!");
        return;
    }
    const newRT1 = result1.refreshToken;
    console.log(`Rotated to RT 1: ${newRT1.substring(0, 10)}...`);

    // 3. Simulate second refresh using the NEW token (This is what happens after fix)
    console.log("\n--- SIMULATING SECOND REFRESH (LEGITIMATE FLOW) ---");
    const result2 = await SessionService.refreshSession(newRT1);

    if (result2) {
        console.log("SUCCESS: Second refresh SUCCEEDED with the rotated token.");
        console.log(`Rotated to RT 2: ${result2.refreshToken.substring(0, 10)}...`);
    } else {
        console.error("FAILURE: Second refresh failed!");
    }

    console.log("\n--- END FIX TEST ---");
}

testFix().catch(console.error).finally(() => prisma.$disconnect());
