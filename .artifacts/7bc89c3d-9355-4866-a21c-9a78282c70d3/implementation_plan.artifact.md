# Implementation Plan - Notification System Unification & Reliability

This plan unifies the fragmented notification logic into a single, queued, and retryable system using Inngest, resolving the behavior regression in the previous proposal.

## User Review Required

> [!IMPORTANT]
> **Architecture Consistency**: All notifications (including vendor onboarding) will now go through the Inngest background queue. This ensures that "Account Approved/Rejected" emails are retryable and reliable, matching the standard used for bookings.

## Proposed Changes

### [Notification Core]
#### [MODIFY] [notifications.ts](file:///C:/ReactProjects/ManaEventWebApp/src/lib/notifications.ts)
- Add `vendorAccountStatus` to `NotificationTriggers`.
- Use the core `sendNotification` helper to ensure In-App persistence and Socket.IO emission.
- Pass `templateId: "VENDOR_VERIFICATION"` in metadata to trigger the correct email template in the background.

### [Background Workers]
#### [MODIFY] [notification-functions.ts](file:///C:/ReactProjects/ManaEventWebApp/src/inngest/notification-functions.ts)
- Update `dispatchExternalNotification` to support template switching.
- Call `sendVendorVerificationUpdateEmail` when `templateId === "VENDOR_VERIFICATION"` is detected in metadata.

### [API Routes]
#### [MODIFY] 9 routes (e.g., `admin/vendors/[id]/approve`, `auth/register`)
- Replace `VendorNotifications` calls with `NotificationService.triggers.vendorAccountStatus`.

### [Cleanup]
#### [DELETE] [vendor.ts](file:///C:/ReactProjects/ManaEventWebApp/src/lib/notifications/vendor.ts)

## Verification Plan

### Automated Tests
- `npx tsc --noEmit` to verify type safety across all updated routes and the unified service.

### Manual Verification (Headless)
- I will run a script to start the dev server and perform a `curl` pass on:
  - `http://localhost:3000/` (Home)
  - `http://localhost:3000/marketplace` (Marketplace)
  - `http://localhost:3000/customer/bookings` (Bookings)
- **Success Criteria**: 200 OK status and verified HTML presence of page-specific identifiers.
