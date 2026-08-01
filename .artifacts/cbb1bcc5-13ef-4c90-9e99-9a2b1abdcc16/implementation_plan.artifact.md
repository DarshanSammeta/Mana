# Implementation Plan - Phase 1.1: Domain & Impact Analysis

This plan focuses on the mandatory research and design phase required before any database migrations or code changes are performed.

## User Review Required

> [!IMPORTANT]
> This phase does NOT include any code modifications. It is strictly for architectural validation and planning.
>
> Please review the [Domain & Impact Analysis](file:///C:/ReactProjects/ManaEventWebApp/.artifacts/cbb1bcc5-13ef-4c90-9e99-9a2b1abdcc16/domain_impact_analysis.artifact.md) before approving.

## Proposed Steps

### 1. Domain Validation
- Review the proposed `Order` vs `Booking` parent-child relationship.
- Validate the "Persistent Intent" strategy for the Cart.
- Verify the "Unified Payment" strategy and its impact on wallet splits.

### 2. Dependency Mapping
- Finalize the list of API endpoints that will be affected by the `Order` introduction.
- Ensure the Admin Dashboard's KPIs (GTV, Net Revenue) are correctly mapped to the new `Order` model.

### 3. Verification of State Machine
- Ensure child `Booking` statuses transition correctly when the parent `Order` is paid.
- Handle edge cases: What happens if 1 of 5 vendors in an order rejects the booking after payment? (Strategy: Refund or Reassign).

---

## Next Steps after Approval
1. **Schema Update (Parallel)**: Introduce the `order` model without breaking `booking`.
2. **Service Layer Updates**: Create `order.service.ts` and enhance `pricing.service.ts`.
3. **API Refactor**: Update Cart and Checkout APIs.
4. **UI Rollout**: Implement the new Package Customizer and multi-vendor Cart.
