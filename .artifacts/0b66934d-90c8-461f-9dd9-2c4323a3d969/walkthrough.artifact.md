# Optimized Merge Logic and Fixed Socket Authentication

I have optimized the commerce merge process and addressed the Socket.IO authentication failures.

## Changes Made

### 1. Optimized `/api/commerce/merge` (Fixed Timeout)
- **Batched Pricing**: Previously, the merge route was calling the Pricing Engine for each individual item in a loop. This caused N+1 database roundtrips and significantly slowed down the process. I updated the route to batch all items into a single Pricing Engine call.
- **Parallelized Database Ops**: Replaced sequential `for` loops with `Promise.all` for both cart and wishlist merges. This allows multiple `upsert` operations to happen concurrently, drastically reducing the total time taken for the merge.
- **Improved Payload Handling**: The merge logic now correctly uses `guestCount` and `addons` from the incoming guest cart items when calculating the enterprise pricing snapshot.

### 2. Fixed Socket.IO Authentication
- **Environment Variable Loading**: Added `import "dotenv/config"` to the custom `server.ts`. Custom server entry points often lack access to `.env` variables unless they are explicitly loaded. This was likely causing `JWT_ACCESS_SECRET` to fall back to its build-time placeholder, leading to token verification failures in the Socket.IO middleware.
- **Enhanced Logging**: Added granular logs to `server.ts` to confirm if environment variables (like `JWT_ACCESS_SECRET`) are present at startup and improved the auth middleware logging to capture why a connection was rejected.
- **Boundary Verification**: Confirmed that `verifyAccessToken` in `auth-core.ts` correctly logs the reason for failure (e.g., expired token) without leaking raw secrets or violating the `server-only` constraint.

## Verification
- **Commerce Merge**: Test the login flow again. The merge should now complete in a fraction of a second, even for large carts.
- **Socket.IO**: The server logs will now show `[Server] JWT Secret present: true` on startup. Authenticated users should no longer see "Authentication failed" or be silently disconnected from the notification/chat websocket.

## Next Steps
> [!IMPORTANT]
> **Please RESTART your dev server.**
> These changes touch the custom `server.ts` entry point, so a full process restart is required to pick up the `dotenv/config` change and the optimized API route.
