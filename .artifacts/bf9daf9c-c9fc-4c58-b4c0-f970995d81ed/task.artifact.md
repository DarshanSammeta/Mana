# Task: Final Stabilization & Migration Cleanup

## Phase 1: CustomerProfile Cleanup
- [/] `[/]` Audit and Fix legacy `customerId` references
    - [ ] `[ ]` `src/app/api/bookings/[id]/accept-counter/route.ts`
    - [ ] `[ ]` `src/app/api/bookings/[id]/accept/route.ts`
    - [ ] `[ ]` `src/app/api/bookings/[id]/view/route.ts`
    - [ ] `[ ]` `src/app/api/customer/invoices/route.ts`
    - [ ] `[ ]` `src/services/server/audit.service.ts`
    - [ ] `[ ]` `src/services/server/timeline.service.ts`
    - [ ] `[ ]` `src/app/api/bookings/otp/route.ts`
    - [ ] `[ ]` `src/lib/customer.ts`
    - [ ] `[ ]` `src/app/api/admin/audit-logs/route.ts`
    - [ ] `[ ]` `src/inngest/marketing.ts`
    - [ ] `[ ]` `src/lib/intelligence/recommendations.ts`
    - [ ] `[ ]` `src/pages/api/socket/io.ts`
    - [ ] `[ ]` `src/services/server/coupon.service.ts`
- [ ] `[ ]` Run `npx prisma validate`
- [ ] `[ ]` Run `npm run build`

## Phase 2: Assignment Engine Consolidation
- [ ] `[ ]` Create unified `AssignmentService` in `src/lib/intelligence/assignment.ts`
- [ ] `[ ]` Update `src/app/api/cron/assignments/route.ts` to use `AssignmentService`
- [ ] `[ ]` Update `src/inngest/booking-functions.ts` to use `AssignmentService`
- [ ] `[ ]` Update `src/app/api/vendor/assignments/route.ts` to use `AssignmentService`

## Phase 3: Cache Optimization
- [ ] `[ ]` Update `unstable_cache` revalidate times to 300s
- [ ] `[ ]` Implement `revalidateTag` in relevant mutation routes

## Phase 4: Final Validation
- [ ] `[ ]` Final audit for `customerId` and `booking.user`
- [ ] `[ ]` Final build check
