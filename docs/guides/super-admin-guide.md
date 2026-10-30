# GrievEase Super Administrator Manual

## 1. System Role & Governance

The **Super Administrator** holds global governance authority over the GrievEase tenant installation. By architectural design, exactly ONE active Super Admin can exist in the system at any time.

Key Responsibilities:
- Managing tenant society settings and operational parameters.
- Bulk onboarding members and flats via spreadsheet imports.
- Generating and printing physical, one-time credential slips.
- Executing Super Admin transfer and break-glass procedures.
- Acting as emergency Sole Approver for single-admin societies (under strict audit).
- Monitoring system vitals, backups, and cryptographic audit chains.

---

## 2. Onboarding Members & Credential Slips

### 2.1 Bulk Spreadsheet Import
1. Navigate to `/admin/users/import`.
2. Download the standard CSV template. Ensure flat numbers, member names, and mobile numbers match official society registers.
3. Upload the populated file. The system parses and validates records against format and duplicate constraints.
4. Review preview counts (Flats, Members, Tenants, Guards, Vendors).
5. Click **Commit Import** (requires 5-minute Step-Up authentication).

### 2.2 Issuing Physical Credential Slips
1. Navigate to `/admin/credential-slips`.
2. Select target wing or flat batch.
3. Click **Generate Slips**. The system generates unambiguous 10-character activation codes (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), valid for 7 days.
4. Print confidential slips on the society office printer. Hand slips directly to flat owners/tenants in sealed envelopes.
5. Residents activate at `/activate` by entering username, slip code, and verification detail.

---

## 3. Maintenance Billing & Sole-Approver Protocol

### 3.1 Rate Configuration
1. Navigate to `/admin/billing/settings`.
2. Configure society maintenance rules:
   - Rate per sq ft or fixed flat fee.
   - Sinking fund, repair fund, and parking charges.
   - Grace period (days) and late fee interest percentage.
   - Financial year starting month (default: April).

### 3.2 Single-Admin Sole Approver Action
If the society has only ONE administrator:
1. When generating monthly bills or approving waivers, the system displays the **Sole Approver Warning Banner**.
2. Approving the batch stamps the event with `audit_flag = 'SOLE_APPROVER'`.
3. An automatic notification is broadcast to all Governing Body members.

---

## 4. System Health & Backup Verification

1. Navigate to `/admin/system`.
2. Inspect:
   - **Database Connection Pool**: Active / idle connections.
   - **Redis Cache & BullMQ**: Queue latency and failed job count.
   - **Cryptographic Audit Trail**: Status of SHA-256 hash chains across societies.
   - **Backup Status**: Timestamp and verification status of last encrypted nightly `pg_dump`.
3. Trigger manual backup integrity verification:
   ```bash
   pnpm backup:verify
   ```

---

## 5. Super Admin Transfer & Break-Glass

### Transferring Role:
1. Navigate to `/admin/roles/transfer`.
2. Select an existing Committee or Secretary user.
3. Enter current Super Admin password and TOTP code.
4. Click **Transfer Super Admin Role**. The action is permanently recorded in the hash-chained `audit_log`.

