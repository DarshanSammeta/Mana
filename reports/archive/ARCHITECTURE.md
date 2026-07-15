# System Architecture - Mana Events Marketplace

## 1. Overview
Mana Events follows a modern, decoupled enterprise architecture designed for high availability, low latency, and scalability. It is built as a feature-complete marketplace connecting customers with premium event vendors in India.

## 2. Core Technology Stack
- **Framework**: Next.js 15 (App Router) + React 19.
- **Language**: TypeScript (Strict Mode).
- **Database**: PostgreSQL with Prisma ORM (Atomic Transactions).
- **Caching**: Multi-layer (Browser, Nginx, Upstash Redis).
- **Search**: Meilisearch (Primary) with sub-50ms latency.
- **Background Jobs**: Inngest (Event-driven, Durable).
- **Real-time**: Socket.IO for live tracking and chat.
- **Infrastructure**: Dockerized multi-stage builds with Nginx reverse proxy.

## 3. Layered Architecture

### 3.1. Frontend (Presentation Layer)
- **App Router**: Leveraging Server Components for performance and Client Components for interactivity.
- **State Management**: Zustand for global UI state, TanStack Query for server state.
- **Styling**: Tailwind CSS + Shadcn UI + Framer Motion.

### 3.2. Service Layer (Business Logic)
Business logic is decoupled from API routes into a dedicated service layer (`src/services/`):
- **BookingService**: Manages the complex state machine for event lifecycles.
- **PaymentService**: Handles Razorpay integration, escrow, and settlements.
- **VendorService**: Manages onboarding, ranking, and trust scores.
- **MarketplaceService**: Orchestrates search, filtering, and recommendations.
- **FinanceService**: Handles multi-wallet accounting and commission logic.

### 3.3. Data Layer (Persistence & Search)
- **Prisma ORM**: Type-safe queries, migrations, and relational integrity.
- **PostgreSQL**: Primary transactional database.
- **Meilisearch**: Optimized search index for marketplace services and vendors.
- **Redis (Upstash)**: Rate limiting, BI aggregations, and session caching.

## 4. System Workflows

### 4.1. Booking Lifecycle (State Machine)
The booking process follows a strict state transition:
`PENDING` -> `ACCEPTED` -> `PAID` -> `EVENT_STARTED` -> `EVENT_COMPLETED`
Side effects (notifications, invoices, settlements) are triggered at each transition via Inngest.

### 4.2. Financial Settlement
- **Atomic Transactions**: All wallet operations use Prisma `$transaction`.
- **Settlement Engine**: Daily automated settlements at 2 AM via Inngest.
- **Escrow**: Payments are held in escrow until event completion.

### 4.3. Real-time Communication
- **Socket.IO**: Bi-directional communication for live vendor tracking and customer-vendor chat.
- **Notifications**: Multi-channel (In-app, Email, SMS, WhatsApp) orchestrated by Inngest.

## 5. Infrastructure & Operations
- **Containerization**: Single Docker image for the Next.js app (standalone mode).
- **Nginx**: Handles SSL termination, Gzip compression, and security headers (CSP, HSTS).
- **Observability**: Structured JSON logging (Winston) and OpenTelemetry integration.
- **Resilience**: Automated retries for payments and background jobs via Inngest.

## 6. Security Architecture
- **Authentication**: JWT-based (Access/Refresh tokens) with fail-fast secret validation.
- **Authorization**: Centralized Role-Based Access Control (RBAC) middleware.
- **Data Protection**: Bcrypt password hashing and sensitive data encryption.
- **Rate Limiting**: Redis-backed velocity checks on sensitive endpoints.
