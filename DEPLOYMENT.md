# Deployment Guide

Your codebase has been automatically configured to support deployment to Vercel (Frontend) and Render (Backend & Database)! Here is how to launch your project.

## 1. Backend & Database (Render)
We have added a blueprint `render.yaml` to the `backend/` directory which completely automates the infrastructure setup.

1. Push your repository to GitHub.
2. Go to **Render** -> **New** -> **Blueprint**.
3. Connect your GitHub repository and select the `backend/render.yaml` blueprint.
4. Render will automatically provision:
   - A **PostgreSQL Database** (Free tier)
   - A **Redis server** (Free tier) for WebSockets
   - A **Web Service** running Django/Daphne
5. In the Render Dashboard, go to your Web Service **Environment Variables** and add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CORS_ALLOWED_ORIGINS` (Set this to your Vercel URL once you deploy the frontend, e.g., `https://taprent-ui.vercel.app`)

*Note: The database and Redis instances are automatically linked to your Web Service via environment variables by the blueprint!*

## 2. Frontend (Vercel)
We added `vercel.json` to handle React client-side routing natively.

1. Go to **Vercel** and create a **New Project**.
2. Connect your GitHub repository.
3. In the project setup:
   - **Framework Preset**: Create React App (or Vercel will auto-detect it).
   - **Root Directory**: Select `frontend/`.
4. Add your Environment Variables:
   - `REACT_APP_API_URL` (Set this to your Render URL, e.g., `https://taprent-backend.onrender.com/api`)
   - `REACT_APP_WS_URL` (Set this to your Render WebSocket URL, e.g., `wss://taprent-backend.onrender.com/ws`)
   - `REACT_APP_CLERK_PUBLISHABLE_KEY`
   - `REACT_APP_STRIPE_PUBLIC_KEY`
   - etc.
5. Click **Deploy**.

## Additional Notes
- The Django `settings.py` is configured to auto-detect the provided `DATABASE_URL` and initialize PostgreSQL bindings seamlessly.
- `whitenoise` has been added to serve your Django static files natively in production via `gunicorn`/`daphne` without needing external CDNs.
