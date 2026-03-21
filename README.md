# TapRent 🚀 - AI-Powered Professional Equipment Marketplace

TapRent is a state-of-the-art, full-stack SaaS platform designed for high-end equipment rental houses. It features an **AI-driven recommendation engine**, real-time merchant-client synchronization, and a premium "Gold Access" vendor ecosystem.

![TapRent Logo](https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop)

## 🏗️ Technical Architecture

### Core Stack
- **Frontend**: React 18, Tailwind CSS, Lucide React, Clerk Auth, React Router v6.
- **Backend**: Django 4.2+, Django REST Framework, MySQL, Daphne (ASGI/WebSocket).
- **Payment & Subs**: Stripe (Recurring billing, Webhooks, Payouts).
- **AI/ML**: Scikit-Learn, Pandas (Personalized equipment recommendations).
- **Real-time**: Django Channels, Redis-ready Pulse Engine.

## ✨ Industry-Grade Features

### 💎 Premium Merchant Portal
- **Dual-State UI**: Seamless transition between "Standard" (Light/Minimal) and "Growth" (Luxury Gold/Charcoal) dashboard themes.
- **Inventory Matrix**: Professional listing management with availability tracking and high-res media.
- **Order Orchestration**: End-to-end booking lifecycle management.
- **Merchant Pulse**: Real-time messaging and event stream for client interaction.

### 🤖 AI Recommendation Engine
- **Predictive Matching**: Personalized gear suggestions based on user behavior and equipment similarity.
- **Smart Filters**: High-fidelity search with geo-proximity and categorized deep-links.

### 💳 Tiered Monetization
- **Strategic Gating**: Subscription-enforced listing limits and premium feature locks.
- **Automated Payouts**: Integrated Stripe flow for vendor revenue management.

## 🚀 Deployment & Installation

### 1. Environment Sync
Ensure `.env` files are configured in both `backend/` and `frontend/` using the provided `.env.example` templates.

### 2. Backend Orchestration
```bash
cd backend
python -m venv venv
# Activate venv then:
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Orchestration
```bash
cd frontend
npm install
npm run start
```

## 🔐 Security & Governance
- **Role-Based Access Control (RBAC)**: Distinct permissions for Buyers, Vendors, and Administrators.
- **Encrypted Gateways**: All financial transactions handled via Stripe's PCIe-compliant stack.
- **Admin Control Plane**: Dedicated interface for platform-wide oversight and dispute resolution.

---

**TapRent is more than a rental tool—it's a fleet intelligence engine.** Scale your assets from solo sets to multi-region fleets with the absolute gold standard in rental software.

*Crafted for the next generation of professional equipment merchants.*
