# Implementation Plan - Fix CORS and Auth Race Condition

The identified root cause is a CORS policy failure on the `POST /api/auth/login` request, which prevents the Admin Dashboard from authenticating. This failure results in an unpopulated auth context, causing the subsequent `dashboard.tsx` route guard to crash when attempting to call `context.auth.can()`.

## User Review Required

> [!IMPORTANT]
> **Global CORS Policy**: I will be enabling CORS for the Admin Dashboard origin (`http://localhost:5173`) in the Web App's global middleware.
> **Auth Middleware Pathing**: I will be including `/api/auth` in the Next.js middleware matcher to ensure security and CORS headers are applied to authentication endpoints.

## Proposed Changes

### [Web App - Backend]

#### [MODIFY] [middleware.ts](file:///C:/ReactProjects/ManaEventWebApp/src/middleware.ts)
- Update the `matcher` to include `api/auth` and `api/socket`.
- Add a CORS handling block at the beginning of the middleware:
  - Check the `Origin` header.
  - If the origin is in the allowed list (including `localhost:5173`), add `Access-Control-Allow-Origin`.
  - Add `Access-Control-Allow-Credentials: true`.
  - Handle `OPTIONS` requests by returning a `204 No Content` response with CORS headers immediately.
- Ensure all responses (success and error) carry the `Access-Control-Allow-Origin` header.

#### [MODIFY] [server.ts](file:///C:/ReactProjects/ManaEventWebApp/server.ts)
- Add `http://localhost:5173` to the `allowedOrigins` list for Socket.io and global consistency.

### [Admin Dashboard - Frontend]

#### [MODIFY] [dashboard.tsx](file:///C:/ReactProjects/ManaEventsAdmin/src/routes/_authenticated/dashboard.tsx)
- (Already patched in previous turn, but I will double-check) Ensure the `beforeLoad` guard is defensive against `undefined` auth context.

## Verification Plan

### Automated Tests
- `curl -X OPTIONS http://localhost:3000/api/auth/login -H "Origin: http://localhost:5173"`: Verify 204 response with correct CORS headers.
- `curl -X POST http://localhost:3000/api/auth/login -H "Origin: http://localhost:5173"`: Verify response contains `Access-Control-Allow-Origin: http://localhost:5173`.

### Manual Verification
1. **Login Flow**: Attempt login from `http://localhost:5173` and verify the request no longer fails with a CORS error.
2. **Dashboard Access**: Verify that after a successful login, the dashboard loads without crashing.
3. **Socket.io Connection**: Verify the browser console shows "Connected to Admin Socket" once the handshake storm is resolved by the CORS fix.
