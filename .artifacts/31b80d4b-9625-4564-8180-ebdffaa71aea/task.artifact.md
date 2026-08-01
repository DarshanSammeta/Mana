# Task: Fix CORS and Auth Race Condition

- `[x]` Fix CORS in Backend
    - `[x]` Add `http://localhost:5173` to `allowedOrigins` in `server.ts`
    - `[x]` Implement CORS headers and `OPTIONS` handling in `middleware.ts`
    - `[x]` Update `middleware.ts` matcher to include auth/socket routes
- `[/]` Verify Fixes
    - `[ ]` Verify preflight headers via `curl`
    - `[ ]` Verify login success from Admin Dashboard
    - `[ ]` Verify Socket.io connection success
- `[ ]` Documentation
    - `[ ]` Create walkthrough of the CORS fix
