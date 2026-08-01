# Performance Baseline Report – Mana Event Web App

This report establishes the performance baseline before Phase 1.5 optimizations.

## Build & Bundle Metrics

| Metric | Baseline Value |
| :--- | :--- |
| **npm build time** | ~402s (includes server bundle) |
| **Total Build Size** | ~1.5 MB |
| **Shared JS (shared by all)** | 103 kB |
| **Middleware Size** | 39.8 kB |

### Critical Route Bundle Sizes (First Load JS)

| Route | Size | First Load JS | Status |
| :--- | :--- | :--- | :--- |
| Home (`/`) | 7.26 kB | 209 kB | 🟡 Needs optimization |
| Marketplace (`/marketplace`) | 13.9 kB | 232 kB | 🟡 Needs optimization |
| **Vendor Reports** (`/vendor/reports`) | **287 kB** | **469 kB** | 🔴 CRITICAL (Oversized) |
| Customer Dashboard | 8.78 kB | 219 kB | 🟡 Average |
| Login | 7.41 kB | 214 kB | 🟡 Average |

> [!WARNING]
> The `Vendor Reports` page is 287 kB on its own, likely due to heavy libraries (`xlsx`, `jspdf`) being bundled directly into the client chunk.

## API & Backend Performance (Warm Requests)

| Endpoint | Avg Latency | P95 Latency | Payload Size |
| :--- | :--- | :--- | :--- |
| **Marketplace Search** | **648.60ms** | **3043.00ms** | 16.67 KB |
| **Vendor Profile API** | **820.20ms** | **4031.00ms** | 25.62 KB |
| **Vendor Dashboard Stats** | **1768.20ms** | **1849.00ms** | 0.10 KB |
| Customer Stats | 720.20ms | 817.00ms | 0.09 KB |

> [!CAUTION]
> P95 latencies for Search and Profile are > 3 seconds, which is a major UX bottleneck.

## Infrastructure Latency

| Service | Latency | Status |
| :--- | :--- | :--- |
| **PostgreSQL (Supabase Pooler)** | **1712.99ms** (SELECT 1) | 🔴 Extremely High (Network) |
| **PostgreSQL (Count Query)** | **621.87ms** | 🔴 Slow |
| Redis (Upstash) | Not measured (Config issue) | ⚪ TBD |
| Meilisearch (Local) | Connection Refused | 🔴 Offline (Fallback in use) |

## Summary of Initial Bottlenecks

1.  **Search Logic**: `getMarketplaceVendors` is hitting the DB too hard with complex SQL and failing to use Meilisearch effectively.
2.  **Profile Data**: `getVendorById` is performing slow, possibly sequential queries or missing indexes.
3.  **Frontend Bloat**: Heavy PDF/Excel libraries in Vendor Reports are killing initial load performance for that section.
4.  **Network Latency**: Database is geographically distant from the test environment (ap-northeast-1). Production deployment should ensure co-location.
