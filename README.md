# TapRent

TapRent is a full-stack equipment rental marketplace built with React and Django. It supports buyer bookings, vendor inventory management, Stripe-powered payments and subscriptions, role-based dashboards, Clerk authentication, real-time booking updates over WebSockets, and admin moderation tooling.

## Stack

- Frontend: React 18, React Router, Tailwind CSS, Clerk, Stripe.js, Axios, Recharts
- Backend: Django, Django REST Framework, Daphne, Channels
- Realtime: Django Channels with in-memory layers locally and Redis in production
- Payments: Stripe Payment Intents, Stripe Checkout subscriptions, webhooks, payouts
- Auth: Clerk JWT validation plus Clerk webhook support
- Data: SQLite by default

## Repository Structure

```text
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
|   |-- core/
|   |-- manage.py
|   |-- requirements.txt
|   |-- build.sh
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
|   `-- Dockerfile
|-- docker-compose.yml
`-- README.md
```

## Core Features

### Buyer experience

- Browse equipment listings and detail pages
- Add date-based items to cart
- Checkout with Stripe
- Track orders from buyer dashboard
- Access chat threads and FAQ assistant endpoints

### Vendor experience

- Create and manage inventory listings
- View bookings and operational activity from the vendor dashboard
- Upgrade to a paid Growth plan through Stripe Checkout
- Confirm subscription sessions after checkout and unlock gated vendor capabilities
- Manage payout data and vendor bank account records
- Receive live booking events over WebSockets

### Admin experience

- Review vendors and KYC submissions
- Moderate equipment listings
- Access control-plane analytics
- Manage disputes, support tickets, and user actions

### Platform services

- Clerk-based auth for API and WebSocket access
- Stripe webhooks for booking payments and subscription lifecycle events
- Optional subscription enforcement for vendor listing access
- Health check endpoint for deployment monitoring

## Frontend Routes

The main React routes are defined in `frontend/src/App.jsx`.

- `/` and `/equipment`: marketplace home
- `/equipment/:id`: equipment details
- `/checkout`: buyer checkout
- `/pricing`: pricing page
- `/login`, `/login/buyer`, `/login/vendor`, `/login/admin`: auth entry points
- `/buyer` and `/dashboard`: buyer dashboard
- `/vendor`: vendor dashboard
- `/admin`: admin dashboard

## Backend API Overview

The Django API root is mounted under `/api/`.

- `/api/users/`: user sync and Clerk webhook flows
- `/api/equipment/`: equipment CRUD, reviews, wishlist, cart helpers
- `/api/bookings/`: booking lifecycle and payment confirmation endpoints
- `/api/payments/`: Stripe checkout, subscription confirmation, payouts, bank account endpoints
- `/api/vendors/`: vendor profile and related vendor endpoints
- `/api/subscriptions/`: subscription tiers, usage, upgrade, cancel
- `/api/chat/`: threads, messages, FAQ, assistant
- `/api/control/`: admin moderation, KYC, disputes, support tickets
- `/api/analytics/`: vendor and admin analytics
- `/api/recommendations/`: recommendation endpoints

Operational endpoints:

- `/`: root health response
- `/health/`: deployment health check
- `/admin/`: Django admin

## Local Development

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd equipment-rental-saas
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
```

Activate the environment:

- Windows PowerShell: `.\venv\Scripts\Activate.ps1`
- macOS/Linux: `source venv/bin/activate`

Install dependencies and run migrations:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`.

## Environment Variables

Copy the example env files before starting:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

### Backend variables

Required or important backend settings:

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

DB_ENGINE=sqlite
DB_SQLITE_PATH=db.sqlite3

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
STRIPE_CURRENCY=inr
REQUIRE_VENDOR_SUBSCRIPTION=False

CLERK_JWKS_URL=
CLERK_ISSUER=
CLERK_WEBHOOK_SECRET=

FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

REDIS_URL=
```

Notes:

- `DB_ENGINE=sqlite` is the simplest local setup and is the current default.
- `DATABASE_URL` or `DB_NAME` can also be used for non-SQLite deployments.
- `REQUIRE_VENDOR_SUBSCRIPTION=False` is useful in local development; production usually enables it.
- If `REDIS_URL` is not set, caching and channel layers fall back to local in-memory implementations.

### Frontend variables

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
```

## Realtime Behavior

TapRent uses Django Channels for WebSocket traffic.

- ASGI entrypoint: `backend/config/asgi.py`
- Booking consumers: `backend/apps/bookings/consumers.py`
- Equipment consumers: `backend/apps/equipment/consumers.py`
- Frontend socket helper: `frontend/src/lib/realtime.js`

Local development works without Redis using the in-memory channel layer. For multi-instance or production realtime, set `REDIS_URL`.

## Stripe Integration

Stripe is used in two main ways:

- Booking payments with Payment Intents
- Vendor Growth plan billing with Stripe Checkout subscriptions

Relevant backend files:

- `backend/apps/bookings/views.py`
- `backend/apps/payments/views.py`
- `backend/apps/payments/urls.py`

Important behavior:

- The vendor plan checkout redirects back to `/vendor?success=true&session_id={CHECKOUT_SESSION_ID}`
- The frontend confirms that session through `/api/payments/confirm-subscription-session/`
- Stripe webhooks update payment and subscription state server-side

For local webhook testing, use the Stripe CLI and point events at:

```text
http://localhost:8000/api/payments/webhook/
```

## Clerk Integration

Clerk handles identity on the frontend and token verification on the backend.

- Frontend provider: `frontend/src/App.jsx`
- Backend auth class: `backend/core/authentication/clerk_auth.py`
- WebSocket auth: `backend/core/authentication/websocket_auth.py`

To make authenticated API requests work correctly:

- set `REACT_APP_CLERK_PUBLISHABLE_KEY` in the frontend
- set `CLERK_JWKS_URL` and `CLERK_ISSUER` in the backend
- set `CLERK_WEBHOOK_SECRET` if you use Clerk webhook syncing

## Data and Database Notes

The current backend settings support:

- SQLite via `DB_ENGINE=sqlite`
- `DATABASE_URL` parsing for hosted databases
- explicit MySQL config via `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

There is also a one-time migration command for importing legacy MySQL data into SQLite:

```bash
cd backend
python manage.py migrate_mysql_to_sqlite
```

This uses the `MYSQL_SOURCE_*` settings from `backend/.env`.

## Docker

The repo includes a root `docker-compose.yml` with three services:

- `redis`
- `backend`
- `frontend`

To run the full stack with Docker:

```bash
docker compose up --build
```

Default exposed ports:

- Frontend: `3000`
- Backend: `8000`
- Redis: `6379`

## Render Deployment

The backend includes `backend/render.yaml` and `backend/build.sh`.

Production behavior:

- build command installs requirements, collects static files, and runs migrations
- start command uses Daphne: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
- a persistent disk is configured for SQLite in the provided Render blueprint

If you deploy the frontend separately, make sure:

- `FRONTEND_URL` on the backend matches the deployed frontend origin
- `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` include the frontend domain
- `REACT_APP_API_URL` on the frontend points to the deployed backend `/api`

## Useful Commands

Backend:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
python manage.py collectstatic --no-input
```

Frontend:

```bash
npm start
npm run build
npm test
```

## Current Project Notes

- Recommendations endpoints currently return placeholder/mock responses.
- Redis is optional locally but recommended for production realtime workloads.
- Stripe subscription activation depends on both checkout confirmation and webhook/state sync.
- Vendor subscription enforcement can be toggled via `REQUIRE_VENDOR_SUBSCRIPTION`.

