# Naveen Chit Fund — Digital Chit-Fund Platform

A full-stack, institutional-grade digital chit-fund management platform. Naveen Chit Fund digitizes rotating savings and credit associations (ROSCAs) with real-time reverse auctions, automated dividend distribution, role-based access control (RBAC), immutable double-entry ledger bookkeeping, and seamless mobile/web client interfaces.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Naveen Chit Fund Frontend                   │
│            React Native / Expo (iOS, Android & Web)         │
│          Zustand • Safe Area • Custom Institutional Theme   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST & WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Naveen Chit Fund Backend                    │
│                   Node.js & Express API                     │
│    JWT Auth • Rate Limiters • Reverse Auction Engine        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      PostgreSQL Database     │ │        Redis Store         │
│  - Relational Integrity      │ │  - Real-time Bid Cache     │
│  - Concurrency Row Locking   │ │  - Low-latency RAM State   │
│  - Double-Entry Ledger       │ │  - Circular Bids Feed      │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/
│   │   ├── db.js                 # PostgreSQL connection pool & transaction manager
│   │   ├── redis.js              # Redis cache client & auction keys
│   │   ├── index.js              # Express app bootstrap & Socket.IO server
│   │   ├── middleware/           # JWT verification, RBAC guard & error handler
│   │   ├── migrations/           # PostgreSQL DDL migrations
│   │   ├── routes/               # REST API endpoints (Admin, Auth, Auctions, etc.)
│   │   ├── services/             # Integer-paise dividend calculation engine
│   │   ├── sockets/              # Room-isolated real-time auction sockets
│   │   └── utils/                # Validation & pagination helpers
│   ├── tests/                    # Dividend engine & API test suites
│   ├── package.json              # Backend dependencies & scripts
│   └── .env.example              # Environment variables template
│
└── frontend/
    ├── src/
    │   ├── core/                 # Theme tokens, typography, responsive breakpoints, Card, BidDial
    │   ├── features/             # Auth/eKYC, Dashboard, Chits, Live Auction, Payments, Surety, Foreman
    │   ├── navigation/           # Phone bottom-tabs & tablet navigation rail
    │   └── store/                # Zustand global application state store
    ├── package.json              # React Native / Expo dependencies & scripts
    └── app.json                  # Cross-platform tablet & mobile metadata
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run database migrations & seed initial demo data
npm run migrate
npm run seed

# Start development server
npm run dev
```

The backend server will start on `http://localhost:4000`.

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start on Web
npm run web

