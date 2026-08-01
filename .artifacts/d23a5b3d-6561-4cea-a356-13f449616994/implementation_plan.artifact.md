# Implementation Plan - Fix Client-Side Timeout for /customer/bookings

The goal is to resolve the 10s timeout issue on the `/customer/bookings` request by adding a timeout and "fail-open" logic to the Redis stale session check in the middleware.

## User Review Required

> [!IMPORTANT]
> We are adding a 2-second timeout to the Redis check. If the check times out or fails, the middleware will "fail open" and allow the request to proceed, ensuring that a slow Redis response doesn't hang the entire application.

## Proposed Changes

### [Middleware]

#### [MODIFY] [middleware.ts](file:///C:/ReactProjects/ManaEventWebApp/src/middleware.ts)
- Implement `AbortController` for the `fetch` call to Upstash Redis.
- Set a 2000ms (2s) timeout via `setTimeout`.
- Wrap the Redis check in a `try-catch` block to handle timeouts or connection errors gracefully.
- Ensure `clearTimeout` is called to prevent memory leaks.

## Verification Plan

### Manual Verification
- Navigate to the "My Bookings" page.
- Observe the server logs to see if `[REDIS_CHECK_END]` or `[REDIS_CHECK_FAILED_OR_TIMED_OUT]` is logged.
- Verify if the page loads successfully within a reasonable timeframe (max ~2s if Redis is slow).
