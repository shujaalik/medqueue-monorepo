# MedQueue 🚀 (Real-Time Medical Queue & AI-Triage System)

MedQueue is a premium, enterprise-grade **Real-Time Queue & Clinic Management Monorepo** developed for healthcare providers. Built for university Final Year Project (FYP) evaluation, it solves the challenge of dynamic outpatient waiting room management, AI-driven emergency triage classification, and real-time patient notifications.

---

## 🌟 Key Features

### 1. 🤖 AI-Driven Emergency Triage & Prioritization
*   **Gemini AI Integration:** Analyzes patient-reported symptoms on registration and determines emergency priority along with a severity score (1–10).
*   **Instant Queue Re-ordering:** Pushes high-severity emergency patients (`ASAP` wait times) directly to the top of the waiting list.
*   **Automatic Delay Alerts:** Recalculates everyone else's expected turn time (ETAs) instantly and dispatches shift notifications to subsequent patients.
*   **Urgency Badges:** Generates dynamic UI color gradients (Amber, Orange, Crimson) corresponding to the AI's triage score.

### 2. ⏰ Dynamic Consultation Overtime & Break Monitor
*   **Real-Time ETA Engine:** Runs a server background monitor every 30 seconds.
*   **Overtime Shift:** If a consultation runs over the clinic's average duration, patient ETAs shift forward dynamically.
*   **Doctor break & Idle recovery:** Adapts turn estimations instantly if a doctor takes a break or sits idle, keeping the waiting room synced.

### 3. 📣 Unified Multi-Channel Notifications (WhatsApp & SMS)
*   **WhatsApp Web Automation:** Full integration using `whatsapp-web.js` (Puppeteer) to push alerts from the server logs.
*   **SendPK SMS Gateway:** Native fallback channel using Pakistani SMS Gateway API, auto-formatting numbers to international standards (`923xxxxxxxxx`).
*   **Contextual Alerts:** Dispatches alerts on registration, emergency triage shifts, 3rd-in-line prompts, delay alerts, and digital consultation reports.

### 4. 🖥️ Dedicated Portals & Live Displays
*   **Lobby Display:** Noise-free TV display with real-time Firebase RTDB listeners.
*   **Doctor Portal:** Single-click queue progression, real-time elapsed consultation timer, and AI medical scribe panel.
*   **Receptionist Portal:** Walk-in registrations, quick-add emergency toggles, and status/hold management.
*   **Patient Status Page:** Read-only mobile status tracking page linked via QR code or SMS.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18 (Vite), Tailwind CSS, Recharts (Admin analytics), Lucide Icons, jsPDF.
*   **Backend:** Node.js, Express.js.
*   **Databases:**
    *   **MongoDB (Mongoose):** Persistent user metadata, clinic settings, and patient consultation history.
    *   **Firebase Realtime Database (RTDB):** Real-time synchronization of active queues.
*   **APIs:**
    *   Google Gemini API (`gemini-flash-lite-latest`)
    *   SendPK SMS Gateway
    *   WhatsApp Web API (Puppeteer browser instance)

---

## ⚙️ Local Development Setup

### 1. Install Dependencies
Run the installation command in the monorepo root:
```bash
npm run install-all
```

### 2. Configure Local Environments
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/medqueue
JWT_SECRET=your_super_secret_jwt_key
FIREBASE_PROJECT_ID=medqueue-xxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@medqueue-xxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://medqueue-xxxx-default-rtdb.firebaseio.com/
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
SENDPK_API_KEY=your-sendpk-api-key
SENDPK_SENDER=SenderID
```

Create a `.env` file in the `frontend/` folder:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=medqueue-xxxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://medqueue-xxxx-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=medqueue-xxxx
VITE_FIREBASE_STORAGE_BUCKET=medqueue-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
VITE_FIREBASE_APP_ID=xxxx
```

### 3. Run Locally
Execute the dev server command in the root folder:
```bash
npm run dev
```
*   **Frontend URL:** `http://localhost:5173` (or local IP for mobile QR scanning)
*   **Backend API URL:** `http://localhost:5000`

---

## 🚢 Production Deployment

The project is pre-configured to build automatically for production environments:

### Frontend (Vercel)
1. Deploy the `frontend/` folder as a Vite preset project.
2. Add the environment variable:
   *   **Key:** `VITE_API_URL`
   *   **Value:** `https://medqueue-be.shujaalik.com`

### Backend (GCP Compute Engine VM + Docker + Caddy)
The backend includes a pre-configured multi-container Docker compose stack:
1. Point your domain `medqueue-be.shujaalik.com` (`A` DNS record) to your GCP VM external IP.
2. Allow incoming HTTP (port `80`) and HTTPS (port `443`) in your GCP firewall.
3. Clone the repository on the VM, configure `backend/.env`, and run:
   ```bash
   cd backend
   docker compose up -d --build
   ```
4. Caddy Server automatically issues and renews your SSL certificate for `https://medqueue-be.shujaalik.com` instantly.
5. Link your phone to the WhatsApp Web Client by scanning the ASCII QR code in the logs:
   ```bash
   docker logs -f medqueue-backend
   ```
