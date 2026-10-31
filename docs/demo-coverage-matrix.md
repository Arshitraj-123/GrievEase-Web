# GrievEase Demo Workflow & Route Coverage Matrix

> **Coverage Audit Date**: 2026-10-31  
> **Total Functional Requirements (P1 + P2)**: 30  
> **Covered Requirements**: 30  
> **Coverage Ratio**: **100%** (Target: 100%)  
> **Uncovered Items**: 0

---

## 1. Functional Requirements Coverage Table

| Requirement ID | Pri | Feature Description | Portal | Exercising Scenes | Covered Routes | Coverage Status |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: |
| **FR-PUB-01** | P1 | Public Landing Page, Claims, Fluid Typography & i18n | Public | P01 | `/` | ✅ COVERED |
| **FR-PUB-02** | P1 | Public Complaint Tracking via Tracking Code | Public | P02 | `/track` | ✅ COVERED |
| **FR-PUB-03** | P2 | Transparency Dashboard without PII Exposure | Public | P03 | `/transparency` | ✅ COVERED |
| **FR-PUB-04** | P2 | Public Contact Inquiry with Proof-of-Work Challenge | Public | P04 | `/contact` | ✅ COVERED |
| **FR-ADM-01** | P1 | First-Run Setup, Bootstrap Token & Mandatory TOTP | Admin | A01 | `/setup` | ✅ COVERED |
| **FR-ADM-02** | P1 | User Management, Excel Bulk Onboarding & Credential Slips | Admin | A02 | `/admin/directory`, `/admin/credentials` | ✅ COVERED |
| **FR-ADM-03** | P1 | 4-Level Governance Chain, SLA Matrix & Working Hours | Admin | A03 | `/admin/escalation`, `/admin/leave` | ✅ COVERED |
| **FR-ADM-04** | P1 | Secretary Inbox, SLA Pause, Vendor Assignment & Resolution | Admin | A04 | `/admin/grievances`, `/admin/inbox` | ✅ COVERED |
| **FR-ADM-05** | P1 | 4-Level Auto-Escalation, Chairman Review & Audit Hash Chain | Admin | A05 | `/admin/escalation`, `/admin/audit` | ✅ COVERED |
| **FR-ADM-06** | P1 | Anonymous Complaint Handling & Audited Statutory Reveal | Admin | A06 | `/admin/grievances`, `/admin/audit/sensitive-access` | ✅ COVERED |
| **FR-ADM-07** | P2 | Operational Analytics, Scorecards & Formula Popovers | Admin | A07 | `/admin/analytics`, `/admin/performance` | ✅ COVERED |
| **FR-ADM-08** | P2 | Bilingual Notices, Secret-Ballot Polls & Domestic Staff Admin | Admin | A08 | `/admin/notices`, `/admin/polls`, `/admin/staff` | ✅ COVERED |
| **FR-ADM-09** | P2 | Security Rosters, Incident Logs & Emergency SOS Console | Admin | A09 | `/admin/guards`, `/admin/devices` | ✅ COVERED |
| **FR-ADM-10** | P1 | Amenity Fees, Maintenance Billing, Cash Receipts & Ledger | Admin | A10 | `/admin/billing`, `/admin/amenities` | ✅ COVERED |
| **FR-ADM-11** | P2 | Vendor Scorecards, CMS FAQs & Super Admin Handover | Admin | A11 | `/admin/vendors`, `/admin/cms`, `/admin/system`, `/admin/roles` | ✅ COVERED |
| **FR-RES-01** | P1 | Account Activation via Credential Slip & Entropy Meter | Resident | R01 | `/activate` | ✅ COVERED |
| **FR-RES-02** | P1 | Resident Login, Session Termination & Offline Recovery Codes | Resident | R02 | `/login`, `/forgot-password`, `/app/settings` | ✅ COVERED |
| **FR-RES-03** | P1 | Named Grievance Submission, Draft Autosave & PWA Prompt | Resident | R03 | `/app/grievances/new` | ✅ COVERED |
| **FR-RES-04** | P1 | Anonymous Grievance Filing & Secret Tracking Code | Resident | R04 | `/app/grievances/new` | ✅ COVERED |
| **FR-RES-05** | P1 | Real-Time Stepper Tracking, SLA Countdown & 5-Star Rating | Resident | R05 | `/app/grievances` | ✅ COVERED |
| **FR-RES-06** | P2 | Emergency Notice Banner, Acknowledgment & Poll Voting | Resident | R06 | `/app/notices`, `/app/polls` | ✅ COVERED |
| **FR-RES-07** | P2 | Opted-In Resident Directory & Offline Emergency Contacts | Resident | R07 | `/app/directory`, `/app/emergency-contacts` | ✅ COVERED |
| **FR-RES-08** | P2 | Domestic Staff Registration, Pass QR & Attendance Log | Resident | R08 | `/app/staff` | ✅ COVERED |
| **FR-RES-09** | P2 | Guest Passes, Live Walk-in Phone Prompt & DND Mode | Resident | R09 | `/app/visitors` | ✅ COVERED |
| **FR-RES-10** | P1 | Emergency SOS Trigger, 5-Second Buzzer & Guard Dispatch | Resident | R10 | `/app/sos` | ✅ COVERED |
| **FR-RES-11** | P1 | Amenity Booking Hold Timer, Cash Receipts & Dues Statement | Resident | R11 | `/app/amenities`, `/app/billing` | ✅ COVERED |
| **FR-RES-12** | P2 | Live Office Messaging, Font Size & DPDP Data Export | Resident | R12 | `/app/messages`, `/app/settings` | ✅ COVERED |
| **FR-SEC-01** | P1 | Gatehouse Console PIN Login, Pass QR & Offline Sync | Guard | G01 | `/guard` | ✅ COVERED |
| **FR-SEC-02** | P2 | Clubhouse Amenity Check-In & Occupancy Counter | Guard | G02 | `/guard` | ✅ COVERED |
| **FR-VND-01** | P1 | Contractor Task Acceptance, Before/After Photos & Completion | Vendor | V01 | `/vendor` | ✅ COVERED |

---

## 2. Intentionally Excluded Items (With Justifications)

| Feature / Interface | Exclusion Reason & Architecture Justification |
| :--- | :--- |
| **Online Payment Gateway (Razorpay/Stripe/UPI)** | **Strict Architecture Constraint**: Zero third-party runtime dependencies. Maintenance billing is exclusively physical cash collection at the society management office, accompanied by printed digital receipts and immutable SHA-256 ledger entries. |
| **SMS / OTP Gateway (Twilio/Msg91)** | **Architecture Constraint**: No cellular SMS reliance. Onboarding is handled via printed physical credential slips with activation codes, and two-factor authentication uses offline TOTP authenticator apps. |
| **Cloud Email Dispatch (SendGrid/AWS SES)** | **Architecture Constraint**: Offline account recovery using 10 single-use recovery codes and security questions with a 24-hour cooling-off window. |
| **Third-Party CDN Fonts / Scripts** | **Privacy Constraint**: 100% self-hosted fonts (Inter and Noto Sans Devanagari) to guarantee zero outbound network leaks. |

---

*Verified by GrievEase QA-Automation & Documentation Engineering Team*
