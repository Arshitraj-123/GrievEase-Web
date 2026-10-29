# 🏢 GrievEase Web Monorepo

> **Enterprise-Grade, Zero-Third-Party Residential Society Grievance & Facility Governance Platform**  
> *Built with Next.js 15 App Router, NestJS, PostgreSQL (Drizzle ORM), Redis, Socket.io, and MinIO.*

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=flat&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F?style=flat)](https://orm.drizzle.team/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange?style=flat&logo=pnpm)](https://pnpm.io/)
[![Zero Third-Party](https://img.shields.io/badge/Architecture-Zero--Third--Party-success?style=flat)](#strict-zero-third-party-architecture)
[![i18n](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20MR-blue?style=flat)](#multilingual-i18n)

---

## 🌟 Executive Overview

**GrievEase** is a comprehensive, production-grade society governance and grievance lifecycle platform engineered for residential cooperative housing societies, gated communities, and residential complexes.

Designed from the ground up to operate under **Zero-Third-Party and Air-Gapped readiness**, GrievEase eliminates all external runtime dependencies—no external CDNs, cloud CAPTCHAs, external font servers, SMS gateways, or proprietary SaaS vendors. Every cryptographic challenge, QR pass generation, sound synthesis, and real-time event pipeline executes entirely on your self-hosted infrastructure.

---

## 🏛️ Core Architecture Pillars

### 1. Strict Zero-Third-Party & Air-Gapped Posture
- **Zero Cloud Leakage**: No Google Fonts, unpkg, cdnjs, external analytics, SMS providers, or email cloud APIs.
- **Client-Side QR Code Processing**: QR generation uses bundled pure JavaScript libraries; QR scanning utilizes native `BarcodeDetector` API with automatic pure-JS `jsQR` fallback.
- **Self-Synthesized Web Audio Sirens**: Emergency sirens utilize the Web Audio API (`OscillatorNode` + `GainNode`) rather than external MP3 assets.
- **Self-Hosted Storage**: Private document and media attachments persist in local S3-compatible MinIO instances with presigned URLs.

### 2. High-Assurance Cryptographic Security
- **Argon2id Hashing**: Industry-standard memory-hard hashing (`64 MB` RAM, `timeCost: 3`, `parallelism: 2`) with offline password blacklist enforcement and dummy hash execution on user-not-found to eliminate timing attacks.
- **Proof-of-Work (PoW) Rate Defense**: Client-side SHA-256 Web Worker challenge after consecutive failures prevents credential stuffing without external CAPTCHA providers.
- **Admin Multi-Factor Authentication (TOTP)**: Mandatory RFC 6238 TOTP for all governance tiers with Argon2id-hashed emergency backup codes.
- **Session Family Rotation**: Ephemeral 15-minute JWT access tokens paired with `httpOnly`, `SameSite=Lax`, `__Host-` refresh cookies. Reuse detection triggers immediate family-wide session termination.
- **Elevated Step-Up Claims**: Sensitive operations (Super Admin transfer, spreadsheet bulk import, credential slip generation) demand recent re-authentication.

### 3. Tamper-Evident Hash-Chained Audit Logs
- Every administrative action, grievance state transition, and security override is written to an immutable, append-only PostgreSQL ledger.
- Each log entry is cryptographically linked to the preceding entry using SHA-256 (`previous_hash` + payload = `current_hash`), enabling cryptographic proof of non-repudiation.

### 4. Multilingual by Default (i18n)
- Native trilingual localization across all resident, guard, and admin portals:
  - 🇬🇧 **English (EN)**
  - 🇮🇳 **Hindi / हिन्दी (HI)**
  - 🇮🇳 **Marathi / मराठी (MR)**
- Verified with automated CI token key parity checkers (`scripts/check-i18n.js`).

---

## 📦 Monorepo Workspace Structure

```
Grievase Web/
├── apps/
│   ├── web/                     # Next.js 15 App Router Frontend
│   │   ├── src/app/             # 100% Pure Next.js 15 App Router Routes
│   │   │   ├── (auth)/          # Login, 2FA TOTP, Onboarding, Password Recovery
│   │   │   ├── admin/           # Administrative Governance, Grievances, Staff, Guards, SOS
│   │   │   ├── app/             # Resident Portal (Grievances, Notices, Polls, Visitors, SOS)
│   │   │   ├── guard/           # 56px Touch-Optimized Security Guard Console
│   │   │   ├── society/         # Public Society Transparency & Telemetry Pages
│   │   │   └── global-error.tsx # Native Root Layout Error Boundary
│   │   ├── src/components/      # Accessible Charting, Audio Siren, Pass QR Scanners
│   │   ├── src/lib/             # Socket.io Client, Offline Queue Sync, Web Crypto
│   │   └── public/              # Bundled Icons, Manifest, Translations (EN/HI/MR)
│   │
│   └── api/                     # NestJS 11 Core Backend API
│       ├── src/modules/
│       │   ├── auth/            # Argon2id, PoW Nonce Defense, JWT, TOTP MFA
│       │   ├── audit/           # Cryptographic Hash-Chained Audit Ledger
│       │   ├── grievances/      # SLA Auto-Escalation Engine & State Machine
│       │   ├── analytics/       # Aggregation Pipeline & Public Transparency
│       │   ├── notices/         # Society Noticeboard & Reader Receipts
│       │   ├── polls/           # Tamper-Resistant Resident Voting
│       │   ├── staff/           # HMAC-SHA256 Domestic Staff Passes & Attendance
│       │   ├── visitors/        # Pre-Approved Visitor Passes & Delivery Lockers
│       │   ├── guards/          # Security Guard Shift Management & Incident Logs
│       │   └── sos/             # Real-Time WebSocket Emergency Incident Desk
│       ├── src/database/        # PostgreSQL Schema & Drizzle ORM Migrations
│       └── src/gateway/         # Socket.io Real-Time Alert Broadcast Gateway
│
├── packages/
│   ├── contracts/               # Shared TypeScript DTOs, Enums, and Zod Schemas
│   └── ui/                      # Shared Accessible Design System (Tailwind CSS)
│
├── scripts/                     # CI Validation, i18n Key Checkers, Bundle Size Scanners
├── docs/                        # Security Model (SECURITY.md), ADRs, Metrics
└── docker-compose.yml           # PostgreSQL 16, Redis 7, MinIO Container Stack
```

---

## 🚀 Key Feature Matrix

| Module | Features & Capabilities |
| :--- | :--- |
| **Authentication & IAM** | Argon2id passwords, client-side Web Worker PoW challenge, TOTP MFA, step-up authentication, secure session family rotation. |
| **Grievance Lifecycle** | Multi-tier auto-escalation engine, configurable SLA timers, category-based routing, resident resolution sign-off. |
| **Public Transparency** | Public `/society/[slug]/transparency` dashboard, anonymized resolution ratios, SLA breach reports, exportable CSV/PDF summaries. |
| **Community Board & Polls** | Urgent broadcast notices, per-user read receipts, tamper-resistant weighted apartment ballots with live tallying. |
| **Domestic Staff Passes** | Maid/driver/cook directory, signed HMAC-SHA256 offline QR passes, append-only gate entry/exit logging. |
| **Visitor & Delivery Desk** | Resident pre-approved 6-digit visitor passes, delivery leave-at-gate locker logging, live gate arrival push alerts. |
| **Guard Gate Console** | High-contrast 56px touch target UI, offline-first IndexedDB queue sync, BarcodeDetector pass scanner, incident logs. |
| **Emergency SOS Desk** | Immediate Web Audio siren synthesizer, live WebSocket guard/admin incident desk, audit trail with safety honesty disclaimers. |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15.5](https://nextjs.org/) (App Router, Server & Client Components) |
| **Frontend Language** | [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & Icons** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Backend Framework** | [NestJS 11](https://nestjs.com/) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) |
| **Caching & Pub/Sub** | [Redis 7](https://redis.io/) |
| **Real-Time Gateway** | [Socket.io](https://socket.io/) (Bi-directional WebSocket communications) |
| **Object Storage** | [MinIO](https://min.io/) (Self-hosted S3-compatible storage) |
| **Package Manager** | [pnpm](https://pnpm.io/) Monorepo Workspaces |

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `v9.x` (`npm install -g pnpm`)
- **Docker & Docker Compose**: For local PostgreSQL, Redis, and MinIO

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/Arshitraj-123/GrievEase-Web.git
cd GrievEase-Web
pnpm install
```

### 3. Start Infrastructure Services
```bash
docker compose up -d
```
*This launches:*
- PostgreSQL on port `5432`
- Redis on port `6379`
- MinIO Object Storage on port `9000` (Console on `9001`)

### 4. Configure Environment Variables
Copy example environment templates:
```bash
# Backend API
cp apps/api/.env.example apps/api/.env

# Web Frontend
cp apps/web/.env.example apps/web/.env
```

### 5. Run Database Migrations & Seeds
```bash
# Push database schemas
pnpm db:migrate

# Seed demo society, admin, and initial data
pnpm db:seed
```

### 6. Start Development Servers
```bash
# Run both Web & API simultaneously
pnpm dev

# Or run services individually:
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:4000
```

---

## 🧪 Testing & Quality Assurance

```bash
# 1. Type-checking across all monorepo workspaces
pnpm type-check

# 2. Internationalization translation key parity test
pnpm lint:i18n

# 3. Unit and integration test suites
pnpm test:unit
pnpm test:integration

# 4. Production build verification
pnpm build
```

---

## 🛡️ Safety & Honesty Transparency Notice

> [!IMPORTANT]  
> **Physical Response Disclaimer**: GrievEase provides high-availability in-app communications, WebSocket dispatch alerts, and offline-ready guard consoles. The software **does not and cannot physically dispatch armed emergency first-responders, municipal police, or medical ambulances**. Society administrators and security personnel remain the responsible physical stewards.

---

## 📜 License & Governance

Distributed under the **MIT License**. See `LICENSE` for further details.  
Maintained with ❤️ by **[Arshit Raj](https://github.com/Arshitraj-123)**.
