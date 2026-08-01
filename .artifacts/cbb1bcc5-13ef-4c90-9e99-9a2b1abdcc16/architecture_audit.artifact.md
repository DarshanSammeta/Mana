# Mana Events Production Architecture Audit

## 1. Existing Flow Analysis

The current implementation follows a simple, one-to-one relationship between a customer request and a vendor booking.

### Current Workflow:
1. **Selection**: Customer selects a Vendor and a Package.
2. **Booking Request**: Customer sends a booking request with event details (Date, Location, etc.).
3. **Vendor Response**: Vendor receives the request and can accept/reject/counter.
4. **Payment**: Customer pays for that specific booking.
5. **Confirmation**: Booking is confirmed.

### Core Models:
- `booking`: Stores event details, amounts, and a single `vendorId`.
- `cart`: Extremely simple, only stores `targetId` (Service/Package) and `type`.
- `payment`: Linked directly to a `bookingId`.
- `payment_split`: Calculates Admin vs Vendor share for a single booking.

---

## 2. Identified Problems & Limitations

### ❌ No Multi-Vendor Orders
The system cannot handle a customer wanting to book multiple vendors (e.g., Venue + Catering + Photography) in a single transaction. Each booking is treated as an independent silo.

### ❌ Primitive Cart System
The `cart` does not store customization details. A user cannot add a package to the cart with their specific guest count, addons, and date. They can only add the "Package" as a reference, losing all context if they move between vendors.

### ❌ Rigid Payment Logic
Payments are tied to `bookingId`. In a multi-vendor scenario, paying for 3 vendors would require 3 separate transactions, which is a poor user experience.

### ❌ Incomplete Data in Cart
`cartitem` missing:
- `eventDate` / `eventTime`
- `guestCount`
- `selectedAddons`
- `eventLocation` / `pincode` / `city`

### ❌ Hardcoded Business Rules
GST (18%) and Platform Fee (5%) are hardcoded in `config.ts`, making it difficult to adjust for specific categories or regions without code changes.

---

## 3. Missing Features (Production Readiness)

1. **Order Entity**: A parent entity to group multiple bookings.
2. **Cart Customization**: Ability to "Configure" an item before adding to cart (Amazon-style).
3. **Bulk Checkout**: Single payment for multiple bookings with automatic split logic.
4. **Coupon Engine (Enhanced)**: Support for cart-wide coupons vs. item-specific coupons.
5. **Advanced Pricing Engine**: Support for dynamic GST, platform fees based on vendor type, and multi-item discounts.
6. **Unified Notifications**: Notification flow that summarizes the whole order rather than sending 5 separate emails for 5 vendors.

---

## 4. Proposed Database Schema Changes

### [NEW] `order` Model
Required to track the overall transaction.
```prisma
model order {
  id                String          @id @default(cuid())
  orderNumber       String          @unique
  customerProfileId String
  totalAmount       Decimal         @db.Decimal(10, 2)
  status            String          @default("PENDING") // PENDING, PAID, FAILED
  paymentId         String?         @unique
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  bookings          booking[]
  customer          customerprofile @relation(fields: [customerProfileId], references: [id])
}
```

### [MODIFY] `cartitem` Model
Add customization fields.
```prisma
model cartitem {
  // ... existing fields
  guestCount        Int?
  eventDate         DateTime?
  eventTime         String?
  eventLocation     String?
  city              String?
  pincode           String?
  selectedAddons    Json?           // Array of addon IDs and prices
  customInstructions String?
}
```

### [MODIFY] `booking` Model
Link to `order`.
```prisma
model booking {
  // ... existing fields
  orderId           String?
  order             order?          @relation(fields: [orderId], references: [id])
}
```

---

## 5. Implementation Roadmap (Phased)

### Phase 1: Audit & Database Migration
- Add `order` model and update `cartitem`.
- Sync Prisma and generate client.

### Phase 2: Enhanced Cart System
- Implement "Customize Package" UI.
- Update Cart APIs to handle customization data.
- Migrate existing cart items (if any).

### Phase 3: Multi-Item Pricing Engine
- Update `pricingService` to calculate totals for multiple items with shared `guestCount` or individual ones.
- Add support for "Best Offer" auto-apply.

### Phase 4: Enterprise Checkout
- New Checkout API that creates an `Order` and multiple `Booking` records.
- Razorpay integration for `Order` payments.

### Phase 5: Payment & Split Logic
- Update `processSuccessfulPayment` to handle `orderId`.
- Atomic distribution of payments to multiple vendors' wallets.

---

## 6. Performance & Security Improvements

- **Atomicity**: All bookings within an order must be created/updated in a single Prisma transaction.
- **Idempotency**: Use `orderNumber` as an idempotency key for Razorpay orders.
- **Audit Logs**: Enhanced logging for order lifecycle transitions.
- **Rate Limiting**: Apply stricter limits on checkout attempts.
