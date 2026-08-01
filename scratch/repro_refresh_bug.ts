import { SessionService } from "../src/services/server/session.service";
import { signAccessToken, signRefreshToken } from "../src/lib/auth/token-logic";
import { prisma } from "../src/lib/prisma";

async function repro() {
    console.log("--- START REPRO ---");

    // 1. Create a mock user
    const user = await prisma.user.findFirst({ where: { email: { contains: "customer39" } } });
    if (!user) {
        console.error("No test user found. Please seed the DB.");
        return;
    }
    console.log(`Found user: ${user.id}`);

    // 2. Create a session
    const { accessToken, refreshToken } = await SessionService.createSession({
        userId: user.id,
        role: user.role,
    });
    console.log(`Initial RT: ${refreshToken.substring(0, 10)}...`);

    // 3. Simulate first refresh (This is what the current route does)
    console.log("\n--- SIMULATING FIRST REFRESH ---");
    const result1 = await SessionService.refreshSession(refreshToken);
    if (!result1) {
        console.error("First refresh failed unexpectedly.");
        return;
    }
    console.log(`Rotated to RT: ${result1.refreshToken.substring(0, 10)}...`);

    // 4. Simulate a second refresh using the SAME old token (Legacy/Buggy behavior)
    // In the real bug, the client doesn't get the new RT, so it sends the OLD one again.
    console.log("\n--- SIMULATING SECOND REFRESH WITH OLD TOKEN (REPLAY) ---");
    const result2 = await SessionService.refreshSession(refreshToken);

    if (result2 === null) {
        console.log("SUCCESS: Reuse detection CAUGHT the replay and returned null.");

        // Check if session was revoked
        const session = await prisma.refreshtoken.findFirst({
            where: { userId: user.id, revokedAt: null }
        });
        if (!session) {
            console.log("CONFIRMED: All sessions for this user were revoked due to reuse.");
        } else {
            console.error("FAILURE: Sessions were not revoked!");
        }
    } else {
        console.error("FAILURE: Reuse detection ALLOWED the replay!");
    }

    console.log("\n--- END REPRO ---");
}

repro().catch(console.error).finally(() => prisma.$disconnect());
