# Implementation Plan - Secure & Robust Cart Checkout (`/api/customer/checkout`)

This plan restores the missing checkout route with strict idempotency, transaction integrity, and server-side pricing verification.

## User Review Required

> [!IMPORTANT]
> **Idempotency Strategy**: `idempotencyKey` is **Required**. I will move it into the `useCheckoutStore` (Zustand) so it is persisted in `localStorage`.
>
> **Race Condition Handling**: To handle near-simultaneous requests, I will catch the Prisma `P2002` (Unique Constraint) error on `create()`. If caught, the server will re-fetch and return the existing booking with a 200 OK status.

> [!TIP]
> **Transaction Client**: `calculateMultiItemPrice` will be updated to accept an optional Prisma Client/Transaction object. This ensures that the pricing calculation reads from the same transactional snapshot as the booking creation, providing strict consistency.

> [!WARNING]
> **Pricing Discrepancy UX**: If the server-calculated price differs from the client's cached price, the API will return a `409 Conflict` with error code `PRICING_MISMATCH`. The frontend will show a toast and require a re-confirmation.

## Proposed Changes

### [Validation Layer]

#### [MODIFY] [booking.ts](file:///C:/ReactProjects/ManaEventWebApp/src/validations/booking.ts)
- Define `checkoutSchema` with `idempotencyKey: z.string()`.

### [API Layer]

#### [NEW] [route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/customer/checkout/route.ts)
- **POST Handler**:
    1.  Initial `findUnique` check (fast path).
    2.  `prisma.$transaction(async (tx) => { ... })`
    3.  `try { await tx.booking.create(...) } catch (e) { if (e.code === 'P2002') return ... }`

### [Service Layer]

#### [MODIFY] [pricing.service.ts](file:///C:/ReactProjects/ManaEventWebApp/src/services/server/pricing.service.ts)
- Update signature to: `calculateMultiItemPrice(items, guestCount, tx?: Prisma.TransactionClient)`

### [Store Layer]

#### [MODIFY] [checkoutStore.ts](file:///C:/ReactProjects/ManaEventWebApp/src/store/checkoutStore.ts)
- Persist `idempotencyKey` in the selection state.

## Verification Plan

### Manual Verification (Sandbox Evidence)
I will provide:
1.  **Terminal Output**: POST request/201 response.
2.  **Concurrency Simulation**: Log showing a `P2002` catch resulting in a 200 OK.
3.  **Database Trace**: Showing atomic commit of Booking + Items.
4.  **Razorpay Sandbox ID**: `order_id` verification.
