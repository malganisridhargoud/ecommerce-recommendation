
# Equipment Rental SaaS - Multi-Sided Marketplace

A comprehensive, end-to-end multi-sided equipment rental marketplace (inspired by Airbnb's ecosystem) with dedicated portals for Buyers, Vendors, and Administrators. This platform is built with a state-of-the-art  design philosophy, featuring glassmorphism, smooth staggered animations, premium rounded UI tokens, and polished micro-interactions.

---

## 🛠 Tech Stack

### Frontend
- **Framework & Libraries**: React (Create React App), React Router v6
- **Styling**: Tailwind CSS, Vanilla CSS (`index.css` global design system with custom CSS variables)
- **State & Data Fetching**: React Context, Custom Hooks, Axios (configured with intercepts)
- **Authentication**: Clerk React SDK
- **Payments UI**: Stripe Elements (`@stripe/react-stripe-js`)
- **Data Visualization**: Recharts
- **UX Enhancements**: `react-hot-toast` (notifications), smooth CSS animations (`animate-fade-in`, staggered delays), glassmorphism utility classes.

### Backend
- **Framework**: Django, Django REST Framework (DRF)
- **Authentication Verification**: Custom Clerk JWT Validator Middleware
- **Payments**: Stripe Server-Side API & Webhooks
- **Machine Learning**: `scikit-learn` & `pandas` (for the recommendation engine)
- **API Structuring**: Function-based and Class-based DRF Views, comprehensive serializers.
- **Middleware**: Custom logging middleware, custom exception handlers.

### Database
- **Primary Database**: **MySQL** (Successfully migrated from SQLite, preserving all schemas, tables, and relational integrity mapping).
- **ORM**: Django ORM (with `select_for_update` transactional locks to prevent double-booking).

---

## ✨ Comprehensive Feature List

### 1. Global UI/UX Design System (Apple-Inspired)
- **Design Tokens**: Standardized CSS variables for spacing, easing (`250ms cubic-bezier(.16,1,.3,1)`), corner radii (`--radius: 18px`), and typography (`-apple-system, BlinkMacSystemFont, 'SF Pro Text'`).
- **Visuals**: Widespread use of glassmorphism (translucent backgrounds with blur), soft and premium drop shadows (`box-shadow: 0 8px 30px rgba(0,0,0,0.06)`), and alternating row colors for data tables.
- **Animations**: Page transition fade-ins, staggered list item reveals (Trust Strips, Equipment Cards, Recommendations), and smooth hover transformation scaling.
- **Theming**: Contextual Light Theme for Buyers, Dark Theme for Vendors. 

### 2. Authentication & Authorization
- **Role-Based Access Control (RBAC)**: Secure isolation between `Buyer`, `Vendor`, and `Admin` accounts.
- **Clerk Integration**: Seamless social and email/password login, integrated securely with Django backend via JWT validation.
- **Admin Gateway**: Invite-code guarded admin registration to prevent unauthorized escalation.

### 3. Equipment Discovery & Marketplace
- **Dynamic Search & Filtering**: Debounced search bar, category filtering, location filtering, and maximum price slider components.
- **Sorting Mechanisms**: Sort by most popular, price ascending, and price descending.
- **Equipment Detail Pages**: High-quality imagery layouts, detailed specification tables, and sticky booking panels calculating date-range totals.
- **Machine Learning Recommendations**: A hybrid AI recommendation engine (Content-based + Collaborative Filtering) built using `scikit-learn` that suggests contextual alternative equipment at the bottom of listings.
- **Star Ratings**: Visual 5-star rating aggregations computed from backend reviews.

### 4. Buyer Experience & Capabilities
- **Shopping Cart System**: Integrated "Add to Cart" functionality handling equipment state, letting buyers organize multiple rentals before checkout.
- **Wishlist Platform**: Save to Wishlist / Remove from Wishlist features spanning across the marketplace.
- **Buyer Dashboard**: 
  - **Orders Tab**: Track active, pending, shipped, delivered, and completed orders. Ability to cancel orders.
  - **Review Submission**: Conditional UI allowing reviews to be submitted only when an order is delivered/completed.
  - **Inbox**: Seamless, real-time messaging interface.
  - **Profile Settings**: Dedicated UI to update details (bio, phone number, languages spoken, etc.).
- **Dynamic Pricing Engine**: Server-side logic executing multi-day discount logic (e.g., 5% discount per 7-day run, capped at 25%), weekend pricing surges (+10%), and high-demand algorithm pricing (+20% if >60% inventory booked).
- **Stripe Checkout**: End-to-end integration handling deposits and rental fees via Stripe Payment Intents mapped identically to the backend DB.

### 5. Vendor Experience & Capabilities
- **Vendor Dashboard (Dark Theme Focus)**: Premium dark visuals emphasizing analytics and management.
- **Subscription Gates**: Vendors must activate a recurring Stripe Subscription to begin listing equipment (configurable via backend toggles).
- **Inventory Management**: Create, edit, and disable equipment listings directly from the GUI.
- **Booking Management**: Accept, deny, mark-as-shipped, and mark-as-delivered workflows for incoming buyer orders. Order cancellation is mutually permitted.
- **Profile Settings**: Update company profiles, vendor bios, contact info, and operational hours.
- **Review Interactions**: An Instagram-styled review reply system. When a vendor replies to a buyer's review, the comment nests directly underneath the primary review in the UI.

### 6. Communication Systems
- **WhatsApp-Style Messaging**: Full Buyer-Vendor Inbox system. Messages visually distinguish the sender (align left vs align right) with distinct chat bubbles, colors, and timestamps.
- **Identity Tags**: Clear roles injected above chat bubbles indicating "Buyer" or "Vendor" to prevent confusion.
- **Order Issues**: Reporting system allowing buyers to log issues against an order (e.g., "damaged item"), directly tying back into the vendor's dashboard.

### 7. Administrative Control Center
- **KPI Metrics Header**: Revenue, Active Vendors, Total Bookings, and Active Listings with Apple-styled rounded numerical displays.
- **Analytics Charts**: Recharts implementations showing bookings sorted dynamically by equipment category.
- **Global Activity Feeds**: Live chronological tables tracking recent platform bookings, Stripe payments, and public equipment reviews.

---

## 🔄 Complete Platform Workflow

### 1. New User Onboarding
1. User arrives at the highly-animated Home Page.
2. Clicks **Log In** -> Directed to Clerk Auth UI.
3. Upon First Login, pushed to a **Role Selection** Screen -> Registers as either a **Buyer** or **Vendor**.
4. Frontend syncs the new user configuration to the Django Backend (`User`, `UserProfile`, `Vendor` models generated).

### 2. Vendor Setup
1. Vendor is redirected to the **Vendor Dashboard**.
2. If forced-subscriptions are enabled in `.env`, the vendor hits a paywall to **Subscribe via Stripe**.
3. Vendor securely completes Stripe Checkout, backend webhook detects `invoice.payment_succeeded`, flips `subscription_active=True`.
4. Vendor navigates to **Equipments** tab -> Clicks **Add Listing**. Forms out names, descriptions, pricing, quantities, location.

### 3. Buyer Discovery & Purchase
1. Buyer searches the platform. They can narrow using the **Filters Panel** (left sidebar on Home page).
2. Visits **Equipment Detail Page**, checks available dates on calendar, sees exact price breakdown (base + deposit + surge - discounts).
3. Clicks **Add to Cart** or directly proceeds to book.
4. Fills out Shipping details -> Clicks **Confirm and Pay**.
5. Stripe PaymentElement mounts. Buyer checks out. Order status set to `CONFIRMED`.

### 4. Order Lifecycle & Communication
1. Vendor sees new order in **Dashboard -> Bookings**.
2. Vendor physically ships item -> Clicks **Mark Shipped**.
3. Buyer receives item -> Vendor/Buyer agree it's arrived -> Clicks **Mark Delivered**.
4. Both parties communicate via the **Messages Tab**. Chat correctly scopes context between specific Vendor/Buyer nodes, rendering native chat-bubbles. 
5. Order reaches end of rental parameter -> Status updated to `COMPLETED`.

### 5. Post-Rental
1. Buyer navigates back to **Orders Tab**. The UI unlocks the **Leave a Review** module for the completed equipment.
2. Buyer leaves a 1-5 Star review with title and details.
3. Vendor navigates to their **Dashboard -> Reviews**. They click **Reply** to the Buyer's review.
4. The Equipment page instantly updates, displaying the Buyer's review alongside the Vendor's nested reply (Instagram/Twitter styled nested layout).
5. The Machine Learning artifact rebuilds occasionally in the background to analyze the new conversion data and refine future recommendations for the platform.

---

## 🚀 Running the Platform Locally

1. **MySQL Database**: Ensure MySQL is running on port `3306`, and a database named `rental_saas` exists.
2. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # (or .\venv\Scripts\activate on Windows)
   pip install -r requirements.txt
   python manage.py runserver
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Deployment Ready Setup

This repo now includes production deployment scaffolding for a split frontend/backend setup:

- `equipment-rental-saas/render.yaml`
- backend env template at `equipment-rental-saas/backend/.env.example`
- frontend env template at `equipment-rental-saas/frontend/.env.example`
- backend health endpoint at `/health/`

### Backend production notes

- The backend is configured to run through ASGI with `daphne`, which is required for WebSocket booking updates.
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` are env-driven.
- SSL, secure cookies, forwarded headers, and HSTS can be controlled entirely through environment variables.

### Frontend production notes

- The frontend expects:
  - `REACT_APP_API_URL`
  - `REACT_APP_CLERK_PUBLISHABLE_KEY`
  - `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- The Render config includes an SPA rewrite so `BrowserRouter` routes work in production.

### Minimum environment variables

Backend:

- `DJANGO_SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS`
- `CSRF_TRUSTED_ORIGINS`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- database credentials (`DB_*`) or SQLite fallback for non-production demos
- Stripe keys
- Clerk JWKS / issuer values

Frontend:

- `REACT_APP_API_URL`
- `REACT_APP_CLERK_PUBLISHABLE_KEY`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`

### Recommended production flow

1. Copy `backend/.env.example` to `backend/.env` and fill real secrets.
2. Copy `frontend/.env.example` to frontend environment settings and fill real public keys.
3. Deploy backend first and confirm `https://your-backend/health/` returns `{"status":"ok"}`.
4. Set the frontend `REACT_APP_API_URL` to the deployed backend `/api` URL.
5. Update backend `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` to the deployed frontend domain.
6. Redeploy frontend.
>>>>>>> 8219e3e (changed)
