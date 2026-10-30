# GrievEase Authorization & Role-Based Access Control (RBAC) Matrix

This document defines the authoritative access control matrix across all roles, routes, and API capabilities in GrievEase.

---

## 1. Role Hierarchy & Descriptions

| Role | Classification | Description & Scope | MFA / Step-Up Required |
| :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Global Tenant Governance | System provisioning, master settings, step-up sole approvals, database audits, and break-glass procedures. Exactly ONE active per system. | **Mandatory MFA + Step-Up** |
| `CHAIRMAN` | Society Executive | Committee leadership, grievance escalations, billing waiver maker-checker approver, annual audit oversight. | **Mandatory MFA** |
| `SECRETARY` | Society Executive | Day-to-day administrative operations, vendor assignments, cash collection, amenity rules, notice publication. | **Mandatory MFA** |
| `COMMITTEE` | Society Management | Managing committee members, grievance resolution, review of testimonials and vendor performance, waiver approvals. | **Mandatory MFA** |
| `GOVERNING_BODY` | Supervisory Oversight | Advisory / regulatory council members with read-only audit visibility across all financial and governance logs. | **Mandatory MFA** |
| `RESIDENT` | End User (Flat Occupant) | Flat member / tenant: file grievances, invite visitors, book amenities, review dues, message office, rate vendors. | Optional (Password + Recovery) |
| `GUARD` | Gate Security Staff | Gate console terminal: scan and verify visitor tokens, log walk-in check-ins, receive real-time SOS alerts. | Password (Locked to Gate Terminal) |
| `VENDOR` | External Contractor | External service partner: accept assigned tasks, schedule visits, upload before/after photos, complete work. | Password (Locked to `/vendor/*`) |
| `PUBLIC` | Unauthenticated | Public marketing pages, activation, login, FAQ reading, approved testimonials reel, public contact inquiry. | None |

---

## 2. Granular Route & Permission Access Matrix

