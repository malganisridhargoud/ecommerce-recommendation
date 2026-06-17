## TapRent SaaS
TapRent is a professional full-stack equipment rental marketplace built with React and Django. The platform seamlessly handles buyer bookings, vendor inventory management, Stripe-powered payments and subscriptions, role-based dashboards, Clerk authentication, and comprehensive admin moderation tooling.
## Stack

* Frontend: React 18, React Router, Tailwind CSS, Clerk Auth, Stripe.js, Axios, Recharts
* Backend: Django, Django REST Framework, Gunicorn (WSGI)
* Payments: Stripe Payment Intents, Stripe Checkout Subscriptions, Webhooks, Payouts
* Authentication: Clerk JWT validation & Clerk webhook synchronization
* Database: SQLite (default), with pluggable support for PostgreSQL/MySQL via DATABASE_URL
* Deployment: Render [1] 

## Repository Structure

equipment-rental-saas/
|-- backend/

|   |-- apps/
|   |   |-- analytics/
|   |   |-- bookings/
|   |   |-- communications/
|   |   |-- control/
|   |   |-- equipment/
|   |   |-- payments/
|   |   |-- recommendations/
|   |   |-- subscriptions/
|   |   |-- users/
|   |   `-- vendors/
|   |-- config/
|   |   |-- settings.py
|   |   |-- urls.py
|   |   `-- wsgi.py
|   |-- core/
|   |-- manage.py
|   |-- requirements.txt
|   |-- build.sh
|   |-- Dockerfile
|   `-- render.yaml
|-- frontend/

|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- App.jsx
|   |   `-- index.js
|   |-- package.json
|   `
|
`-- README.md

## Core Features## Buyer Experience

* Browse equipment listings with advanced filtration and detailed specification pages.
* Add date-based items to a localized cart management system.
* Secure checkout flows processed via Stripe.
* Comprehensive order history and status tracking via the Buyer Dashboard.
* Access to customer support chat threads and automated FAQ assistance endpoints.

## Vendor Experience

* Create, update, and manage asset inventory listings.
* Track business metrics, bookings, and operational logistics from the Vendor Dashboard.
* Upgrade to a premium Growth plan through Stripe Checkout subscriptions.
* Automated subscription session verification to unlock gated vendor features.
* Manage payout routing and commercial bank account configurations.

## Admin Experience

* Vendor verification pipelines and KYC submission management.
* Marketplace moderation for equipment listings.
* Centralized control-plane analytics for platform health.
* Dispute management, support ticket routing, and user audit logs.

## Platform Services

* Clerk-based secure token authentication for all API endpoints.
* Stripe Webhook listeners to automate booking fulfillment and subscription lifecycles.
* Conditional subscription enforcement rules for vendor listing access.
* Dedicated health check endpoints for automated deployment monitoring.

## Frontend Routes
The main React routes are defined in frontend/src/App.jsx.

* / and /equipment: Marketplace discovery home
* /equipment/:id: Equipment specifications and booking
* /checkout: Transaction processing
* /pricing: Tiered vendor subscription plans
* /login, /login/buyer, /login/vendor, /login/admin: Role-based authentication entry points
* /buyer and /dashboard: Portal for customer operations
* /vendor: Portal for supplier operations
* /admin: Portal for platform moderation

## Backend API Overview
The Django API root is mounted under /api/.

* /api/users/: User profile sync and Clerk webhook consumers
* /api/equipment/: Equipment CRUD, user reviews, wishlists, and cart verification
* /api/bookings/: Booking state machine and payment intent verification
* /api/payments/: Stripe setup, subscription sessions, payouts, and bank routing
* /api/vendors/: Vendor profile compilation and merchant metadata
* /api/subscriptions/: Subscription tier lookup, usage tracking, and cancellations
* /api/chat/: Customer support threads, asynchronous messaging, and assistant endpoints
* /api/control/: Admin moderation, KYC, disputes, and ticket handling
* /api/analytics/: Multi-tenant business intelligence data
* /api/recommendations/: Algorithmic cross-selling endpoints

## Operational Endpoints

* /: Root health status
* /health/: Automated infrastructure deployment check
* /admin/: Native Django administration console

## Local Development## 1. Environment Cloning

git clone <your-repo-url>
cd equipment-rental-saas

## 2. Backend Setup

cd backend
python -m venv venv

Activate the environment:

* Windows (PowerShell): .\venv\Scripts\Activate.ps1
* macOS/Linux: source venv/bin/activate

Install dependencies and run migrations:

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

The API layer will initialize at http://localhost:8000.
## 3. Frontend Setup
Open a separate terminal window:

cd frontend
npm install
npm start

The client layer will initialize at http://localhost:3000.
## Environment Variables
Establish local environment settings configuration files before system initialization:

* Copy backend/.env.example to backend/.env
* Copy frontend/.env.example to frontend/.env

## Backend Configurations (backend/.env)

DJANGO_SECRET_KEY=your-secure-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

DB_ENGINE=sqlite
DB_SQLITE_PATH=db.sqlite3

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
STRIPE_CURRENCY=inr
REQUIRE_VENDOR_SUBSCRIPTION=False

CLERK_JWKS_URL=https://...
CLERK_ISSUER=https://...
CLERK_WEBHOOK_SECRET=whsv_...

FRONTEND_URL=http://localhost:3000

Note: Toggle REQUIRE_VENDOR_SUBSCRIPTION=True to test paywalled features locally.
## Frontend Configurations (frontend/.env)

REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

## Stripe Integration
The platform manages economic value across two main design patterns:

   1. Direct Rentals: Ad-hoc booking charges executed via Stripe Payment Intents.
   2. SaaS Memberships: Recurring Vendor growth strategies using Stripe Checkout subscriptions. [2] 

## Critical Backend Files

* backend/apps/bookings/views.py
* backend/apps/payments/views.py
* backend/apps/payments/urls.py

## Transaction Lifecycle

* Successful vendor subscription checkouts return to: /vendor?success=true&session_id={CHECKOUT_SESSION_ID}
* The React runtime hands this token off to /api/payments/confirm-subscription-session/ for server-side verification.
* Stripe Webhook events asynchronously update core transactional databases to remain clear of race conditions.

To route and capture background asynchronous webhooks locally, configure the Stripe CLI:

stripe listen --forward-to localhost:8000/api/payments/webhook/

## Clerk Integration
User identities are managed externally through Clerk, enforcing absolute perimeter security.

* Frontend Identity Provider: Enwrapped within frontend/src/App.jsx.
* Backend Authentication Guard: Handled cleanly through backend/core/authentication/clerk_auth.py.

To ensure consistent token handshakes:

* Provide REACT_APP_CLERK_PUBLISHABLE_KEY on your client runtime.
* Provide validated CLERK_JWKS_URL and CLERK_ISSUER parameters on the backend settings file.

## Data Utilities and Engine Conversions
The architecture cleanly decouples the application engine from database storage backends:

* Local setups run seamlessly on lightweight SQLite via DB_ENGINE=sqlite.
* Advanced environments parse connection parameters instantly from the standard DATABASE_URL.

A native database utility has been packaged to easily ingest historical system structures:

cd backend
python manage.py migrate_mysql_to_sqlite

Note: Ensure source connection credentials are set inside MYSQL_SOURCE_* environments before execution.
