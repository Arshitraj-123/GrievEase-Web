# GrievEase Data Retention & Disposal Schedule (DPDP Act 2023 Compliant)

## 1. Regulatory Context

Under Section 8(7) of India's **Digital Personal Data Protection (DPDP) Act 2023**, a Data Fiduciary must erase personal data upon the Data Principal withdrawing consent or as soon as it is reasonable to assume that the specified purpose is no longer being served, unless retention is necessary for compliance with any law.

For Cooperative Housing Societies (CHS) in India, statutory retention is governed by:
- The applicable State Cooperative Societies Act (e.g. Maharashtra Cooperative Societies Act 1960 / Bye-Laws)
- The Income Tax Act, 1961 (Section 44AA: minimum 6-8 financial years for books of accounts)
- The Indian Limitation Act, 1963 (3-year period for contract and recovery disputes)

---

## 2. Retention Matrix by Data Classification

| Data Category | Specific Entity / Table | Mandatory Retention Period | Legal / Operational Justification | Disposal / Anonymisation Action |
| :--- | :--- | :--- | :--- | :--- |
| **Member & Tenant Identity** | `app_user`, `society_member`, `flat_occupant` | Active tenancy + 3 years after vacating | Society register of members (Form I/J); recovery of exit dues. | Cryptographic pseudonymisation: PII masked, account marked `ANONYMISED`. |
| **Financial Ledger & Receipts** | `society_ledger`, `billing_invoice`, `billing_receipt`, `bill_waiver` | **8 Financial Years** (from end of relevant FY) | Section 44AA Income Tax Act & Cooperative Society statutory audit. | **NEVER hard-deleted**. Append-only ledger preserved; after 8 years archived to cold encrypted storage. |
| **Cryptographic Audit Trail** | `audit_log`, `sensitive_access_log` | **Permanent / Lifetime of Society** | Evidentiary integrity of SHA-256 hash chain; defense against administrative fraud claims. | Immutable. Cannot be deleted or truncated without breaking chain verification. |
| **Grievance Records & Evidence** | `grievance`, `grievance_event`, `grievance_photo` | **3 Years** following resolution or closure | Indian Limitation Act dispute window; society committee governance records. | Photos purged from MinIO; grievance text retained with anonymised complainant hash. |
| **Gate Visitor Logs & Passes** | `visitor_pass`, `visitor_log` | **90 Days** (rolling) | Physical perimeter security and incident investigation; minimizes unnecessary PII storage. | Automated BullMQ cron worker purges visitor logs older than 90 days. |
| **Amenity Bookings & Passes** | `amenity_booking`, `booking_event` | **1 Year** following booking completion | Financial reconciliation of deposits and slot audits. | Historical bookings preserved without attendee/guest names; financial refs kept in ledger. |
| **Vendor Tasks & Inspection Photos** | `vendor_task`, `vendor_task_photo` | **2 Years** following job completion | Workmanship warranty tracking and contractor dispute resolution. | MinIO task photos pruned after 2 years; task summary retained in vendor scorecard history. |
| **Public Contact Inquiries** | `contact_request` | **180 Days** post resolution | Inquiry follow-up; spam review. | Purged automatically by background job. |
| **Resident Office Chat & Tickets** | `conversation`, `conversation_message`, `support_ticket` | **1 Year** post resolution | Communication history between flat and management office. | Messages older than 1 year purged; ticket metadata archived. |
| **System Operations & Backups** | `backup_log`, `job_run_log` | **1 Year** for job logs; **7 Years** for annual backup snapshots | Infrastructure compliance and operational observability. | Nightly rolling prune for logs; encrypted snapshots preserved per schedule. |

---

## 3. Cryptographic Pseudonymisation Mechanics

When a resident submits a valid DPDP deletion request via `/data-deletion` or `/app/settings/privacy`, GrievEase executes **Pseudonymisation without Ledger Breakage**:

```sql
UPDATE app_user 
SET 
  full_name = 'Anonymised Resident ' || SUBSTRING(id::text, 1, 8),
  username = 'anon_' || SUBSTRING(MD5(username || random()::text), 1, 12),
  email = NULL,
  phone_encrypted = NULL,
  password_hash = 'ANONYMISED_DPDP_' || NOW()::text,
  status = 'ANONYMISED',
  updated_at = NOW()
WHERE id = $1;
```

### Key Guarantees:
1. **Ledger Consistency**: All previous receipts, ledger entries, and voucher numbers point to the unchanging UUID primary key.
2. **Audit Log Invariance**: The historical `audit_log` records are mathematically immutable (the SHA-256 hash chain is undisturbed).
3. **Zero PII Exposure**: Name, email, mobile phone, and credentials are completely erased from operational queries.

