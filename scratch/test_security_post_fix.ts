import { SessionService } from "../src/services/server/session.service";
import { signAccessToken, signRefreshToken } from "../src/lib/auth/token-logic";
import { prisma } from "../src/lib/prisma";

async function testSecurity() {
    console.log("--- START SECURITY POST-FIX TEST ---");

    const user = await prisma.user.findFirst({ where: { email: { contains: "customer39" } } });
    if (!user) return;

    // 1. Create a legitimate session
    const { refreshToken: rt1 } = await SessionService.createSession({
        userId: user.id,
        role: user.role,
    });
    console.log(`Legit RT 1: ${rt1.substring(0, 10)}...`);

    // 2. Rotate it (Legitimately)
    console.log("\n--- ROTATING RT 1 -> RT 2 ---");
    const result1 = await SessionService.refreshSession(rt1);
    if (!result1) return;
    const rt2 = result1.refreshToken;
    console.log(`Legit RT 2: ${rt2.substring(0, 10)}...`);

    // 3. Replay RT 1 (The stolen/old token)
    console.log("\n--- REPLAYING RT 1 (OLD TOKEN) ---");
    const attackResult = await SessionService.refreshSession(rt1);

    if (attackResult === null) {
        console.log("SUCCESS: Reuse detection REJECTED the old token.");

        // 4. Verify RT 2 is also revoked (Global Logout property)
        const session = await prisma.refreshtoken.findFirst({
            where: { userId: user.id, revokedAt: null }
        });

        if (!session) {
            console.log("CONFIRMED: All sessions for this user were revoked due to replay.");
        } else {
            console.error("FAILURE: RT 2 should have been revoked!");
        }
    } else {
        console.error("FAILURE: Reuse detection ALLOWED the old token replay!");
    }

    console.log("\n--- END SECURITY POST-FIX TEST ---");
}

testSecurity().catch(console.error).finally(() => prisma.$disconnect());
