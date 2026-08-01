# Refactor User/Vendor Architecture to Marketplace Model

This plan refactors the existing architecture to decouple business and customer information from the core `User` (identity) entity. This follows an Amazon/Flipkart style model where `User` handles authentication, while `CustomerProfile` and `VendorProfile` handle marketplace-specific data.

## User Review Required

> [!IMPORTANT]
> This refactor involves significant schema changes and relationship migrations. Existing data in tables like `booking`, `review`, and `cart` will need to be mapped to the new `CustomerProfile` records.

> [!WARNING]
> API endpoints that currently rely on `user.id` for customer features will need to resolve the `customerProfile.id` first. I will ensure backward compatibility where possible, but internal logic will change.

## Proposed Changes

### [Prisma Schema]

Summary: Create `customerprofile` model, move customer-specific fields from `user`, and redirect all customer-related relationships to the new profile.

#### [MODIFY] [schema.prisma](file:///C:/ReactProjects/ManaEventWebApp/prisma/schema.prisma)

-   **Model `user`**:
    -   Remove: `interests`, `loyaltyPoints`, `referralCode`.
    -   Add: `customerprofile?` relation.
-   **[NEW] Model `customerprofile`**:
    -   Fields: `id`, `userId`, `interests`, `loyaltyPoints`, `referralCode`, timestamps.
-   **Redirect Relationships to `customerprofile`**:
    -   `booking.customerId`
    -   `review.userId`
    -   `cart.userId`
    -   `wishlist.userId`
    -   `recently_viewed.userId`
    -   `address.userId`
    -   `customer_crm_data.userId`
    -   `event_workspace.userId`
    -   `referral.referrerId / referredId`
    -   `loyalty_transaction.userId`
    -   `saved_search.userId`
-   **Model `vendorprofile`**:
    -   Ensure it remains the root for `service`, `availability`, `vendordocument`, `vendorteam`, etc. (Most already point here).

---

### [Database Seeding]

Summary: Refactor `seed.ts` to follow the new multi-step profile creation process.

#### [MODIFY] [seed.ts](file:///C:/ReactProjects/ManaEventWebApp/prisma/seed.ts)

1.  **Step 1: Identity Creation**: Create `User` records for Admin, Customers, and Vendors.
2.  **Step 2: Profile Creation**:
    -   Create `customerprofile` for all `CUSTOMER` users.
    -   Create `vendorprofile` for all `VENDOR` users.
3.  **Step 3: Relationship Assignment**:
    -   Generate `booking`, `review`, `cart`, etc., using the generated `customerProfileId` and `vendorProfileId`.
4.  **Step 4: Deterministic Services**: Maintain the category-based service mapping established in the previous task.

---

### [API & Logic]

Summary: Update registration and identity resolution logic to handle the new profile-based architecture.

#### [MODIFY] [register/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/auth/register/route.ts)
-   Refactor `User.create` to remove moved fields (`referralCode`, etc.).
-   Add `customerprofile.create` for users with the `CUSTOMER` role.
-   Ensure `vendorprofile.create` continues to work for the `VENDOR` role.

#### [MODIFY] [auth/me/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/auth/me/route.ts)
-   Update the user selection to include `customerprofile` data.
-   Return profile IDs in the response to allow the frontend to interact with profile-specific APIs.

#### [MODIFY] [auth/verify-otp/route.ts](file:///C:/ReactProjects/ManaEventWebApp/src/app/api/auth/verify-otp/route.ts)
-   Similar to login, ensure the response includes profile information.

## Verification Plan

### Automated Tests
-   `npx prisma validate`: Ensure schema integrity.
-   `npx prisma db seed`: Verify full data generation and integrity.
-   **Integrity Check**: Add a script to verify that no `booking` or `review` is orphaned from a profile.

### Manual Verification
-   Check Prisma Studio to confirm `User` records are clean and profiles are correctly linked.
-   Verify that `VendorProfile` owns all services and business data.
-   Verify that `CustomerProfile` owns all booking and preference data.
