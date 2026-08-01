# JWT Unification Design Review (jsonwebtoken -> jose)

This document outlines the strategy for unifying JWT handling under the `jose` library to ensure Edge-compatibility and architectural consistency.

## 1. Current State Analysis

The codebase currently uses two separate JWT libraries, leading to fragmented logic and potential behavioral mismatches.

### Library A: `jsonwebtoken` (Legacy / Root)
- **File**: `src/lib/jwt.ts`
- **Used by**: `server.ts` (Socket.IO), `performance-bench.ts`, `security-probe.ts`, and legacy auth logic.
- **Runtime**: Node.js only.
- **Verification Logic**: Uses `jwt.verify(token, secret)`.

### Library B: `jose` (Edge-compatible)
- **File**: `src/lib/auth-core.ts`
- **Used by**: `session.service.ts`, `middleware.ts` (via `auth-edge.ts`).
- **Runtime**: Edge-ready (Browser, Node.js, Vercel Edge).
- **Verification Logic**: Uses `jwtVerify(token, secret)` with `TextEncoder` secrets.

---

## 2. Risk Assessment

| Risk Factor | jsonwebtoken Behavior | jose Behavior | Impact |
| :--- | :--- | :--- | :--- |
| **Clock Skew** | 0s default (no leeway). | 0s default. | Low. Both expect synchronized clocks. |
| **Algorithm** | Defaults to `HS256`. | Requires explicit `alg` parameter during signing. | Medium. Must ensure parity on algorithm allowlists. |
| **Secret Encoding** | Accepts raw strings. | Requires `Uint8Array` (via `TextEncoder`). | High. Incorrect encoding will invalidate all tokens. |
| **Compatibility** | Node.js built-ins. | Web Crypto API. | Low. `jose` works in all environments. |

---

## 3. Proposed Migration Strategy (No Session Loss)

The goal is to swap the library without logging out active users. This requires ensuring that `jose` can verify tokens previously signed by `jsonwebtoken` using the same secret.

### Phase 1: Preparation (Read-Only)
- Verify that `TextEncoder().encode(JWT_ACCESS_SECRET)` produces the same byte sequence used by `jsonwebtoken`.
- Confirm that existing tokens remain valid under `jose.jwtVerify`.

### Phase 2: Unify Signing
- Refactor `auth-core.ts` to be the single source of truth for both Signing and Verification.
- Standardize on `HS256` as the mandatory algorithm.

### Phase 3: Gradual Replacement
1.  Update `src/lib/auth.ts` to export from `auth-core.ts` instead of `jwt.ts`.
2.  Update `server.ts` (Socket.IO) to use the unified `verifyAccessToken`.
3.  Benchmark performance in a high-load scenario (Socket connections).

### Phase 4: Cleanup
- Delete `src/lib/jwt.ts`.
- Uninstall `jsonwebtoken` and its types.

---

## 4. Proposed Logic for `auth-core.ts`

```typescript
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { AUTH_CONFIG } from "@/config/auth";

const ACCESS_SECRET = new TextEncoder().encode(AUTH_CONFIG.jwtAccessSecret);

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    // This MUST be compatible with legacy tokens signed by jsonwebtoken
    const { payload } = await jwtVerify(token, ACCESS_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}
```

## 5. Verification Plan

- **Parity Test**: Create a script that signs a token with `jsonwebtoken` and verifies it with `jose`, and vice versa.
- **Edge Runtime Test**: Verify middleware still works correctly (it already uses `jose` via `auth-edge.ts`).
- **Socket.IO Test**: Verify real-time connections don't drop after the switch.
