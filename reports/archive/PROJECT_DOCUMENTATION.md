# Project Documentation - Mana Events Marketplace

## 1. Project Overview
Mana Events Marketplace is an enterprise-grade event management platform designed to connect customers with premium event vendors. It handles the entire lifecycle of an event from planning and booking to real-time execution and financial settlement.

## 2. Project Structure
- `/src/app`: Next.js pages and API routes.
- `/src/services`: Core business logic (Booking, Payment, Vendor, etc.).
- `/src/hooks`: Custom React hooks for state and data fetching.
- `/src/components`: Reusable UI components (Shadcn UI based).
- `/src/lib`: Shared utilities (Prisma, Redis, Meilisearch clients).
- `/src/inngest`: Background job and workflow definitions.
- `/prisma`: Database schema and migration files.
- `/scripts`: Production verification and maintenance scripts.
- `/docs`: Consolidated project documentation.

## 3. Key Modules

### 3.1. Customer Module
- **AI-Driven Discovery**: Personalized recommendations and recently viewed items.
- **Comparison Engine**: Side-by-side comparison of services and packages.
- **Wallet & Loyalty**: Integrated credit system with points-based rewards.
- **Event Planner**: Workspace for guest management, budget tracking, and checklists.

### 3.2. Vendor Module
- **Business Dashboard**: Comprehensive overview of bookings, earnings, and performance metrics.
- **Service Management**: Full control over service listings, pricing, and availability.
- **Trust Engine**: Performance-based trust scores and verification status.

### 3.3. Financial Module
- **Multi-Wallet Accounting**: Atomic tracking of User, Vendor, Platform, and Escrow funds.
- **Settlement Engine**: Automated daily settlements and commission calculations.
- **Fraud Detection**: Anomaly detection for refunds, coupons, and referral abuse.

### 3.4. Marketplace & Search
- **Meilisearch Integration**: Ultra-fast search with ranking based on subscription tiers and ratings.
- **Dynamic Categories**: Multi-level categorization for granular service discovery.

## 4. Operational Features
- **Real-time Tracking**: Live location tracking for vendors during events.
- **Support System**: Multi-level ticketing with SLA tracking.
- **Dispute Resolution**: Structured workflow for resolving booking conflicts.
- **Notification Engine**: Centralized multi-channel alerts (Push, Email, SMS, WhatsApp).

## 5. Technology Stack
- **Core**: Next.js 15, React 19, TypeScript.
- **Database**: PostgreSQL (Prisma).
- **Caching/Real-time**: Upstash Redis, Socket.IO.
- **Payments**: Razorpay.
- **Communication**: Resend (Email), Twilio (SMS).
- **Search**: Meilisearch.
- **Storage**: Cloudinary.
- **Maps**: Google Maps Platform.

## 6. Maintenance & Best Practices
- **Stateless Services**: Ensure business logic remains side-effect free outside of the service layer.
- **Fail-fast Configuration**: Critical environment variables are validated at startup.
- **Database Safety**: All financial transactions must use Prisma `$transaction`.
- **Background Processes**: Use Inngest for any task that involves 3rd-party APIs or long-running logic.
