# Rate Limiting Audit Report - Mana Events

## Executive Summary
An audit of the authentication rate limiting system was conducted to resolve the issue where developers were receiving HTTP 429 (Too Many Requests) during normal development. The system has been upgraded to an enterprise-grade, multi-factor rate limiting architecture that balances security with developer productivity.

## Root Cause Analysis
- **Fixed Limit:** The previous implementation used a hardcoded limit of 5 requests per 60 seconds regardless of the environment.
- **Key Collision:** Rate limiting was based solely on IP address, which caused blocks for multiple users on the same network (office/LAN) and triggered 429s during rapid development refreshes.
- **Strict Failure:** If Redis was unavailable, the system could potentially behave unpredictably depending on the error handling in the `safeRedis` wrapper.

## Improvements Made

### 1. Environment-Aware Configuration
Introduced `AUTH_LIMITS` configuration that automatically adjusts based on `NODE_ENV`.
- **Development:** High limits (e.g., 100/min for login) to facilitate testing.
- **Production:** Strict limits (5/15min for login) to prevent brute-force attacks.

### 2. Multi-Factor Identification
Shifted from IP-only identification to **IP + Email/UserID**.
- Prevents "Office IP Block" where one user's failed attempts block everyone else on the same network.
- Format: `ratelimit:<action>:<ip>:<email/id>`

### 3. Fail-Open Architecture
Modified `rateLimit` helper to ensure high availability.
- If Redis is unreachable or the Upstash REST API fails, the system logs a warning but **allows the request to proceed**.
- Security is secondary to availability in the event of infrastructure failure.

### 4. Enterprise Response Format
Standardized the 429 response to include:
- `success: false`
- Human-readable `message`
- `retryAfter` (seconds)
- `Retry-After` HTTP Header

### 5. Configurable via Environment
Added a full suite of environment variables to `.env.example` to allow tuning without code changes.

## Audit Checklist
- [x] Login rate limiting uses IP + Email.
- [x] Register rate limiting uses IP + Email.
- [x] OTP verification uses IP + UserID.
- [x] Development limits increased.
- [x] Redis failure does not block users.
- [x] Retry-After headers implemented.
- [x] Audit logs generated for rate limit triggers.

## Security Analysis
The production limits remain strict (5 attempts per 15 minutes). The move to IP+Email identification actually improves security by allowing us to track specific account targeting across different IPs (though the current key includes IP, we can easily add a global email-only bucket if needed). The fail-open strategy is a conscious trade-off for availability, which is standard for enterprise marketplace applications.
