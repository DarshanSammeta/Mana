# Task List - Database Performance & Socket.IO Unification

- `[x]` Socket.IO Unification
    - `[x]` Delete redundant `src/pages/api/socket/io.ts`
    - `[x]` Update `package.json` dev script to use `server.ts`
    - `[x]` Update `socketStore.ts` transport order (websocket-first)
- `[ ]` Database Performance Fix
    - `[ ]` Update DATABASE_URL in Production Environment (Pending Tier Info)
    - `[x]` Remove 5s notifications timeout in `preferences/route.ts`
- `[x]` Middleware Optimization
    - `[x]` Update `middleware.ts` matcher to exclude `/icons/` and `manifest.json`
- `[x]` Clean-up
    - `[x]` Delete `env.production` from repository
- `[ ]` Verification
    - `[ ]` Run `performance-bench.ts` on staging
    - `[ ]` Verify websocket connection in dev/prod
    - `[ ]` Verify no duplicate key warnings
