# 🚀 Vercel & Production Deployment Guide

This guide covers deploying **Dr. Alhassan Osman's Academic Portfolio & Examination Portal** with complete environment variable configuration.

---

## 📌 Architecture Overview

| Component | Recommended Host | Why? |
| :--- | :--- | :--- |
| **Frontend (React + Vite)** | **Vercel** | Ultra-fast Global Edge CDN, automated SSL, custom domain, zero-config SPA routing. |
| **Backend (Node.js + Express + SQLite)** | **Render / Railway** | Persistent filesystem for SQLite (`alhassan.db`) and uploaded Past Question PDFs (`server/uploads/`). |

> ⚠️ **Important note on Vercel for Node/SQLite:**
> Vercel's serverless functions run on ephemeral containers with a **read-only** filesystem. Any file written to disk (e.g. SQLite database edits or uploaded PDFs) will not persist between requests on Vercel. Hosting the backend on **Render.com** (Free) or **Railway** gives you a full persistent Node.js environment where SQLite and uploaded PDFs work 100% permanently.

---

## 🛠️ Step 1: Deploy Backend to Render (5 Minutes, Free)

1. Go to [https://render.com](https://render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `hamdansalifupolibu/Dr.Alhassan-s-Portfolio-Website`.
3. Fill in the settings:
   - **Name**: `dr-alhassan-api`
   - **Root Directory**: leave blank (or `server`)
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `node server/index.js`
4. Add the **Environment Variables** in Render:

| Variable Key | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Server listening port |
| `JWT_SECRET` | *(Random 32+ character string, e.g. `alhassan_super_secret_jwt_key_2026_xyz`)* | Signs Admin authentication tokens |
| `PAYSTACK_SECRET_KEY` | `your_paystack_secret_key_here` | Live Paystack Secret Key (for server payment verification) |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2` | Live Paystack Public Key |
| `CLIENT_URL` | `https://your-app.vercel.app` *(update once Vercel is created)* | Allowed CORS origin for frontend |

5. Click **Deploy Web Service**. Once deployed, copy your backend URL (e.g., `https://dr-alhassan-api.onrender.com`).

---

## ⚡ Step 2: Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import `Dr.Alhassan-s-Portfolio-Website`.
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` *(or leave as `./` — our `vercel.json` supports both!)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-render-backend-url.onrender.com/api` | Points frontend to your live backend API |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2` | Paystack popup payment trigger |

5. Click **Deploy**.
6. Once Vercel finishes building, you will receive your live URL: `https://dr-alhassan-portfolio.vercel.app`.
7. Go back to your Render dashboard and set `CLIENT_URL` to your Vercel URL!

---

## 🔒 Complete Environment Variables Cheatsheet

### Vercel (Frontend Client)
```env
VITE_API_URL=https://<your-backend-service>.onrender.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2
```

### Render / Railway (Backend Server)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=super_strong_secret_key_dr_alhassan_2026
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2
CLIENT_URL=https://<your-project>.vercel.app
```

---

## ✅ Post-Deployment Verification Checklist

1. **SPA Routing**: Navigate to `/videos`, `/portfolio`, `/past-questions`, `/admin` and refresh the page. The `vercel.json` rewrites ensure you never get a 404 error.
2. **Videos**: Check that all 85 YouTube videos load and are filterable and playable.
3. **Past Questions**: Test UMaT student ID verification and Paystack checkout popup.
4. **Admin Dashboard**: Log in at `/admin/login` using username `Alhassan` and verify analytics and settings.
