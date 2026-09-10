# ChitTech — Digital Chit-Fund Platform

A full-stack, institutional-grade digital chit-fund management platform. ChitTech digitizes rotating savings and credit associations (ROSCAs) with real-time reverse auctions, automated dividend distribution, role-based access control (RBAC), immutable double-entry ledger bookkeeping, and seamless mobile/web client interfaces.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ChitTech Frontend                        │
│          Flutter (iOS, Android, Web & Desktop)              │
│       Riverpod • GoRouter • Material 3 Custom Theme         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST & WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     ChitTech Backend                        │
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
