# 🛡️ PatronPoint: Institutional System Documentation
**Project Code**: `Node Alpha-01`  
**Deployment Environment**: `NEU Central Library`  
**System Version**: `1.0.0-Stable`

---

## 📋 1. Executive Summary
PatronPoint is a high-density visitor management system designed for institutional environments. It provides a secure, "Cyber-Tech" HUD interface for real-time identity verification and strategic administrative oversight.

---

## 🛠 2. Technical Architecture
### Core Stack
- **Frontend Framework**: Next.js 15 (App Router Architecture)
- **UI Architecture**: React 19 with Tailwind CSS & Shadcn UI
- **Data Persistence**: Firebase Firestore (Real-time NoSQL)
- **Authentication Node**: Firebase Authentication (SSO & Custom RF-ID Logic)
- **Design System**: "Cyber-Tech" HUD with Neon Glassmorphism

### Critical Path Structure
```text
src/
├── app/               # Next.js App Router (Pages & Layouts)
│   ├── admin/         # Command Center (Restricted Access)
│   ├── kiosk/         # Identity Hub (Public Terminal)
│   └── globals.css    # Global "Cyber-Tech" variables
├── components/        # Shared UI nodes (Shadcn + HUD specialized)
├── firebase/          # SDK initialization & Firestore Hooks
└── lib/               # Utility functions & Academic Unit mapping
```

---

## 🚀 3. Identity Hub (Kiosk Mode)
The Identity Hub is the primary entry point for patrons. It is designed as a standalone terminal with the following verification nodes:

### 3.1 Authentication Protocols
- **RF-ID Node**: Primary verification using institutional identity cards.
- **SSO Node**: Secure Google Sign-In restricted to `@neu.edu.ph` domains.
- **Email Node**: Manual institutional email verification.

### 3.2 Registration Workflow
1. **Identity Tap**: User provides RF-ID or SSO token.
2. **Intent Selection**: User selects purpose (Reading, Research, Computer Use, etc.).
3. **Registry Check**: If the identity is missing, the system redirects to the **Identity Record Node**.
4. **Validation**: Upon success, a "PROTOCOL VALIDATED" HUD displays the user's name and academic unit (College).

---

## 📊 4. Command Center (Admin Portal)
The Command Center provides strategic intelligence and full registry control.

### 4.1 Institutional Pulse (Dashboard)
- **Real-time Telemetry**: Monitoring active visitors, peak hours, and intent distribution.
- **Dynamic Analytics**: Powered by Recharts, visualizing visitor flow by academic unit.

### 4.2 Identity Registry (User Management)
- **Full CRUD**: Manage student and faculty profiles.
- **Access Control**: Instant blocking of identities with log-based reasoning.
- **Linked Purge**: Deleting a profile automatically erases all associated visit logs across the database.

### 4.3 Institutional Audits (Reporting)
- **Multivariate Filtering**: Filter by date range, intent, college, or role.
- **Live Document Preview**: High-fidelity report generation for administrative review.
- **Audit Archival**: Integrated print and PDF export protocols.

---

## 🛡️ 5. Security & Maintenance
### 5.1 Gatekeeper Logic
- **Domain Whitelisting**: Enforces the `neu.edu.ph` domain for all SSO interactions.
- **Master Admin Protocol**: High-priority access for `jcesperanza@neu.edu.ph` with direct bridge to Command Center.
- **Terminal Flush**: Administrative protocol to force-close all active sessions during daily maintenance cycles.

### 5.2 Database Integrity
- **Firestore Security Rules**: Strict path-based validation to ensure institutional data privacy.
- **Registry Purge**: "Nuclear Option" in settings to reset all identity logs for a new academic term.

---

## 🔑 6. Administrative Access
Authorized personnel credentials for Command Center entry:
- **Identity UID**: `jcesperanza@neu.edu.ph`
- **Access Token**: `12345`

---
*Document Generated: 2024-05-22 | PatronPoint Engineering Node*
