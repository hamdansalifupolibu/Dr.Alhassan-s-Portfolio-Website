# Dr. Alhassan Osman — Official Academic & Research Portfolio Website

A production-ready, executive university faculty web portal designed for **Dr. Alhassan Osman**, Lecturer in the Department of Electrical & Electronic Engineering at the **University of Mines and Technology (UMaT)**, Tarkwa, Ghana.

The platform provides a dual-theme public showcase (biography, publications, video lectures, appointment bookings, and past questions) and a secure administrative authority portal with analytics and dynamic Paystack access controls.

---

## 🌟 Key Features

1. **Academic Showcase & Research Portfolio**:
   - Comprehensive faculty profile with credentials, degrees, research specializations (Control Systems, Smart Grids, Machine Learning, Energy Storage), and official UMaT directory links.
   - Filterable research publications, awards, and milestones.

2. **Educational Video Library**:
   - 85+ indexed university lectures with fast search, category filtering, and embedded playback.
   - YouTube channel auto-sync and featured video highlights.

3. **Past Questions Examination Portal**:
   - **UMaT Students**: 100% complimentary access via automated institutional email or index number verification (`@st.umat.edu.gh`, 10-digit IDs, department index numbers).
   - **External / Non-UMaT Users**: Instant access unlock secured by **Paystack Ghana Gateway** (MTN Mobile Money, Telecel Cash, Visa/Mastercard).
   - Direct PDF downloads with token authentication.

4. **Executive Admin Authority Portal**:
   - Real-time visitor traffic analytics, device tracking, and Paystack revenue ledger.
   - Live payment fee control center with instant preset fee updates.
   - Management forms with real-time toast feedback for videos, past question uploads, and site biography.
   - Dual light/dark mode support with persistent circular reveal animation.

5. **Production & Mobile Optimized**:
   - 100% responsive across mobile, tablet, and desktop viewports.
   - Unified fullstack architecture: The backend Express server serves both API endpoints and the compiled React client.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Install & Run Unified
```bash
# Install server & client dependencies and build client:
npm run postinstall

# Start the unified server:
npm start
# App running at: http://localhost:5000
```

### 2. Independent Dev Servers (Optional)
```bash
# Terminal 1 - Backend:
cd server
npm start
# Runs at: http://localhost:5000

# Terminal 2 - Frontend:
cd client
npm run dev
# Runs at: http://localhost:5173
```

---

## 🔐 Administrative Credentials

- **Admin Portal**: `/admin/login` (or `/admin` when authenticated)
- **Default Username**: `Alhassan`
- **Default Password**: `Alhassan@123`

*(Credentials can be changed anytime from the **Account & Security** tab in the admin panel).*

---

## 🌐 Production Hosting Guide

The project is structured to deploy smoothly to any modern cloud host:

### Option A: Render / Railway (Recommended Unified Deployment)
1. Link your GitHub repository (`Dr.Alhassan's Portfolio Website`).
2. Set the build command:
   ```bash
   npm run postinstall
   ```
3. Set the start command:
   ```bash
   npm start
   ```
4. Set Environment Variables in your hosting dashboard:
   - `PORT`: `5000` (or host assigned `$PORT`)
   - `JWT_SECRET`: `your-strong-random-secret`
   - `PAYSTACK_SECRET_KEY`: `your_paystack_secret_key_here`
   - `PAYSTACK_PUBLIC_KEY`: `pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2`

### Option B: Separate Frontend (Vercel) & Backend (Render/Railway)
1. **Backend**: Deploy `server/` with `npm start`.
2. **Frontend**: Deploy `client/` to Vercel, and set environment variable:
   - `VITE_API_URL`: `https://your-backend-domain.com/api`
   - `VITE_PAYSTACK_PUBLIC_KEY`: `pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2`

---

## 💳 Payment Gateway Configuration

The system is pre-configured with active Paystack keys. The fee charged to external students is fully dynamic and can be modified at any time in the Admin Dashboard:
- Default Live Fee: `GH₵ 1` (configurable in dashboard to 10, 15, 20, 25, 30, 50, or custom amount).

---

## 📁 Repository Structure

```
├── client/                      # React 19 + Vite 8 + Tailwind CSS v4
│   ├── public/                  # HD Photos, cutout portraits, favicons
│   ├── src/
│   │   ├── components/          # ThemeToggle, Navbar, VideoCard, AdminLayout, etc.
│   │   ├── context/             # ThemeContext, ToastContext, SettingsContext
│   │   ├── pages/               # Home, About, Portfolio, Videos, PastQuestions, Contact
│   │   └── pages/admin/         # Dashboard, ManageVideos, ManagePastQuestions, etc.
├── server/                      # Node.js + Express + SQLite (better-sqlite3)
│   ├── db/                      # alhassan.db (pre-seeded with 85+ lectures & settings)
│   ├── middleware/              # JWT & Student access verification guards
│   ├── routes/                  # Videos, PastQuestions, Access, Portfolio, Settings, Contact
│   ├── uploads/                 # Uploaded Past Question PDFs
│   └── index.js                 # Unified static & API entrypoint
├── package.json                 # Unified build & start scripts
└── README.md
```
