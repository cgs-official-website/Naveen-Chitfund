# ChitTech Flutter App (MVP)

Flutter + Dart client for ChitTech, targeting iOS and Android from one codebase.
Riverpod for state, go_router for routing, dio + web_socket_channel for networking.

## Setup

```bash
flutter pub get
```

Point the app at your backend (see `chittech-backend`):

```bash
# Android emulator hitting a locally-running backend
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000

# iOS simulator hitting a locally-running backend
flutter run --dart-define=API_BASE_URL=http://localhost:4000

# Pointed at a deployed backend
flutter run --dart-define=API_BASE_URL=https://your-app.up.railway.app
```

If no `--dart-define` is passed, it defaults to `http://10.0.2.2:4000` (Android emulator
loopback to host machine) — see `lib/core/constants/api_config.dart`.

## Test accounts

Use the backend's seed script output:
- Admin: `+919999900000`
- 5 subscribers: `+919999900001` … `+919999900005`

Login flow: enter phone → OTP is printed to the **backend's** server console (mock SMS) →
enter the 6-digit code.

## RBAC navigation

`lib/router/app_router.dart` is the single place that decides which navigation graph a
logged-in token can enter (`_redirect`). `UserShell` (bottom nav: Home, My Chits, Auctions,
Payments, Profile) and `AdminShell` (drawer nav: Dashboard, Groups, Subscribers, Ledger,
Settings) are structurally separate widget trees — an admin token is redirected out of
`/user/*` before the shell is ever built, and vice versa. The backend remains the actual
enforcement boundary (every admin route requires `requireRole('admin')` — see the backend
repo); this is defense-in-depth on the client, not the security boundary itself.

## Live auction screen

`lib/screens/user/live_auction_screen.dart` and its admin counterpart
`lib/screens/admin/admin_live_auction_control_screen.dart` connect to the backend's
Socket.IO room for a specific `auction_id` (see `lib/core/network/socket_service.dart`),
show the live lowest bid and a real-time bid feed, disable the bid button while a request is
in-flight, and auto-reconnect on socket drop. **Test these against the real backend auction
engine** (`npm run dev` in the backend, then start an auction from the admin app) — mocked
data will not exercise the reconnect logic or the Redis-backed lowest-bid ordering.

Note: `socket_service.dart` implements a minimal Socket.IO-protocol-compatible client using
`web_socket_channel` directly. For production, swap in the `socket_io_client` package (proper
Engine.IO handshake + ack frames) — the interface (`connectToAuction`, `connectionState`,
`disconnect`) is designed so screens don't need to change when you do.

## What's stubbed / explicitly out of scope

- **Razorpay checkout**: `installment_payment_screen.dart` creates the order via the backend
  and has a clearly marked `TODO(razorpay-sdk)` block where `razorpay_flutter`'s native
  checkout call goes — that SDK needs native Android/iOS project config this repo doesn't
  include.
- **KYC document upload**: `lib/services/kyc_service.dart` is isolated specifically so a real
  DigiLocker/Aadhaar integration can replace the stub PAN-only flow later without touching
  screens.
- **Regional-language UI**: `lib/l10n/` is a placeholder folder only.
- **Offline-tolerant mode**: `screens/shared/offline_screen.dart` is a static fallback, not a
  queued-writes/sync system.

## Design system

Shared widgets live in `lib/widgets/`: buttons and inputs, cards (chit-group card,
transaction row, subscriber row), status badges (NPS/SB/PS, KYC states, group/auction status),
and loading skeletons + empty/error states. Screens compose these rather than hand-rolling UI.
Currency formatting (₹ with lakh/crore grouping) is centralized in
`lib/core/utils/currency_formatter.dart`.

Theme: `lib/core/theme/app_theme.dart` — deep navy/indigo primary + warm gold accent, Material 3,
light and dark mode, Google Fonts (Inter body / Plus Jakarta Sans display).
