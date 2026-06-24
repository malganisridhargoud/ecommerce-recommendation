# TapRent | Premium Equipment Rental Marketplace SaaS

![React](https://img.shields.io/badge/React-18.0-blue)
![Django](https://img.shields.io/badge/Django-REST_Framework-092E20)
![Stripe](https://img.shields.io/badge/Payments-Stripe-indigo)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)
![Bootstrap](https://img.shields.io/badge/UI-Bootstrap_5-purple)

TapRent is a professional, full-stack, multi-tenant marketplace connecting owners of idle professional equipment with users who need short-term access. It features a conflict-free booking engine, tiered vendor SaaS subscriptions, and dynamic surge pricing.
---

## 🌍 The Real-World Problem We Solve

**The Core Issue:** Professional equipment (high-end cameras, construction gear, event lighting, medical tools) is incredibly expensive to purchase outright, depreciates rapidly, and often sits idle in storage for 80% of its lifespan. 

Conversely, creators, contractors, and event organizers frequently need temporary access to specialized gear but cannot justify the crippling upfront capital expenditure. 

**The Current Landscape is Broken:**
- **Inefficient:** Existing rental businesses rely on manual phone calls, spreadsheets, and fragmented physical storefronts.
- **Risky:** Peer-to-peer sharing lacks secure escrow payments, identity verification, and conflict-free booking guarantees (leading to double-bookings).
- **Poor UX:** Outdated digital catalogs make discovery and checkout frustrating for modern consumers.

## 💡 The TapRent Solution

TapRent democratizes access to professional gear by transforming idle assets into revenue streams. It provides a centralized, secure, and Apple-inspired marketplace that abstracts away the complexities of scheduling, payment routing, and trust. 

* **For Renters (Buyers):** Instant access to a massive catalog of local gear, secured by Stripe escrow, with automated availability checks and transparent dynamic pricing.
* **For Owners (Vendors):** A powerful "business-in-a-box" dashboard to manage fleet inventory, track revenue analytics, and scale their rental operations. 

---

## 🔄 End-to-End Workflow

The platform operates on a multi-role architecture, ensuring a seamless lifecycle from listing to return.

### 1. The Vendor Journey (Supply Side)
1. **Onboarding:** A user signs up via Clerk Authentication and selects the "Vendor" role.
2. **SaaS Subscription:** To unlock unlimited listings and advanced analytics, the vendor subscribes to the **TapRent Vendor Pro** plan (billed monthly via Stripe Checkout).
3. **Fleet Management:** The vendor lists their equipment, setting base prices, images, and inventory quantities.
4. **Order Fulfillment:** When a booking occurs, the vendor uses their dashboard Kanban board to transition the order state: `Pending` → `Confirmed` → `Shipped` → `Delivered` → `Completed`.

### 2. The Buyer Journey (Demand Side)
1. **Discovery:** Buyers browse the marketplace to discover relevant gear.
2. **Conflict-Free Booking:** The buyer selects rental dates. The backend instantly calculates dynamic pricing (applying multi-day discounts or weekend surges) and verifies inventory availability.
3. **Secure Checkout:** The buyer pays via Stripe Payment Intents or Cash on Delivery.
4. **Reputation Loop:** Once the vendor marks the item as `Delivered`, the buyer can leave a verified rating and review, powering the platform's trust ecosystem.

---

## 🏗️ Architecture & Tech Stack

The application strictly separates the client presentation layer from the core business logic.

### Frontend (Client)
- **Framework:** React 18 (Create React App)
- **Routing:** React Router v6
- **Styling:** Bootstrap 5 (Utility-first, heavily customized with a premium Slate & Indigo design system via `index.css`)
- **State/API:** Axios interceptors, React context

### Backend (API Server)
- **Framework:** Django 5.x & Django REST Framework
- **Database:** SQLite (local development) / MYSQL
- **Booking Engine:** Custom transactional locking system using database-level `SELECT FOR UPDATE`.

### External Services
- **Identity & Auth:** Clerk (JWT validation)
- **Payments:** Stripe (Payment Intents for rentals, Checkout Sessions for SaaS tiers)

---

## ⚙️ Core Systems Deep Dive

### 1. The Booking Engine (Race-Condition Proof)
Preventing double-bookings is critical. When a user attempts to checkout, the backend utilizes `transaction.atomic()` and `select_for_update()`. This locks the specific equipment row in the database. The system then queries all active overlapping bookings using inclusive bounds (`Q(start_date__lte=end_date) & Q(end_date__gte=start_date)`). If the overlapping count exceeds the physical `quantity` of the item, the transaction is safely aborted with a `409 Conflict`.

### 2. Dynamic Pricing Engine
The API automatically calculates fair pricing based on market conditions:
- **Multi-day discounts:** 5% off per full week booked (capped at 25%).
- **Weekend Surges:** +10% if the booking touches a Saturday or Sunday.
- **High-Demand Surges:** +20% if over 60% of the fleet for that item is currently booked.

### 3. Service-Oriented Refactoring
Business logic (like Stripe payment captures, complex cart iterations, and refund processing) is cleanly decoupled from HTTP Request/Response views. Controllers in `views.py` delegate heavy lifting to isolated functions in `services.py`, adhering to clean architecture principles.

---

## 💻 Local Development Guide

### 1. Repository Setup
```bash
git clone <your-repo-url>
cd taprent/ecommerce-recommendation
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Environment
# Windows: .\venv\Scripts\Activate.ps1
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*The API will be available at `http://localhost:8000/api/`*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm start
```
*The React application will be available at `http://localhost:3000`*

### 4. Environment Variables
You must configure your `.env` files for the platform to function.

**`backend/.env`**
```ini
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=inr
REQUIRE_VENDOR_SUBSCRIPTION=False

CLERK_JWKS_URL=https://...
CLERK_ISSUER=https://...
```

**`frontend/.env`**
```ini
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

