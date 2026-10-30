# GrievEase User Acceptance Testing (UAT) Master Plan

## 1. Objective & Scope

This UAT plan validates the complete end-to-end functionality of GrievEase across all 8 development phases:
- **Phase 1 & 2**: Foundation, Multi-Tenant Auth, User Import, Activation Slips, Audit Hash Chain
- **Phase 3**: Grievances Lifecycle, Anonymity Engine, Working-Hours SLAs, Resolver Assignment
- **Phase 4**: Analytics Engine, Performance Scorecards, Real-Time Dashboards, Formula-Safe Exports
- **Phase 5**: Directory, Notices & Polls, Staff Roster, Visitor Passes, Guard Console, SOS
- **Phase 6**: PWA, Mobile Responsiveness (360px), Socket.io, In-App Notifications, i18n (EN/HI/MR)
- **Phase 7**: Amenity Bookings (GiST Exclusion, Capacity Locks), Cash Maintenance Billing & Double-Entry Ledger
- **Phase 8**: Vendor Portal, Self-Hosted CMS, Resident Messaging, Security Hardening, Backup Ops, DPDP Act 2023 Compliance

---

## 2. Testing Environment & Personas

- **Base URL**: `http://localhost:3000` (Web) / `http://localhost:4000/api/v1` (API)
- **Database**: PostgreSQL 16 with RLS enabled
- **Object Storage**: MinIO (local S3)
- **Cache/Queue**: Redis with BullMQ

### Test Personas:
1. `superadmin@uat.local` (Super Admin - MFA enabled)
2. `secretary@uat.local` (Secretary - Cash Collector / Grievance Resolver)
3. `chairman@uat.local` (Chairman - Maker-Checker Approver)
4. `committee@uat.local` (Committee Member - Resolver & Testimonial Moderator)
5. `resident.101@uat.local` (Resident Flat A-101 - Primary User)
6. `resident.102@uat.local` (Resident Flat A-102 - Whistleblower / Neighbor)
7. `guard.gate1@uat.local` (Security Guard - Gate Terminal)
8. `vendor.apex@uat.local` (Plumbing Contractor - Service Partner)

---

## 3. Acceptance Criteria & Pass/Fail Thresholds

| Area | Strict Threshold | Failure Action |
| :--- | :--- | :--- |
| **Zero 3rd-Party Calls** | 0 external outbound runtime HTTP requests | Immediate rejection |
| **Financial Ledger** | 100% append-only; 0 in-place updates; integer paise only | Immediate rejection |
| **Separation of Duties** | Maker can NEVER approve own waiver/void/bill run | Immediate rejection |
| **Amenity Double Booking**| Exactly 1 booking succeeds under 500 concurrent requests | Immediate rejection |
| **Whistleblower Anonymity**| 0 PII leaks in resolver views, audit logs, or canary tests | Immediate rejection |
| **i18n Parity** | 100% key parity across `en.json`, `hi.json`, `mr.json` | Build failure |
| **Mobile UX** | 360px viewport WCAG AA without horizontal scroll | Defect logged |

