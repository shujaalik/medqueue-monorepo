# MedQueue - Real-time Queue Management System

A premium Real-time Queue & Appointment Management System built for healthcare clinics. Developed for a University Final Year Project (FYP).

## 🚀 Features
- **Real-time Synchronization:** Powered by Firebase Realtime Database.
- **Role-based Dashboards:** Dedicated portals for Admins, Doctors, and Receptionists.
- **Smart Queue Engine:** Dynamic wait time estimation and emergency priority handling.
- **Automated Notifications:** WhatsApp/SMS alerts when patients are nearing their turn.
- **Analytics:** Data-driven insights for clinic administrators using Recharts.
- **Live Display:** High-visibility TV display for waiting rooms.

---

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (User Data/History) & Firebase RTDB (Live Queue).
- **Auth:** JWT (12-hour sessions).

---

## ⚙️ Local Setup

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Firebase Project with Realtime Database enabled

### 2. Environment Configuration

Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/medqueue
JWT_SECRET=your_super_secret_jwt_key
FIREBASE_PROJECT_ID=medqueue-xxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://medqueue-xxxx.firebaseio.com
```

Create a `.env` file in the `frontend/` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=medqueue-xxxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://medqueue-xxxx.firebaseio.com
VITE_FIREBASE_PROJECT_ID=medqueue-xxxx
VITE_FIREBASE_STORAGE_BUCKET=medqueue-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
VITE_FIREBASE_APP_ID=xxxx
```

### 3. Installation & Running

**One Command to Start Everything:**
From the root directory, run:
```bash
npm run dev
```
This will start both the backend (Port 5000) and frontend (Port 5173) concurrently.

**Other Useful Commands:**
- `npm run install-all`: Installs dependencies for root, backend, and frontend.
- `npm run seed`: Runs the database seeding script.
- `npm run backend`: Runs only the backend.
- `npm run frontend`: Runs only the frontend.

---

## 👨‍💻 Development
- Developed by Antigravity (Advanced Agentic Coding AI).
- Built for scalability and premium user experience.
