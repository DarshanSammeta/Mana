-- Production Hardening: Database Indexing Script
-- Target: Sub-100ms query performance for Marketplace, Vendor, and Booking flows.

-- 1. Full-Text Search (GIN Index)
-- Optimizes: Marketplace query, Header search, Global search
CREATE INDEX IF NOT EXISTS idx_vendorprofile_search_vector ON "vendorprofile"
USING GIN (to_tsvector('english', "businessName" || ' ' || COALESCE("description", '') || ' ' || COALESCE("city", '')));

-- 2. Core Filtering & Verification
-- Optimizes: getMarketplaceVendors, Vendor listing
CREATE INDEX IF NOT EXISTS idx_vendorprofile_verification_featured ON "vendorprofile" ("verificationStatus", "featured", "isActive");
CREATE INDEX IF NOT EXISTS idx_vendorprofile_city_rating ON "vendorprofile" ("city", "rating" DESC);
CREATE INDEX IF NOT EXISTS idx_vendorprofile_search_score ON "vendorprofile" ("searchScore" DESC);

-- 3. Service & Pricing Hierarchy
-- Optimizes: getVendorById, getMarketplaceCategories, pricing calculation
CREATE INDEX IF NOT EXISTS idx_service_vendor_profile ON "service" ("vendorProfileId");
CREATE INDEX IF NOT EXISTS idx_service_type_lookup ON "service" ("serviceTypeId");
CREATE INDEX IF NOT EXISTS idx_package_service_lookup ON "package" ("serviceId", "price");
CREATE INDEX IF NOT EXISTS idx_pricingrule_package_lookup ON "pricingrule" ("packageId");
CREATE INDEX IF NOT EXISTS idx_package_addon_package_lookup ON "package_addon" ("packageId", "isActive");

-- 4. Taxonomy & Navigation
-- Optimizes: validateHierarchy, category/subcategory APIs
CREATE INDEX IF NOT EXISTS idx_subcategory_category_lookup ON "subcategory" ("categoryId");
CREATE INDEX IF NOT EXISTS idx_category_eventtype_lookup ON "category" ("eventTypeId");

-- 5. Booking & Assignments
-- Optimizes: Customer Dashboard, Vendor Dashboard, Cron jobs
CREATE INDEX IF NOT EXISTS idx_booking_customer_profile ON "booking" ("customerProfileId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_booking_vendor_profile ON "booking" ("vendorId", "status", "eventDate");
CREATE INDEX IF NOT EXISTS idx_bookingassignment_vendor_status ON "bookingassignment" ("vendorId", "status");
CREATE INDEX IF NOT EXISTS idx_bookingassignment_booking ON "bookingassignment" ("bookingId");

-- 6. Operational Performance
-- Optimizes: Health checks, Availability lookups
CREATE INDEX IF NOT EXISTS idx_availability_vendor_date ON "availability" ("vendorProfileId", "date");
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON "notification" ("userId", "isRead", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_review_vendor_rating ON "review" ("vendorId", "rating" DESC, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_booking ON "audit_log" ("bookingId", "createdAt" DESC);

-- Analyze to update statistics
ANALYZE "vendorprofile";
ANALYZE "service";
ANALYZE "package";
ANALYZE "booking";
ANALYZE "notification";
