# Audit Bridge Refactor - Full Diffs

The following diffs show the replacement of the legacy `createAuditLog` bridge with direct `AuditService` calls across 14 API routes.

### 1. admin/disputes/[id]/resolve/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: payload.userId,
-      action: "DISPUTE_RESOLVED",
-      details: { disputeId, resolution: validated.status },
-      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.log({
+      entityType: "DISPUTE",
+      entityId: disputeId,
+      module: "OPS",
+      action: "DISPUTE_RESOLVED",
+      performedByUserId: payload.userId,
+      performedByRole: payload.role,
+      metadata: { resolution: validated.status },
+      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
+    });
```

### 2. admin/settings/commission/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: admin.userId,
-      action: "UPDATE_GLOBAL_SETTING",
-      details: { key: "admin_commission_percentage", value: commissionPercentage },
-      ipAddress: req.headers.get("x-forwarded-for") || undefined
-    });
+    await AuditService.log({
+      entityType: "SYSTEM_SETTING",
+      entityId: "admin_commission_percentage",
+      module: "ADMIN",
+      action: "UPDATE_GLOBAL_SETTING",
+      performedByUserId: admin.userId,
+      performedByRole: "ADMIN",
+      metadata: { key: "admin_commission_percentage", value: commissionPercentage },
+      ipAddress: req.headers.get("x-forwarded-for") || undefined
+    });
```

### 3. admin/users/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: admin.userId,
-      action: "USER_UPDATED_BY_ADMIN",
-      details: { targetUserId: id, updates: data },
-      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.log({
+      entityType: "USER",
+      entityId: id,
+      module: "ADMIN",
+      action: "USER_UPDATED_BY_ADMIN",
+      performedByUserId: admin.userId,
+      performedByRole: "ADMIN",
+      metadata: { updates: data },
+      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
+    });
```

### 4. admin/vendors/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: admin.userId,
-      action: "VENDOR_PROFILE_UPDATED",
-      details: { vendorProfileId: id, updates: data },
-      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.log({
+      entityType: "VENDOR_PROFILE",
+      entityId: id,
+      module: "ADMIN",
+      action: "VENDOR_PROFILE_UPDATED",
+      performedByUserId: admin.userId,
+      performedByRole: "ADMIN",
+      metadata: { updates: data },
+      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
+    });
```

### 5. admin/vendors/verify/[id]/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: admin.userId,
-      action: `VENDOR_VERIFICATION_${validated.status}`,
-      details: {
-        vendorProfileId,
-        vendorUserId: vendorProfile.userId,
-        ...validated
-      },
-      ipAddress: ip,
-    });
+    await AuditService.log({
+      entityType: "VENDOR_PROFILE",
+      entityId: vendorProfileId,
+      vendorId: vendorProfileId,
+      module: "VENDOR_MANAGEMENT",
+      action: `VENDOR_VERIFICATION_${validated.status}`,
+      performedByUserId: admin.userId,
+      performedByRole: "ADMIN",
+      metadata: {
+        vendorUserId: vendorProfile.userId,
+        ...validated
+      },
+      ipAddress: ip,
+    });
```

### 6. auth/register/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    try {
-      await createAuditLog({ userId: user.id, action: "USER_REGISTERED", ipAddress: ip });
-    } catch (e) {
-      logger.error("[RegisterAPI] Audit log failed (non-blocking)", e);
-    }
+    try {
+      await AuditService.logAuth(user.id, "USER_REGISTERED", user.role, user.fullName);
+    } catch (e) {
+      logger.error("[RegisterAPI] Audit log failed (non-blocking)", e);
+    }
```

### 7. auth/verify-otp/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    createAuditLog({
-      userId: user.id,
-      action: "LOGIN_SUCCESS_2FA",
-      ipAddress: ip
-    }).catch(err => logger.error("Audit log failed after OTP", err));
+    AuditService.logAuth(user.id, "LOGIN_SUCCESS_2FA", user.role, user.fullName)
+      .catch(err => logger.error("Audit log failed after OTP", err));
```

### 8. bookings/[id]/accept/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-        await createAuditLog({
-          userId: payload.userId,
-          action: "VENDOR_ACCEPT_BOOKING",
-          details: { bookingId },
-          ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-        });
+        await AuditService.logBooking(
+          bookingId,
+          "VENDOR_ACCEPT_BOOKING",
+          { id: payload.userId, name: vendorProfile.businessName, role: payload.role },
+          undefined,
+          { ipAddress: req.headers.get("x-forwarded-for") || "unknown" }
+        );
```

