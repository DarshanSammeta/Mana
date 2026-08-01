# Implementation Plan - Backend Bottleneck Analysis & Fix

The investigation into the 10-second timeouts for `/api/vendor/profile` and `/api/vendor/auth/sessions` has identified a shared architectural flaw and a specific implementation bug that results in execution deadlocks and unreachable security configurations.

## User Review Required

> [!IMPORTANT]
> **Middleware Logic Error**: The `middleware.ts` file contains a critical logic error where security headers and request tracing IDs are defined *after* the `return` statement, making them unreachable. Furthermore, the code attempts to access an undefined `response` variable.

> [!WARNING]
> **Prisma Query Complexity**: The `GET /api/vendor/profile` endpoint executes a deeply nested query with 6+ relations and multiple `take` limits. While indexes are present, the sheer width of the result set may be contributing to serialization overhead and connection pool saturation.

## Root Cause Analysis

### Root Cause #1: Middleware Execution Halt
- **File**: [src/middleware.ts](file:///C:/ReactProjects/ManaEventWebApp/src/middleware.ts)
- **Line Number**: 178-212
- **Why it happens**: The middleware returns `NextResponse.next()` at line 178, but the subsequent lines (182-212) attempt to set security headers (CSP, HSTS, etc.) on a `response` object that is never initialized. This results in a broken security posture and potential runtime warnings that can stall Edge execution.
- **Severity**: Critical
- **Recommended Fix**: Initialize the `response` object before returning, apply the headers, and then return the modified response.

### Root Cause #2: Duplicate Async Auth Processing
- **File**: [src/app/api/vendor/profile/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/profile/route.ts) and [auth-core.ts](file:///C:/ReactProjects/ManaEventWebApp/src/lib/auth-core.ts)
- **Line Number**: `verifyAccessToken` calls
- **Why it happens**: Both the Middleware and the Route Handlers perform full JWT verification (`jwtVerify`). In a high-concurrency environment, the cumulative CPU cost and potential blocking in the Edge/Node bridge for `jose` operations can lead to timeouts, especially if entropy collection is slow.
- **Severity**: High
- **Recommended Fix**: Trust the headers passed from Middleware (e.g., `x-user-id`) or memoize the verification result if possible within the request lifecycle.

### Root Cause #3: Await Deadlock in Prisma Query
- **File**: [src/app/api/vendor/profile/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/profile/route.ts)
- **Line Number**: 32
- **Why it happens**: The code currently `await`s a JWT verification inside the Prisma query's `where` clause. If `verifyAccessToken` hangs or returns `null`, the Prisma promise remains unresolved or throws an uncaught exception within a nested scope that `withErrorHandler` might not catch correctly before the timeout.
- **Severity**: High
- **Recommended Fix**: Resolve the `userId` before initiating the Prisma call.

## Proposed Changes

### [Component] Middleware & Security

#### [MODIFY] [middleware.ts](file:///C:/ReactProjects/ManaEventWebApp/src/middleware.ts)
- Fix the `response` initialization bug.
- Ensure security headers are applied to the `NextResponse.next()` result before returning.
- Add `x-user-id` and `x-user-role` headers to the request passed to the API routes to avoid duplicate JWT verification.

### [Component] API Route Handlers

#### [MODIFY] [profile/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/profile/route.ts)
- Extract `userId` from request headers (passed by middleware) instead of re-verifying the JWT.
- Simplify the Prisma query by breaking it into two smaller, parallelizable queries if necessary, though indexing should suffice if the connection is healthy.

#### [MODIFY] [auth/sessions/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/auth/sessions/route.ts)
- Use headers for authentication to reduce latency.

## Verification Plan

### Automated Tests
- Deploy changes and monitor `x-request-id` flow in logs.
- Verify that response time for `GET /api/vendor/profile` is < 500ms using the `withErrorHandler` timing logs.

### Manual Verification
- Verify that `x-request-id` and security headers (CSP) appear in the browser DevTools Network tab.
- Confirm zero timeouts under simulated load (10+ concurrent requests to Settings).
