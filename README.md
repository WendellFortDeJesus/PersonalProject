# PatronPoint - Click Here: [NEU School Library](https://personal-project-ruddy-theta.vercel.app/)

PatronPoint is a high-density, mission-critical visitor management system designed for institutional environments like the NEU Central Library. It features an immersive "Cyber-Tech" Head-Up Display (HUD) aesthetic, providing real-time telemetry and secure access protocols.

## 🚀 System Overview

The application is architected into two primary segments:
1.  **Identity Hub (Kiosk Mode)**: A public-facing terminal for student and faculty check-ins using RF-ID or SSO verification.
2.  **Command Center (Admin Portal)**: A secure administrative node for real-time analytics, user registry management, and institutional audit reporting.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: React 19, Tailwind CSS, Shadcn UI
- **Backend/Database**: Firebase Firestore
- **Authentication**: Firebase Authentication (Google SSO, RF-ID Emulation)
- **AI Integration**: Genkit (Ready for intelligent patron assistance)
- **Design Language**: High-fidelity Glassmorphism, Neon HUD components, and Monospaced Telemetry

## 🔑 Administrative Access

Authorized personnel can access the Command Center using the following institutional identity:

- **Identity UID**: `jcesperanza@neu.edu.ph`
- **Access Token**: `12345`

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router (Pages, Layouts)
│   ├── admin/         # Command Center (Dashboard, Users, Reports)
│   ├── kiosk/         # Identity Hub (Auth, Purpose, Register)
│   └── globals.css    # Global "Cyber-Tech" design variables
├── components/        # Shared UI components (Shadcn + HUD specialized)
├── firebase/          # Firebase SDK initialization and custom hooks
├── lib/               # Utility functions and static data mapping
└── ai/                # Genkit AI flows and configuration
```

## ⚙️ Key Features

### 🛡️ Secure Gatekeeper Logic
- **Domain Whitelisting**: Restricts access to identities within the `neu.edu.ph` domain.
- **RF-ID Pattern Enforcer**: Regex-based validation for institutional identity cards.
- **Session Resynchronization**: "End-of-Day Flush" protocol to force-close active terminal sessions.

### 📊 Strategic Intelligence
- **Institutional Pulse**: Real-time dashboard showing visitor intent distribution and occupancy by academic unit.
- **Multivariate Audits**: Comprehensive reporting engine with date-range filters and print-ready archival formats.
- **Identity Registry**: Full CRUD management of student and faculty profiles with instant blocking capabilities.

## 🚦 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Firebase Project Config

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the development node:
   ```bash
   npm run dev
   ```

## 🌐 Deployment
The system is configured for **Firebase App Hosting**, ensuring high availability and seamless scalability for institutional-grade traffic.

---
*Built for the NEU Central Library Institutional Security System Node Alpha-01.*
