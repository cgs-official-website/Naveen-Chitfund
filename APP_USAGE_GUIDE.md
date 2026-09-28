# Naveen Chit Fund — Comprehensive Project Analysis & Application Usage Manual

---

## 📑 Table of Contents
1. [Executive Summary & Domain Overview](#1-executive-summary--domain-overview)
2. [Core Chit Fund Financial Mechanics & Compliance](#2-core-chit-fund-financial-mechanics--compliance)
3. [End-to-End System Architecture](#3-end-to-end-system-architecture)
4. [Pre-configured Test Accounts & Credentials](#4-pre-configured-test-accounts--credentials)
5. [Installation & Quick Start Guide](#5-installation--quick-start-guide)
6. [Exact Step-by-Step Application Usage](#6-exact-step-by-step-application-usage)
   - [6.1 Subscriber Flow (Savings, Bidding & Payout)](#61-subscriber-flow-savings-bidding--payout)
   - [6.2 Foreman / Admin Flow (Chit Management, Auctions & Disbursal)](#62-foreman--admin-flow-chit-management-auctions--disbursal)
7. [Screen-by-Screen User Interface Catalog](#7-screen-by-screen-user-interface-catalog)
8. [Backend API Reference & WebSocket Events](#8-backend-api-reference--websocket-events)
9. [Relational Database Schema & Data Integrity](#9-relational-database-schema--data-integrity)
10. [Statutory Compliance & Audit Trail](#10-statutory-compliance--audit-trail)

---

## 1. Executive Summary & Domain Overview

**Naveen Chit Fund** is an institutional-grade, full-stack digital chit fund platform built specifically for Rotating Savings and Credit Associations (ROSCAs). The system models the regulatory framework mandated by the **Chit Funds Act, 1982 (with 2019 Central Amendments)**, the **Digital Personal Data Protection (DPDP) Act, 2023**, and state chit registrar mandates (e.g., Telangana *T-Chits* and Andhra Pradesh e-Chits).

The platform digitizes the entire lifecycle of a chit fund:
- **Group Creation & Pre-Sanction**: Pledging 100% Fixed Deposit Receipts (FDR) with the State Registrar to obtain Prior Sanction Orders (PSO).
- **Subscriber Onboarding & eKYC**: Aadhaar & PAN validation with DPDP-compliant consent logging.
- **Monthly Reverse Auctions**: Real-time WebSocket bidding where subscribers compete for early capital access by offering a discount percentage.
- **Integer-Paise Precision Dividend Calculation**: Guaranteed zero floating-point loss (`₹1.00 = 100 paise`), dividing surplus discounts among non-prized members.
- **Surety Submission & Disbursal**: Collecting and validating co-guarantors and income documents before disbursing prize funds via simulated or direct RTGS/NEFT.
- **Double-Entry Bookkeeping**: Immutable ledger entries tracking `INSTALLMENT`, `DIVIDEND`, `PRIZE_PAYOUT`, and `COMMISSION`.

---

## 2. Core Chit Fund Financial Mechanics & Compliance

### 2.1 The Math of a Chit Fund
A chit fund is a dual savings-and-credit financial instrument:
1. **Chit Value ($C$)**: The gross aggregate capital of the group (e.g., ₹5,00,000).
2. **Tenure & Members ($N$)**: The duration in months and number of subscribers (e.g., 20 members for 20 months).
3. **Monthly Contribution ($M$)**: Base installment before dividend offset:
   $$\text{Base Installment} = \frac{\text{Chit Value}}{N} = \frac{₹5,00,000}{20} = ₹25,000/\text{month}$$
4. **Live Reverse Auction (Discount $D$)**:
   - Members bid a discount percentage they are willing to surrender (capped between 5% and 40%).
   - If winning bid discount is **25%**:
     $$\text{Gross Discount} = 25\% \times ₹5,00,000 = ₹1,25,000$$
5. **Foreman Statutory Commission ($F$)**:
   - Capped at 5% of gross chit amount by § 21 of the Chit Funds Act:
     $$\text{Foreman Commission} = 5\% \times ₹5,00,000 = ₹25,000$$
6. **Net Prize Money ($P$) Paid to Winning Bidder**:
   $$P = \text{Chit Value} - \text{Gross Discount} = ₹5,00,000 - ₹1,25,000 = ₹3,75,000$$
7. **Distributable Dividend Pool**:
   $$\text{Dividend Pool} = \text{Gross Discount} - \text{Foreman Commission} = ₹1,25,000 - ₹25,000 = ₹1,00,000$$
8. **Per-Subscriber Dividend Credit**:
   - Depending on group policy (`NON_PRIZED_ONLY` or `ALL_SUBSCRIBERS`), dividend is divided equally:
     $$\text{Per-Member Dividend} = \frac{₹1,00,000}{19} = ₹5,263.15$$
   - This dividend directly reduces the subscriber's next month installment payable:
     $$\text{Net Installment Due} = ₹25,000 - ₹5,263 = ₹19,737$$

### 2.2 Statutory Guardrails
- **40% Maximum Bid Cap**: § 14 of Chit Funds Act prohibits bidding beyond 40% discount to protect borrowers from predatory debt spirals.
- **5% Minimum Bid Floor**: Bidding cannot drop below the 5% Foreman Commission.
- **100% Bank FDR Pledge**: The Foreman must deposit 100% of the aggregate chit value into a scheduled bank and pledge it with the State Registrar prior to soliciting subscriptions.
- **Form XIV Minutes**: Signed auction proceedings must be lodged with the Registrar of Chits within 48 hours of auction completion.
- **GST Levied Only on Commission**: 18% GST applies strictly to the 5% foreman commission (e.g., 18% of ₹25,000 = ₹4,500), never on the subscriber pool.

---

## 3. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
│                 React Native / Expo (SDK 57) + TypeScript                   │
│      ├── Mobile UI (Adaptive Bottom Tab Navigation)                         │
│      ├── Tablet / Desktop UI (Navigation Rail & Two-Pane Master-Detail)     │
│      └── State: Zustand Store + Local Offline-Tolerant Cache                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST & WebSockets (Socket.IO)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API GATEWAY                                │
│                     Node.js & Express 4 Application                         │
│   ├── Security: Helmet, CORS, Rate Limiters, Morgan, Zod Schemas            │
│   ├── Real-Time Auction Engine: Socket.IO with In-Memory / Redis Cache      │
│   └── Dividend Engine: Integer-Paise Precision Bookkeeping Engine           │
└───────────────────┬──────────────────────────────────────┬──────────────────┘
                    │                                      │
                    ▼                                      ▼
┌──────────────────────────────────────┐ ┌────────────────────────────────────┐
│      POSTGRESQL RELATIONAL STORE     │ │         REDIS CACHE / STREAM       │
│  - Multi-tenant ACID Transactions    │ │  - Real-time Bid Cache             │
│  - Concurrency Row Locking (FOR UPD) │ │  - Circular Bids Feed              │
│  - Immutable Double-Entry Ledger     │ │  - High-frequency Deduplication    │
│  - PGCrypto UUID Primary Keys        │ │  - Fast Sub/Pub Auction State      │
└──────────────────────────────────────┘ └────────────────────────────────────┘
                    │                                      │
                    ▼                                      ▼
┌──────────────────────────────────────┐ ┌────────────────────────────────────┐
│       RAZORPAY PAYMENT GATEWAY       │ │      CLOUDINARY & DIGILOCKER       │
│  - Order Creation & Webhooks         │ │  - Guarantor & Salary Slips Upload │
│  - UPI, Cards, NetBanking, eNACH     │ │  - Form I, II, XIV Regulatory Docs │
└──────────────────────────────────────┘ └────────────────────────────────────┘
```

---

## 4. Pre-configured Test Accounts & Credentials

The database contains pre-seeded accounts ready for testing all workflows.

| Role | Phone Number | Name | Permissions & Capabilities |
|---|---|---|---|
| **Admin (Foreman)** | `+919999900000` | ChitTech Admin | Create chit groups, schedule/start/close auctions, review KYC, approve sureties, trigger RTGS disbursals, export Form XIV/GST invoices. |
| **Subscriber 1** | `+919999900001` | Anitha Kumar | Non-Prized Subscriber (Ticket #1) in 5L / 20mo chit. Can place live auction bids, pay installments, submit sureties. |
| **Subscriber 2** | `+919999900002` | Ravi Shankar | Non-Prized Subscriber (Ticket #2). Can bid and pay installments. |
| **Subscriber 3** | `+919999900003` | Priya Menon | Non-Prized Subscriber (Ticket #3). Group participant. |
| **Subscriber 4** | `+919999900004` | Suresh Babu | Non-Prized Subscriber (Ticket #4). Group participant. |
| **Subscriber 5** | `+919999900005` | Lakshmi Narayan | Non-Prized Subscriber (Ticket #5). Group participant. |

> **Development OTP Note**: When requesting an OTP via `/api/v1/auth/otp/request`, the 6-digit code is immediately printed to the backend terminal console (e.g. `[MOCK SMS] OTP for +919999900001: 898402`).

---

## 5. Installation & Quick Start Guide

### 5.1 System Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14 or higher (or Docker PostgreSQL container)
- **Redis**: v6+ (Optional: if Redis is not running, the backend automatically uses its high-speed in-memory fallback store)

### 5.2 Backend Setup & Database Seeding
Open a PowerShell or Terminal window:

```powershell
# 1. Navigate to backend directory
cd c:\chitfund\backend

# 2. Configure environment file
copy .env.example .env

# 3. Install backend dependencies
npm.cmd install

# 4. Run database migrations
npm.cmd run migrate

# 5. Seed test users, groups, and installment schedules
npm.cmd run seed

# 6. Start backend development server
npm.cmd run dev
```
*The backend API server boots up on `http://localhost:4000` with WebSocket support enabled.*

### 5.3 Frontend Setup & Execution
Open a second PowerShell or Terminal window:

```powershell
# 1. Navigate to frontend directory
cd c:\chitfund\frontend

# 2. Install dependencies
npm.cmd install

# 3. Verify TypeScript types
npm.cmd run typecheck

# 4. Launch web application in your default browser
npm.cmd run web
```
*Expo will bundle and open the application at `http://localhost:8081`.*

### 5.4 One-Click Full Stack Launch
Alternatively, run both backend and frontend concurrently from the root directory:
```powershell
cd c:\chitfund
node run-dev.js
```

---

## 6. Exact Step-by-Step Application Usage

### 6.1 Subscriber Flow (Savings, Bidding & Payout)

#### Step 1: Splash & Onboarding
1. Open the application. The **Splash Screen** displays institutional branding ("Government Regulated Chit Fund") and checks existing session tokens.
2. The **Onboarding Screen** walks through:
   - *Statutory Trust*: 100% FDR bank guarantee.
   - *Real-Time Bidding*: Digital reverse auctions.
   - *Dividends & Savings*: Dynamic dividend distribution.
3. Tap **Get Started** to transition to Authentication.

#### Step 2: Authentication & Login
1. On the **Auth Screen**, enter a subscriber phone number (e.g., `+919999900001`).
2. Tap **Send OTP**.
3. Check the backend console output for the 6-digit OTP (e.g., `898402`).
4. Enter the 6-digit OTP into the OTP input fields.
5. Tap **Verify & Proceed**.
6. The app stores the JWT token securely, loads your profile, and routes to the **Home Screen**.

#### Step 3: Explore & Join Chit Groups
1. Tap the **Explore** tab in the bottom navigation.
2. Browse available chit groups:
   - **Prosperity Chit**: ₹5,00,000 / 20 Months (Monthly base: ₹25,000).
   - **Golden Nest Chit**: ₹1,00,000 / 10 Months (Monthly base: ₹10,000).
3. Tap on any chit card to view the **Chit Detail Screen**:
   - Inspect the **Prior Sanction Order (PSO)** reference number.
   - View the **FDR Bank Guarantee Pledge Certificate**.
   - Check the member roster, total vacant slots, and historical dividend payouts.
4. If not yet joined, tap **Enroll in Chit Group** to receive a verified ticket number (e.g., Ticket #1).

#### Step 4: Pay Monthly Installments
1. Tap the **Payments** tab.
2. View your upcoming installment schedule:
   - **Gross Installment**: ₹25,000.
   - **Dividend Offset**: Automatically deducted from the previous auction surplus (e.g., -₹5,263).
   - **Net Amount Payable**: Calculated dynamically.
3. Tap **Pay Installment**:
   - In production, this opens the **Razorpay Payment Gateway** (supporting UPI, Cards, NetBanking, and eNACH mandates).
   - In local development mode, tap **Simulate Instant Payment** to confirm the payment immediately.
4. The installment status changes to `PAID`, a double-entry ledger entry is generated, and a downloadable payment receipt is issued.

#### Step 5: Participate in a Live Reverse Auction
1. When an auction is started by the Foreman, tap the glowing **Auction** tab in the center of the bottom navigation.
2. You enter the room via **Socket.IO**:
   - **Status Banner**: Displays `LIVE` status with a pulsing indicator and remaining time countdown.
   - **Auction Metrics**: Chit Value (₹5,00,000), Base Minimum Bid (5%), Current Lowest Discount Bid.
   - **Interactive Bid Dial & Slider**: Use the circular dial or slider to choose your discount percentage (between 5% and 40%).
   - **Live Net Payout Preview**: See the exact net prize money you will take home and the group dividend your bid will generate.
3. Tap **Place Bid**:
   - The bid is validated against the 40% statutory cap and the current lowest bid.
   - If valid, the bid is instantly broadcast to all room participants via WebSockets, logged in Redis, and written to PostgreSQL audit logs.
4. The live bid feed updates in real-time with your ticket number as the leading bidder.

#### Step 6: Post-Auction Surety Submission (When You Win)
1. Once the auction closes with your winning bid, your subscriber status transitions to **Successful Bidder (`SB`)**.
2. Tap the **Surety** tab:
   - The screen shows your **Prize Money Claim Summary**:
     - Gross Chit Amount: ₹5,00,000
     - Winning Bid Discount: -₹1,25,000 (25%)
     - Net Prize Money Payable: **₹3,75,000**
3. Add statutory security to guarantee future installments:
   - Tap **Add Co-Guarantor**: Enter Guarantor Full Name, Phone, PAN, Monthly Income, and CIBIL score.
   - Upload Supporting Documents: Upload salary slips, bank FD receipts, or property deed images via Cloudinary.
4. Tap **Submit Surety for Foreman Review**. The package status updates to `SUBMITTED`.

#### Step 7: Prize Disbursal & Receipt
1. Once the Foreman approves your surety documentation, enter your bank payout credentials:
   - Bank Account Number, IFSC Code, Beneficiary Name, and Transfer Mode (`RTGS` / `NEFT`).
2. The Foreman executes the disbursal:
   - Funds are recorded with a unique bank UTR transaction reference.
   - Your status changes from **Successful Bidder (`SB`)** to **Prized Subscriber (`PS`)**.
   - As a Prized Subscriber, you cannot bid again in future months, and your future installments will reflect full contributions.

---

### 6.2 Foreman / Admin Flow (Chit Management, Auctions & Disbursal)

#### Step 1: Admin Login
1. On the **Auth Screen**, enter the Foreman test phone number: `+919999900000`.
2. Retrieve the OTP from the backend console (or click the quick Admin test button).
3. Verify OTP. The application detects `role: admin` and enables the **Foreman** navigation item in the bottom tab bar.

#### Step 2: Foreman Institutional Dashboard
Tap the **Foreman** tab to access the administrative control suite:
- **Financial Metrics**: Total Assets Under Management (AUM), Aggregate Monthly Collection, Total Subscribers, Active Chit Groups.
- **Pending Action Indicators**: Pending Member KYC items, Pending Surety Reviews, Live Auction Alerts.

#### Step 3: Create a New Chit Group
1. In the Foreman Dashboard, click **Create Chit Group**.
2. Complete the statutory setup form:
   - **Group Name**: e.g., "Silver Jubilee Chit - 10L / 20mo"
   - **Chit Value**: e.g., ₹10,00,000
   - **Duration / Months**: 20 months
   - **Foreman Commission**: 5%
   - **Dividend Distribution Policy**: `NON_PRIZED_ONLY` (statutory default) or `ALL_SUBSCRIBERS`.
   - **Registrar State**: e.g., `TS` (Telangana) or `AP` (Andhra Pradesh).
   - **Bank FDR Pledge Number**: State the 100% FDR certificate reference number.
3. Click **Submit & Register Group**. The group is created in `OPEN` status.

#### Step 4: Member eKYC Review
1. Scroll to the **Member eKYC Deck**.
2. View pending subscriber submissions showing full name, phone number, PAN card number, and uploaded identity proofs.
3. Click **Approve KYC** (or Reject with reason). The user's status updates to `APPROVED` / `VERIFIED`.

#### Step 5: Live Reverse Auction Control Deck
1. Navigate to the **Auction Controls** section:
   - View scheduled auctions for the current month.
2. Click **Start Auction**:
   - The backend transitions the auction from `SCHEDULED` to `LIVE`.
   - The Redis auction cache is initialized with the 5% minimum floor.
   - Sockets emit the `auction_started` event to all subscribed client phones.
3. Monitor real-time bids streaming into the control deck.
4. When the countdown completes or bidding concludes, click **Close & Declare Winner**:
   - The backend runs an atomic PostgreSQL transaction.
   - The highest discount bidder is marked as the winner and status updated to `SB`.
   - The **Integer-Paise Dividend Calculation Engine** computes exact dividends for every eligible subscriber.
   - Double-entry ledger records are posted for `COMMISSION`, `PRIZE_PAYOUT`, and `DIVIDEND`.
   - The winner is notified to submit sureties.

#### Step 6: Surety Approval & Prize Disbursal
1. Scroll to the **Surety & Disbursal Queue**.
2. Click on a submitted surety claim:
   - Review uploaded guarantor identity proofs, CIBIL scores, and income documents.
3. Click **Approve Surety Package**. Status updates to `APPROVED`.
4. Review the winner's bank account and IFSC details.
5. Click **Execute RTGS Disbursal**:
   - Payout of net prize money (e.g., ₹3,75,000) is marked `COMPLETED`.
   - A unique bank UTR reference is generated.
   - The winning subscriber is upgraded to `PS` (Prized Subscriber).

#### Step 7: Statutory Compliance Document Generation
1. In the **Statutory Compliance** tab of the Foreman deck:
   - **Generate Form XIV (Auction Minutes)**: Creates the statutory report required by § 18 of the Chit Funds Act, 1982, containing full auction logs, winner ticket, and DSC digital signature verification for filing with the Registrar within 48 hours.
   - **Generate GST Invoice**: Produces the official tax invoice applying 18% GST exclusively on the 5% foreman commission as mandated by GST Notification No. 11/2017.
   - **DPDP Data Principal Audit**: View consent history and export user packages per Section 11 of the DPDP Act 2023.

---

## 7. Screen-by-Screen User Interface Catalog

| Screen | Location | Key UI Features & Functions |
|---|---|---|
| **Splash** | `frontend/src/features/splash/SplashScreen.jsx` | Institutional logo, animated gold badge, auto-login session restoration. |
| **Onboarding** | `frontend/src/features/onboarding/OnboardingScreen.jsx` | 3-step value proposition carousel, skip/continue buttons, DPDP disclosure note. |
| **Auth** | `frontend/src/features/auth/AuthScreen.jsx` | Phone number input (+91), 6-digit OTP code entry, instant test login buttons (Admin vs Subscriber). |
| **Home (Dashboard)** | `frontend/src/features/dashboard/HomeScreen.jsx` | Portfolio summary (total invested, total savings, dividends earned), enrolled chit ticket cards, countdown to next auction, quick payment CTA. |
| **Chit Discovery** | `frontend/src/features/chits/ChitDiscoveryScreen.jsx` | Search bar, amount & duration filters, chit cards showing PSO badges and 100% FDR bank guarantee details. |
| **Chit Detail** | `frontend/src/features/chits/ChitDetailScreen.jsx` | Full chit prospectus, member roster, past auction dividends, legal certificate modal, one-tap enroll button. |
| **Live Auction** | `frontend/src/features/auction/LiveAuctionScreen.jsx` | Live WebSocket room, circular bid dial, slider, real-time leader feed, tick decrements, prize vs dividend calculator. |
| **Payments** | `frontend/src/features/payments/PaymentsScreen.jsx` | Pending installment schedule, dividend discount deduction line items, Razorpay gateway trigger, simulated test payment button, receipts. |
| **Surety** | `frontend/src/features/surety/SuretyScreen.jsx` | Prize claim card, net payout breakdown, co-guarantor builder, document uploader, live submission status tracker. |
| **Foreman Deck** | `frontend/src/features/foreman/ForemanDashboardScreen.jsx` | AUM metrics, Chit group creator, KYC review queue, Auction live trigger & close button, Surety approval, RTGS disbursal, Form XIV & GST generators. |
| **Notifications** | `frontend/src/features/notifications/NotificationsScreen.jsx` | Push notification feed for auction reminders, dividend credits, payment due dates, and regulatory notices. |
| **Profile** | `frontend/src/features/profile/ProfileScreen.jsx` | User profile, KYC status badge, verified bank accounts, DPDP consent preferences, dark/light theme switch, offline sync indicator, logout. |

---

## 8. Backend API Reference & WebSocket Events

### 8.1 REST API Endpoints

#### Authentication & Profile (`/api/v1/auth`, `/api/v1/users`)
- `POST /api/v1/auth/otp/request` — Request 6-digit OTP for phone number.
- `POST /api/v1/auth/otp/verify` — Verify OTP, issue signed JWT token.
- `POST /api/v1/auth/login-direct` — Quick-test bypass login for seeded accounts.
- `POST /api/v1/auth/register-direct` — Quick registration for new test accounts.
- `GET  /api/v1/auth/verify-session` — Validate active JWT bearer token.
- `GET  /api/v1/users/me` — Fetch current user profile, role, and KYC status.
- `POST /api/v1/users/me/consents` — Update DPDP privacy and data usage consents.

#### Chit Groups & Subscriptions (`/api/v1/chit-groups`, `/api/v1/subscriptions`)
- `GET  /api/v1/chit-groups` — List open chit groups with pagination and filters.
- `POST /api/v1/chit-groups` — *(Admin)* Create a new chit group with FDR pledge.
- `GET  /api/v1/chit-groups/:id` — Detailed prospectus, FDR details, and roster.
- `POST /api/v1/chit-groups/:id/join` — Enroll authenticated user and allocate ticket.
- `GET  /api/v1/subscriptions/mine` — Fetch all chit tickets owned by current user.

#### Live Auctions (`/api/v1/auctions`, `/api/v1/chit-groups/:groupId/auctions`)
- `GET  /api/v1/chit-groups/:groupId/auctions` — List historical and upcoming auctions.
- `POST /api/v1/chit-groups/:groupId/auctions` — *(Admin)* Schedule a new monthly auction.
- `GET  /api/v1/auctions/:id` — Get auction status, schedule, and current lowest bid.
- `POST /api/v1/auctions/:id/start` — *(Admin)* Move auction to `LIVE` and init Redis.
- `POST /api/v1/auctions/:id/bid` — Place reverse auction discount bid (5%–40%).
- `GET  /api/v1/auctions/:id/bids` — Fetch live bid stream history.
- `POST /api/v1/auctions/:id/close` — *(Admin)* Finalize auction, run dividend engine, write double-entry ledger.

#### Installments & Payments (`/api/v1/payments`)
- `GET  /api/v1/payments/mine` — Fetch user's installment history and receipts.
- `POST /api/v1/payments/order` — Create Razorpay payment order for installment.
- `POST /api/v1/payments/webhook` — Razorpay HMAC-SHA256 signature-verified webhook.
- `POST /api/v1/payments/simulate` — Instant mock payment simulator for test mode.

#### Sureties & Disbursals (`/api/v1/sureties`)
- `GET  /api/v1/sureties/mine` — Get current prize money claim, guarantors & status.
- `POST /api/v1/sureties/:id/guarantors` — Add a co-guarantor with PAN & CIBIL score.
- `POST /api/v1/sureties/:id/submit` — Submit completed surety package for review.
- `POST /api/v1/sureties/:id/approve` — *(Admin)* Approve surety package.
- `POST /api/v1/sureties/:id/disburse` — *(Admin)* Execute RTGS prize money disbursal.

#### Document Uploads & Cloudinary (`/api/v1/media`)
- `POST /api/v1/media/sign-upload` — Generate HMAC-SHA1 signed Cloudinary upload params.
- `POST /api/v1/media/documents` — Save uploaded guarantor document metadata.
- `GET  /api/v1/media/documents/surety/:suretyId` — List all documents attached to a surety.
- `PATCH /api/v1/media/documents/:id/review` — *(Admin)* Verify or reject document.

#### Statutory Compliance & DPDP (`/api/v1/compliance`, `/api/v1/admin`)
- `GET  /api/v1/compliance/dpdp/export` — Export full DPDP personal data package (§ 11).
- `POST /api/v1/compliance/dpdp/consent` — Grant or update explicit consent purpose.
- `POST /api/v1/compliance/dpdp/withdraw` — Withdraw consent (§ 6(4)).
- `GET  /api/v1/compliance/form-xiv/:auctionId` — Generate Form XIV minutes of auction.
- `GET  /api/v1/compliance/gst-invoice/:auctionId` — Generate statutory 18% GST tax invoice.
- `GET  /api/v1/admin/dashboard` — Aggregated institutional metrics (AUM, collections).
- `GET  /api/v1/admin/ledger` — Full double-entry financial audit ledger.

### 8.2 WebSocket Events (Socket.IO)

All real-time auction bidding occurs through room-isolated WebSockets (`auction:${auctionId}`):

| Event Name | Direction | Payload Description |
|---|---|---|
| `join_auction` | Client -> Server | `{ auctionId }` — Joins the auction room. |
| `leave_auction` | Client -> Server | `{ auctionId }` — Leaves the auction room. |
| `auction_state` | Server -> Client | Current lowest bid, winning subscriber, and min bid. |
| `bid_placed` | Server -> Client | Broadcasts new lowest bid with bidder ticket number and timestamp. |
| `auction_closed` | Server -> Client | Broadcasts closing of auction with final winner and discount. |

---

## 9. Relational Database Schema & Data Integrity

The PostgreSQL relational store enforces strict relational integrity, foreign key cascading, and concurrency protection:

```
┌─────────────┐       1:N       ┌──────────────────┐       1:N       ┌───────────────┐
│    users    ├─────────────────┤  subscriptions   ├─────────────────┤ installments  │
└──────┬──────┘                 └────────┬─────────┘                 └───────┬───────┘
       │                                 │                                   │
       │ 1:N                             │ 1:N                               │ 1:1
       ▼                                 ▼                                   ▼
┌─────────────┐                 ┌──────────────────┐                 ┌───────────────┐
│dpdp_consents│                 │     sureties     │                 │   payments    │
└─────────────┘                 └────────┬─────────┘                 └───────────────┘
                                         │
                                         │ 1:N
                                         ▼
                                ┌──────────────────┐
                                │    guarantors    │
                                └────────┬─────────┘
                                         │ 1:N
                                         ▼
                                ┌──────────────────┐
                                │guarantor_document│
                                └──────────────────┘

┌─────────────┐       1:N       ┌──────────────────┐       1:N       ┌───────────────┐
│ chit_groups ├─────────────────┤  chit_auctions   ├─────────────────┤ auction_bids  │
└──────┬──────┘                 └────────┬─────────┘                 └───────────────┘
       │                                 │
       │ 1:N                             │ 1:N
       ▼                                 ▼
┌──────────────────────────────────────────────────┐
│                  ledger_entries                  │
│  (INSTALLMENT | DIVIDEND | PRIZE_PAYOUT | COMM)  │
└──────────────────────────────────────────────────┘
```

### Key Data Integrity Safeguards
1. **Pessimistic Row Locking (`SELECT ... FOR UPDATE`)**: Used during bid processing and auction closure to eliminate race conditions between simultaneous bidders.
2. **Integer Paise Storage**: Financial amounts are stored in integer paise (`amount_paise BIGINT`) alongside display rupees to prevent roundoff errors across months.
3. **Immutable Double-Entry Ledger**: Every rupee disbursed or credited has an associated immutable entry in `ledger_entries`.
4. **Audit Logging**: All security and state transitions write to `audit_events` with actor ID, timestamp, and IP address.

---

## 10. Statutory Compliance & Audit Trail

### 10.1 Chit Funds Act, 1982 Reference Mapping
- **Section 4**: Prior Sanction of State Government & FDR Bank Guarantee (Tracked in `chit_groups.pso_number` and `chit_groups.fdr_bank_guarantee_ref`).
- **Section 14**: Minimum & Maximum Discount Limit (Enforced at 5% floor and 40% statutory cap in `backend/src/routes/auctions.js`).
- **Section 18 & Rule 27**: Filing Form XIV Auction Minutes within 48 hours (Generated via `/api/v1/compliance/form-xiv/:auctionId`).
- **Section 21**: Foreman Commission strictly capped at 5% of chit amount (Enforced in `backend/src/services/dividend.js`).
- **Section 31**: Status of prized subscriber, surety vetting before prize payment (Enforced via `SB` to `PS` state machine in `backend/src/routes/sureties.js`).

### 10.2 DPDP Act, 2023 Reference Mapping
- **Section 6**: Itemized, purpose-specific consent logging (Captured in `dpdp_consents` table with IP address and user-agent).
- **Section 6(4)**: Right to withdraw consent (Executed via `/api/v1/compliance/dpdp/withdraw`).
- **Section 11**: Data Principal Right to Access and Portability (Automated complete data export via `/api/v1/compliance/dpdp/export`).
