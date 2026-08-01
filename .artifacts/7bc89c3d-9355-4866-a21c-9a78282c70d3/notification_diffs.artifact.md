# Notification Unification - Full Diffs

These diffs implement a unified, queued notification system for vendor onboarding, replacing the fragmented and synchronous `VendorNotifications` logic.

### 1. src/lib/notifications.ts
```diff
 export const NotificationTriggers = {
+  vendorAccountStatus: async (
+    userId: string,
+    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED' | 'SUSPENDED',
+    message: string,
+    reason?: string
+  ) => {
+    return await sendNotification({
+      userId,
+      title: status === 'APPROVED' ? "Account Approved! 🚀" : "Account Status Update",
+      message,
+      category: "SYSTEM",
+      priority: "HIGH",
+      link: status === 'SUSPENDED' ? "/vendor/suspended" : "/vendor/dashboard",
+      metadata: {
+        templateId: "VENDOR_VERIFICATION",
+        status,
+        reason
+      }
+    });
+  },
+
   bookingCreated: async (booking: any) => {
```

### 2. src/inngest/notification-functions.ts
```diff
+import { sendVendorVerificationUpdateEmail } from "@/lib/mail/resend";

-    // 1. Send Email via Resend
     if (channels.email && user.email) {
       const emailResult = await step.run("send-email", async () => {
         try {
-          // You can expand this to use templates based on category/metadata
-          await sendVendorNotificationEmail(user.email!, {
-            vendorName: user.fullName || "User",
-            bookingNumber: payload.metadata?.bookingNumber || "N/A",
-            eventName: payload.metadata?.eventName || "Event",
-            eventDate: payload.metadata?.eventDate || "N/A",
-            customerName: payload.metadata?.customerName || "Customer",
-            payoutAmount: payload.metadata?.amount || "0",
-          });
+          if (payload.metadata?.templateId === "VENDOR_VERIFICATION") {
+            await sendVendorVerificationUpdateEmail(user.email!, {
+              vendorName: user.fullName || "Vendor",
+              status: payload.metadata.status,
+              message: payload.message,
+              rejectionReason: payload.metadata.reason
+            });
+          } else {
+            // Default/Booking Template
+            await sendVendorNotificationEmail(user.email!, {
+              vendorName: user.fullName || "User",
+              bookingNumber: payload.metadata?.bookingNumber || "N/A",
+              eventName: payload.metadata?.eventName || "Event",
+              eventDate: payload.metadata?.eventDate || "N/A",
+              customerName: payload.metadata?.customerName || "Customer",
+              payoutAmount: payload.metadata?.amount || "0",
+            });
+          }
           return true;
```

### 3. API Route Refactor (Sample: admin/vendors/verify/[id]/route.ts)
```diff
-import { VendorNotifications } from "@/lib/notifications/vendor";
+import { NotificationService } from "@/lib/notifications";

...

-    // Create Notification for Vendor
     if (validated.status === "APPROVED") {
-      await VendorNotifications.approved(vendorProfile.userId);
+      await NotificationService.triggers.vendorAccountStatus(vendorProfile.userId, "APPROVED", "Congratulations! Your vendor account has been verified.");
     } else if (validated.status === "REJECTED") {
-      await VendorNotifications.rejected(vendorProfile.userId, validated.rejectionReason || "No reason provided");
+      await NotificationService.triggers.vendorAccountStatus(vendorProfile.userId, "REJECTED", `Unfortunately, your verification was not successful.`, validated.rejectionReason);
     }
```

### 4. src/app/api/auth/register/route.ts
```diff
-        const { VendorNotifications } = await import("@/lib/notifications/vendor");
-        await VendorNotifications.profileSubmitted(user.id);
+        const { NotificationService } = await import("@/lib/notifications");
+        await NotificationService.triggers.vendorAccountStatus(user.id, "PENDING" as any, "Your profile is under review.");
```
*(Note: I will add 'PENDING' to the status enum or handle it as a special case in the final diff).*
