# Implementation Plan - Final Production Readiness Audit & Fix (Vendor Settings)

Perform a final audit and fix of the Vendor Settings module to ensure all end-to-end flows, API security, and UI state management are production-ready.

## User Review Required

> [!IMPORTANT]
> - **Access Control**: Currently, vendors who are not `APPROVED` are redirected away from `/vendor/settings` by the middleware. I will modify the middleware to allow vendors to access settings in all states (PENDING, REJECTED, etc.) so they can complete their verification or fix issues.
> - **Schema Defaults**: I will ensure all fields in the Zod schema align with the database's nullable/optional states to prevent validation blocks during initial setup.

## Proposed Changes

### [Backend] API Layer

#### [MODIFY] [profile/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/profile/route.ts)
- Update `GET` to select `panNumber`, `aadhaarNumber`, `businessType`, `website`, `socialLinks`, `workingHours`, and `publicVisibility`.
- Ensure `PUT` uses `validatedData` for all fields instead of raw `body`.

#### [MODIFY] [account/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/vendor/account/route.ts)
- Change `PATCH` to `PUT` for consistency with requested audit endpoints.

#### [MODIFY] [vendor.service.ts](file:///C:/ReactProjects/ManaEventWebApp/src/services/client/vendor.service.ts)
- Update `updateAccount` to use `PUT`.

---

### [Middleware] Access Control

#### [MODIFY] [middleware.ts](file:///C:/ReactProjects/ManaEventWebApp/src/middleware.ts)
- Allow vendors to access `/vendor/settings` regardless of their `verificationStatus`.

---

### [Frontend] UI Layer

#### [MODIFY] [VendorSettings Page](file:///C:/ReactProjects/ManaEventWebApp/src/app/vendor/settings/page.tsx)
- **Business Profile**:
  - Implement a full **Working Hours** editor for all 7 days.
  - Link the "Manage Portfolio" button to `/vendor/portfolio`.
  - Ensure `panNumber` and `aadhaarNumber` are correctly loaded and saved.
- **Account Admin**:
  - Add "Language" and "Timezone" fields with persistence.
- **Security**:
  - Ensure the **2FA Toggle** reflects the database state and persists correctly.
- **State Management**:
  - Add missing loading skeletons or spinner overlays for sub-component actions.
  - Ensure `reset(data)` is called after every successful save to clear `isDirty` state correctly.

## Verification Plan

### Automated Tests
- `npm run lint` to check for code quality.
- `npm run build` to ensure zero compilation errors.

### Manual Verification
1. **Access Check**: Login as a `PENDING` vendor and verify access to `/vendor/settings`.
2. **End-to-End Save**:
   - Update Social Links and Working Hours.
   - Refresh page.
   - Verify values persist.
3. **Security Check**: Toggle 2FA, logout/login, and verify state persistence.
4. **Logo Flow**: Upload logo, delete logo, verify fallback building icon appears.