### 9. bookings/[id]/dispute/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: payload.userId,
-      action: "DISPUTE_RAISED",
-      details: { disputeId: dispute.id, bookingId },
-      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.log({
+      entityType: "DISPUTE",
+      entityId: dispute.id,
+      bookingId,
+      module: "BOOKING_OPERATIONS",
+      action: "DISPUTE_RAISED",
+      performedByUserId: payload.userId,
+      performedByRole: payload.role,
+      metadata: { bookingId },
+      ipAddress: req.headers.get("x-forwarded-for") || "unknown"
+    });
```

### 10. bookings/[id]/otp/check-in/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-        userId: payload.userId,
-        action: "BOOKING_CHECKIN_SUCCESS",
-        details: { bookingId },
-        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.logBooking(
+        bookingId,
+        "BOOKING_CHECKIN_SUCCESS",
+        { id: payload.userId, name: booking.vendorprofile!.businessName, role: payload.role },
+        undefined,
+        { ipAddress: req.headers.get("x-forwarded-for") || "unknown" }
+    );
```

### 11. bookings/[id]/payment-release/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-        userId: payload.userId,
-        action: "BOOKING_PAYMENT_RELEASED",
-        details: { bookingId, amount: booking.vendorPayout },
-        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.logPayment(
+        "N/A",
+        bookingId,
+        "BOOKING_PAYMENT_RELEASED",
+        { id: payload.userId, name: (payload as any).fullName || "Customer", role: payload.role },
+        { amount: booking.vendorPayout }
+    );
```

### 12. payments/verify/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-      await createAuditLog({
-        userId: payload.userId,
-        action: "PAYMENT_VERIFICATION_FAILED",
-        details: { razorpay_order_id, bookingId, reason: "Invalid signature" },
-        ipAddress: ip
-      });
+      await AuditService.log({
+        entityType: "PAYMENT",
+        entityId: razorpay_order_id,
+        bookingId,
+        module: "FINANCE",
+        action: "PAYMENT_VERIFICATION_FAILED",
+        performedByUserId: payload.userId,
+        performedByRole: payload.role,
+        metadata: { razorpay_order_id, bookingId, reason: "Invalid signature" },
+        ipAddress: ip
+      });
```

### 13. vendor/payouts/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-      userId: payload.userId,
-      action: "PAYOUT_REQUEST_CREATED",
-      details: { payoutId: payout.id, amount: withdrawalAmount },
-    });
+    await AuditService.log({
+      entityType: "PAYOUT",
+      entityId: payout.id,
+      vendorId: vendorProfile.id,
+      module: "FINANCE",
+      action: "PAYOUT_REQUEST_CREATED",
+      performedByUserId: payload.userId,
+      performedByRole: payload.role,
+      metadata: { payoutId: payout.id, amount: withdrawalAmount },
+    });
```

### 14. vendor/profile/route.ts
```diff
-import { createAuditLog } from "@/lib/audit";
+import { AuditService } from "@/services/server/audit.service";

-    await createAuditLog({
-        userId: payload.userId,
-        action: "VENDOR_SETTINGS_UPDATED",
-        details: body,
-        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.logVendorAction(
+        profile.id,
+        "VENDOR_SETTINGS_UPDATED",
+        { id: payload.userId, name: profile.businessName, role: payload.role },
+        body
+    );

-        await createAuditLog({
-            userId: payload.userId,
-            action: "VENDOR_BANK_DETAILS_UPDATED",
-            details: {
-                old: { bankDetails: oldProfile?.bankDetails },
-                new: { bankDetails: body.bankDetails }
-            },
-            ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-        });
+        await AuditService.logVendorAction(
+            result.id,
+            "VENDOR_BANK_DETAILS_UPDATED",
+            { id: payload.userId, name: result.businessName, role: payload.role },
+            {
+                old: { bankDetails: oldProfile?.bankDetails },
+                new: { bankDetails: body.bankDetails }
+            }
+        );

-    await createAuditLog({
-        userId: payload.userId,
-        action: "VENDOR_PROFILE_UPDATED",
-        details: { fields: Object.keys(body) },
-        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
-    });
+    await AuditService.logVendorAction(
+        result.id,
+        "VENDOR_PROFILE_UPDATED",
+        { id: payload.userId, name: result.businessName, role: payload.role },
+        { fields: Object.keys(body) }
+    );
```