Legend:
- **`CRUD`**: Full Create, Read, Update, Delete (or module equivalent)
- **`CR`**: Create and Read
- **`R`**: Read Only
- **`RO`**: Read Own (restricted to user's flat/account via RLS)
- **`APPR`**: Approve / Authorize (Maker-Checker enforced)
- **`-`**: Strictly Denied / 403 Forbidden

| Route / Capability | Super Admin | Chairman | Secretary | Committee | Governing Body | Resident | Guard | Vendor | Public |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Profile** |
| `POST /auth/login`, `/auth/refresh` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `POST /auth/activate` | - | - | - | - | - | Yes | Yes | Yes | Yes |
| `POST /auth/step-up` | Yes | Yes | Yes | Yes | - | - | - | - | - |
| `GET /app/profile`, `/vendor/profile` | CRUD | CRUD | CRUD | CRUD | CRUD | RO | RO | RO | - |
| **User & Tenant Management** |
| `/admin/users` (Directory & Role Editor) | CRUD | R | CRUD | R | R | - | - | - | - |
| `/admin/import` (Bulk User Onboarding) | CRUD | - | CRUD | - | - | - | - | - | - |
| `/admin/credential-slips` (Print Slips) | CRUD | - | CRUD | - | - | - | - | - | - |
| `/admin/roles` (Super Admin Transfer) | CRUD | - | - | - | - | - | - | - | - |
| **Grievances & Escalation** |
| `/app/grievances` (Submit Grievance) | - | - | - | - | - | CR (Own) | - | - | - |
| `/admin/grievances` (Resolve & Reassign)| R | CRUD | CRUD | CRUD | R | - | - | - | - |
| Anonymous Grievance Submissions | - | - | - | - | - | CR (Anon) | - | - | - |
| Grievance SLA Escalation Queue | R | CRUD | CRUD | R | R | - | - | - | - |
| **Directory, Notices & Polls** |
| `/app/directory` (Resident Directory) | R | R | R | R | R | R (Opted) | - | - | - |
| `/admin/notices` (Publish Notices) | CRUD | CRUD | CRUD | CRUD | R | R | - | - | - |
| `/admin/polls` (Create & Close Polls) | CRUD | CRUD | CRUD | CRUD | R | Vote (Own) | - | - | - |
| **Visitors, Guard Console & SOS** |
| `/app/visitors` (Generate Visitor Pass) | - | - | - | - | - | CR (Own) | - | - | - |
| `/guard` (Guard Check-In Terminal) | - | - | - | - | - | - | CRUD | - | - |
| `/admin/visitors` (Visitor Audit Logs) | R | R | CRUD | R | R | - | - | - | - |
| Emergency SOS Trigger (`POST /sos`) | - | - | - | - | - | CR (Own) | CR | - | - |
| Guard SOS Desk Real-Time Alerts | - | R | R | R | R | - | Monitor | - | - |
| **Amenity Booking** |
| `/app/amenities` (Explore & Book) | - | - | - | - | - | CR (Own) | - | - | - |
| `/admin/amenities` (Configure Rules) | CRUD | CRUD | CRUD | R | R | - | - | - | - |
| `/admin/amenities/checkin` (Pass Check)| R | R | CRUD | R | - | - | Check-in | - | - |
| Amenity Cash Collection & Confirmation | - | - | CRUD | - | - | - | - | - | - |
| **Maintenance Billing & Ledger** |
| `/admin/billing` (Billing Configuration)| CRUD | R | CRUD | R | R | - | - | - | - |
| `/admin/billing/generate` (Run Bills) | CRUD | - | CRUD | - | - | - | - | - | - |
| `/admin/billing/collect` (Cash Receipts)| - | - | CRUD | - | - | - | - | - | - |
| Waiver / Credit Note Creation (Maker) | CRUD | - | CRUD | CRUD | - | - | - | - | - |
| Waiver / Credit Note Approval (Checker) | Sole* | APPR | - | APPR | - | - | - | - | - |
| `/app/billing` (View Own Dues & Ledger)| - | - | - | - | - | RO | - | - | - |
| `/admin/reports/debtors` (Debtor List) | R | R | R | R | R | - | - | - | - |
| **Vendor Management & Tasks** |
| `/admin/vendors` (Vendor Directory) | CRUD | R | CRUD | R | R | - | - | - | - |
| `/admin/vendor-tasks` (Assign Work) | CRUD | CRUD | CRUD | CRUD | R | - | - | - | - |
| `/vendor` (Vendor Job Dashboard) | - | - | - | - | - | - | - | RO (Assigned) | - |
| Vendor Photo Upload & Job Completion | - | - | - | - | - | - | - | CR (Assigned) | - |
| Resident Confirm & Rate Job ("Fixed") | - | - | - | - | - | Update (Own) | - | - | - |
| Vendor Performance Scorecard (<5 rule)| R | R | R | R | R | - | - | - | - |
| **Content, Support & Messaging** |
| `/admin/cms` (Multilingual FAQs) | CRUD | CRUD | CRUD | CRUD | R | R | - | - | Public R |
| Moderation of Testimonials (Approve) | CRUD | CRUD | CRUD | CRUD | R | - | - | - | Public R (≥3) |
| `/contact` & `/admin/contact-requests` | CRUD | R | CRUD | R | R | - | - | - | Public CR |
| Resident-to-Office Chat (`/app/messages`)| - | R | CRUD | R | - | CR (Own) | - | - | - |
| Support Desk (`/admin/support`) | CRUD | R | CRUD | R | R | CR (Own) | - | - | - |
| **Operations, System & Cryptography** |
| `/admin/system` (Health & Telemetry) | CRUD | R | R | R | R | - | - | - | - |
| Backup Verification (`pnpm backup:verify`)| Admin | - | - | - | - | - | - | - | - |
| Audit Trail Verification (`audit:verify`)| Admin | R | R | R | R | - | - | - | - |
| Sensitive Access Logs (`/admin/audit/*`)| R | R | R | R | R | - | - | - | - |
| **DPDP Privacy & Data Requests** |
| `/app/settings/privacy` (Download Data)| - | - | - | - | - | Export (Own)| - | - | - |
| `/data-deletion` (Statutory Deletion) | - | - | - | - | - | CR (Own) | - | - | Public CR |
| `/admin/privacy-requests` (Approve Erasure)| CRUD | APPR | APPR | - | R | - | - | - | - |

\* *Super Admin sole approver activates ONLY when society has fewer than 2 eligible approvers, logging the `SOLE_APPROVER` audit flag and dispatching notices to Governing Body.*