# Or run on Android / iOS
npm run android
npm run ios
```

---

## 👥 Seeded Demo Accounts

| Role | Phone Number | Description |
|---|---|---|
| **Admin (Foreman)** | `+919999900000` | Full access to AUM metrics, Group creation, KYC review, and Live Auction Control Deck |
| **Subscriber 1** | `+919999900001` | Enrolled in active chit groups with live bidding capability |
| **Subscriber 2** | `+919999900002` | Enrolled in active chit groups with installment payments |
| **Subscribers 3–5** | `+919999900003` to `+919999900005` | Seeded group participants |

> *Note: In development mode, the 6-digit OTP code is logged directly to the backend console on request.*

---

## 🔒 Security & Key Features

- **Role-Based Access Control (RBAC)**: Strict separation of Admin (Foreman) and Subscriber navigation graphs and API endpoints.
- **Reverse Auction Engine**: Live Socket.IO room bidding backed by high-throughput Redis caching and transactional PostgreSQL audit logging.
- **Integer Paise Arithmetic**: All dividend calculations are done in integer paise (`₹1.00 = 100 paise`) to eliminate floating-point drift.
- **Double-Entry Ledger**: Full transaction traceability (`INSTALLMENT`, `DIVIDEND`, `PRIZE_PAYOUT`, `COMMISSION`).
- **Payment Integration**: Razorpay order management and signature-verified webhook processing.

---

## 🛡️ Superadmin Panel (ChitTech Executive Suite)

The **Superadmin Panel** is a centralized, high-security statutory governance deck designed for senior management, compliance officers, and institutional overseers. It operates completely independently of subscriber and foreman mobile/web clients.

### 🌟 Key Architectural Guarantees
- **Total Schema Separation**: Superadmins are stored in a dedicated `super_admins` and `super_admin_sessions` table with independent UUID primary keys and bcrypt-cost-12 hashing.
- **Audience & Secret Isolation**: Superadmin JWT tokens are minted with `aud: "superadmin"` and signed with `SUPERADMIN_JWT_SECRET`. Regular subscriber/foreman tokens are rejected on superadmin endpoints, and superadmin tokens are rejected on mobile app endpoints.
- **Login Hardening**: Dedicated rate limiting (with account locking for 15 minutes after 5 consecutive failed attempts), constant-time credential comparison, and tamper-evident audit logging (`actor_type: 'SUPERADMIN'`) for all access attempts.
- **Full Regulatory Tooling**: Form XIV Registrar of Chits filings tracker (48-hour post-auction countdown), GST 11/2017 tax invoice generation (18% tax applied strictly on 5% commission), DPDP Section 11 subscriber data export, and double-entry ledger audits.

### 🔑 Environment Configuration
Add the following variables to `backend/.env`:

```env
# Superadmin Authentication & Token Isolation
SUPERADMIN_JWT_SECRET=superadmin_ultra_secure_secret_naveenchit_2026_finance_panel
SUPERADMIN_JWT_EXPIRES=15m
SUPERADMIN_REFRESH_EXPIRES=7d

# Initial Seed Overrides (Optional)
SUPERADMIN_EMAIL=admin@naveenchit.com
SUPERADMIN_PASSWORD=12345678
```

### 👤 Pre-Seeded Superadmin Credentials

| Attribute | Value |
|---|---|
| **URL Path** | `http://localhost:5174/chit` |
| **Email** | `admin@naveenchit.com` |
| **Password** | `12345678` |
| **Flag** | `must_change_password: true` (Triggers a security banner until rotated) |

To re-seed or reset credentials at any time:
```bash
npm run seed --prefix backend
```

### 🚀 Running the Superadmin Web Console

```bash
# From workspace root
npm run dev:superadmin

# Or directly in superadmin-web/
cd superadmin-web
npm run dev
```

The web console will be accessible on:
- **Public Landing Page**: `http://localhost:5174/`
- **Superadmin Login**: `http://localhost:5174/chit`
- **Protected Executive Dashboard**: `http://localhost:5174/chit/dashboard`

To run all services concurrently:
```bash
npm run dev:backend       # Express API on :4000
npm run dev:superadmin    # Superadmin Web on :5174
npm run dev:frontend      # Mobile/Web Expo on :8081
```

### 🔄 How to Rotate the Superadmin Password

1. **Via the Web Interface (Recommended)**:
   - Log in at `/chit`.
   - Click the **Change Password →** banner or navigate to **Settings** (`/chit/settings`).
   - Enter your current password and a new password (enforces a minimum of 12 characters).
   - Upon successful rotation, `must_change_password` is set to `false` and previous sessions are revoked.

2. **Via the Secure API**:
   ```bash
   curl -X POST http://localhost:4000/api/v1/superadmin/auth/change-password \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <SUPERADMIN_ACCESS_TOKEN>" \
     -d '{"currentPassword":"12345678","newPassword":"MySecureNewPassword2026!"}'
   ```

3. **Via Environment Variable & Seeder**:
   Set `SUPERADMIN_PASSWORD="YourNewStrongPassword"` in `backend/.env` and run `npm run seed --prefix backend`.

### 🧪 Automated Testing

```bash
# Run backend integration tests (101 tests across auth, money math, ledger, and superadmin modules)
npm run test:superadmin

# Run Playwright end-to-end smoke tests (Landing, Login, Dashboard, Responsive Drawer)
npm run test:superadmin:e2e
```
