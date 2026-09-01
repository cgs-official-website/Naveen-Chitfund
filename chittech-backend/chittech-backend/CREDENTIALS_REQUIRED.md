# ChitTech Backend — Required Client Credentials & Configuration Checklist

> **Purpose:** This document lists all credentials, external accounts, and environment configurations required to deploy and run the **ChitTech Backend** in a production or staging environment. Please provide the required access keys, database credentials, and service details securely.

---

## 📋 Summary of Required Services & Accounts

| Service / Component | Purpose | Where to Obtain / Manage | Required Details |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Core relational database for user data, chit groups, bids, and transactions | AWS RDS / Supabase / Neon / Railway / DigitalOcean | `DATABASE_URL` (Host, Port, User, Password, Database Name) |
| **Redis Server** | Real-time auctions, live bidding state, and session caching | Redis Cloud / Upstash / AWS ElastiCache / Railway | `REDIS_URL` (Host, Port, Password) |
| **Razorpay** | Payment gateway for user subscriptions, deposits, and payouts | [Razorpay Dashboard](https://dashboard.razorpay.com/) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| **Auth & Security** | User authentication & JWT token generation | Internal Configuration | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| **Domain / Frontend** | Cross-Origin Resource Sharing (CORS) | Client Hosting / DNS | `CORS_ORIGIN`, `PORT`, `NODE_ENV` |

---

## 1. PostgreSQL Database

The backend requires a PostgreSQL database instance (v14+ recommended).

* **Variable Name:** `DATABASE_URL`
* **Format:** `postgres://<username>:<password>@<host>:<port>/<database_name>?sslmode=require`
* **Information Needed from Client:**
  * **Database Host:** (e.g., `db.xxxxxx.supabase.co` or `xxxx.rds.amazonaws.com`)
  * **Database Port:** (Default: `5432`)
  * **Database Name:** (e.g., `chittech_prod`)
  * **Database Username:** (e.g., `postgres` or `chittech_admin`)
  * **Database Password:** (Secure master password)
  * **SSL Requirement:** (Indicate if SSL certificate or `sslmode=require` is needed)

---

## 2. Redis Instance

Redis is required for socket-based live bidding auctions and state caching.

* **Variable Name:** `REDIS_URL`
* **Format:** `redis://default:<password>@<host>:<port>` or `rediss://...` (for TLS/SSL)
* **Information Needed from Client:**
  * **Redis Host:** (e.g., `redis-12345.c1.us-east-1.rediss.com`)
  * **Redis Port:** (Default: `6379`)
  * **Redis Password / Auth Token**

---

## 3. Razorpay Payment Gateway

Razorpay is used for processing chit fund contributions, installment payments, and recording payment webhooks.

* **Dashboard URL:** [https://dashboard.razorpay.com/#/access/api_keys](https://dashboard.razorpay.com/#/access/api_keys)
* **Information Needed from Client:**
  1. **Razorpay Key ID (`RAZORPAY_KEY_ID`)**:
     * Example: `rzp_live_xxxxxxxxxxxxxxxx` (for Production) or `rzp_test_xxxxxxxxxxxxxxxx` (for Testing/UAT)
  2. **Razorpay Key Secret (`RAZORPAY_KEY_SECRET`)**:
     * Generated when creating the API Key in Razorpay Dashboard.
  3. **Razorpay Webhook Secret (`RAZORPAY_WEBHOOK_SECRET`)**:
     * Configured when adding the webhook endpoint in the Razorpay dashboard.

### ⚙️ Webhook Configuration on Razorpay Dashboard:
* **Webhook URL:** `https://<YOUR_BACKEND_DOMAIN>/api/v1/payments/webhook`
* **Active Events to Select:**
  * `payment.captured`
  * `payment.failed`
  * `order.paid`
* **Secret:** Enter a strong random secret phrase and share this as `RAZORPAY_WEBHOOK_SECRET`.

---

## 4. Application Authentication & Security

* **`JWT_SECRET`**:
  * A strong, random alphanumeric secret string (min. 32–64 characters) used to sign and verify JSON Web Tokens for user login sessions.
  * *Example generation command:* `openssl rand -base64 32`
* **`JWT_EXPIRES_IN`**:
  * Token validity period.
  * *Recommended value:* `7d` (7 days) or `30d` (30 days).

---

## 5. Server & Environment Configuration

* **`NODE_ENV`**: Set to `production` for live deployment (or `staging` / `development`).
* **`PORT`**: The network port the server listens on (e.g., `4000` or assigned automatically by cloud platforms like Railway / AWS / Heroku).
* **`CORS_ORIGIN`**: The full URL(s) of the client frontend application allowed to make API requests.
  * *Example:* `https://app.yourdomain.com,https://admin.yourdomain.com`

---

## 📦 Production `.env` Template

Below is the environment file template to be populated:

```env
# ==============================================================================
# SERVER CONFIGURATION
# ==============================================================================
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://app.yourdomain.com

# ==============================================================================
# DATABASE CONFIGURATION (PostgreSQL)
# ==============================================================================
DATABASE_URL=postgres://<username>:<password>@<host>:5432/<database_name>?sslmode=require

# ==============================================================================
# REDIS CONFIGURATION (Auctions & Caching)
# ==============================================================================
REDIS_URL=redis://default:<password>@<host>:6379

# ==============================================================================
# JWT AUTHENTICATION
# ==============================================================================
JWT_SECRET=<strong_random_secret_string>
JWT_EXPIRES_IN=7d

# ==============================================================================
# RAZORPAY PAYMENT GATEWAY
# ==============================================================================
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔒 Security & Handover Instructions

> [!IMPORTANT]
> **Please do not send credentials over unsecured plain text (such as standard email or unencrypted chat).**
>
> **Recommended Sharing Methods:**
> 1. Use a password manager share link (e.g., 1Password, Bitwarden Send).
> 2. Use an encrypted one-time secret sharing link (e.g., [PasswordPusher](https://pwpush.com/) or [One-Time Secret](https://onetimesecret.com/)).
> 3. Add developers directly to the cloud consoles (AWS, Supabase, Razorpay Team Members) with role-based access.
