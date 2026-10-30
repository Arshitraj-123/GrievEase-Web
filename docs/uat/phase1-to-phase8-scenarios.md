# GrievEase Phase 1-8 Comprehensive UAT Scenarios

## Scenario Pack Index
- [SC-01] Tenant Provisioning, Member Import & Credential Slip Activation
- [SC-02] Anonymous Grievance Filing, SLA Countdown & Resolver Flow
- [SC-03] Real-Time Emergency SOS Trigger & Guard Gate Alert
- [SC-04] Visitor Pass Generation, QR Verification & Vendor Gate Pass
- [SC-05] Amenity Exclusive Booking GiST Lock & Cash Hold Expiry
- [SC-06] Cash Maintenance Billing, Double-Entry Ledger & Maker-Checker Waiver
- [SC-07] Vendor Work Order Lifecycle: Accept, Before/After Photos & Resident Rating
- [SC-08] Self-Hosted CMS: Multilingual FAQs & Moderated Testimonials (≥3 threshold)
- [SC-09] DPDP Act 2023: "Download My Data" & Account Anonymisation Preserving Hash Chains
- [SC-10] Operations: Encrypted Nightly Backup & Cryptographic Audit Verification

---

### [SC-01] Tenant Provisioning, Member Import & Credential Slip Activation
- **Phase**: 1 & 2
- **Preconditions**: Fresh database installation, Super Admin initialized.
- **Steps**:
  1. Super Admin logs in at `/login` with username and TOTP.
  2. Navigates to `/admin/users/import`, uploads `sample-flats.csv` (10 flats, 15 residents).
  3. Previews record counts and executes step-up authentication. Commits import.
  4. Navigates to `/admin/credential-slips`, generates activation slips for Wing A.
  5. Takes Resident 101 slip (code `7K9X2M4B`). Opens private browser at `/activate`.
  6. Submits username, activation code, and Flat Number `A-101`. Sets password (12 chars).
- **Expected Outcome**:
  - Account transitions from `INVITED` to `ACTIVE`.
  - User can log in without activation slip.
  - Verification code is permanently invalidated.
  - An entry is appended to `audit_log` with actor, IP, and SHA-256 hash.

---

### [SC-02] Anonymous Grievance Filing & Whistleblower Confidentiality
- **Phase**: 3
- **Preconditions**: Resident 101 logged in.
- **Steps**:
  1. Resident navigates to `/app/grievances/new`.
  2. Selects Category `Corrupt Practice / Financial Irregularity`, Priority `HIGH`.
  3. Checks **File Anonymously** checkbox.
  4. Types description: "Suspicious cash handling in society store room."
  5. Uploads photo taken with phone camera. Submits grievance.
  6. Saves tracking code `GR-2026-0042`.
  7. Secretary logs into `/admin/grievances` and inspects ticket `GR-2026-0042`.
- **Expected Outcome**:
  - Complainant name and phone are NULL. Flat number is NULL.
  - Resident avatar shows anonymous mask badge.
  - Image EXIF metadata is stripped.
  - Canary test verifies `resident_id` does not appear in database row or audit log diff.

---

### [SC-03] Real-Time Emergency SOS Trigger & Guard Console Siren
- **Phase**: 5
- **Preconditions**: Guard terminal open at `/guard` on device 1. Resident 101 logged in on device 2.
- **Steps**:
  1. Resident taps red **SOS** button in top navigation. Holds for 3 seconds.
  2. Selects Emergency Type: `MEDICAL`.
- **Expected Outcome**:
  - Guard terminal instantly triggers audible alert and displays full-screen red alert: "SOS MEDICAL: Flat A-101".
  - Alert time is logged to `sos_alert` with status `ACTIVE`.
  - Guard taps **Acknowledge Alert**; sound silences, alert status changes to `ACKNOWLEDGED`.
  - Guard inspects flat and taps **Mark Resolved**.

---

### [SC-04] Visitor Pass & Auto-Generated Vendor Gate Pass
- **Phase**: 5 & 8
- **Preconditions**: Resident 101 and Contractor Apex Plumbing active.
- **Steps**:
  1. Resident navigates to `/app/visitors/new`. Creates pass for "Delivery Boy Rohan".
  2. System generates pass token `VP-ROHN-2026`.
  3. Guard at `/guard` scans token: displays green checkmark, flat A-101.
  4. Guard taps **Admit**. Check-in timestamp saved.
  5. Secretary assigns Vendor Apex Plumbing to grievance #12. Vendor schedules visit for 3:00 PM.
- **Expected Outcome**:
  - System automatically creates Visitor Pass `type: VENDOR` valid for the visit window.
  - Guard console recognises Apex Plumbing contractor pass without resident manual invite.

---

### [SC-05] Amenity Exclusive Booking GiST Lock
- **Phase**: 7
- **Preconditions**: Clubhouse configured with `mode: EXCLUSIVE`.
- **Steps**:
  1. Resident 101 books Clubhouse on Saturday 18:00 - 20:00. Booking enters `AWAITING_PAYMENT` with 24h hold.
  2. Resident 102 concurrently attempts to book Clubhouse on Saturday 19:00 - 21:00.
- **Expected Outcome**:
  - Resident 102's booking is REJECTED by PostgreSQL GiST exclusion constraint (`during WITH &&`).
  - Resident 102 sees clear message: "Slot already reserved by another member".
  - If Resident 101 fails to pay cash within 24 hours, BullMQ worker cancels booking and slot frees up.

---

### [SC-06] Cash Maintenance Billing, Double-Entry Ledger & Maker-Checker Waiver
- **Phase**: 7
- **Preconditions**: Secretary and Chairman logged in.
- **Steps**:
  1. Secretary navigates to `/admin/billing/collect`, searches Flat A-101.
  2. Records cash collection of ₹4,500.00. System prints official cash receipt.
  3. Secretary navigates to `/admin/billing/waivers/new`, creates ₹500 late fee waiver for Flat A-101.
  4. Secretary attempts to approve the waiver.
- **Expected Outcome**:
  - Self-approval FAILS with error: "Maker cannot act as checker".
  - Chairman logs in, inspects waiver at `/admin/billing/waivers`, reviews Secretary justification, and approves.
  - Ledger posts contra entry `WAIVER_APPLIED`. Amounts recorded strictly in integer paise (`50000 paise`).

---

### [SC-07] Vendor Work Order Lifecycle: Before/After Photos & Resident Sign-off
- **Phase**: 8
- **Preconditions**: Vendor `Apex Plumbing` assigned to task `TSK-108`.
- **Steps**:
  1. Contractor logs into `/vendor`. Sees `TSK-108` under **New**.
  2. Clicks **Accept**. Schedules visit for today 4:00 PM.
  3. Clicks **Start Job**. Uploads BEFORE photo.
  4. Contractor attempts to click **Mark Completed** without an after photo.
- **Expected Outcome**:
  - System blocks completion: "Mandatory AFTER photo required".
  - Contractor uploads AFTER photo, writes note: "Fitted new brass tap", clicks **Mark Completed**.
  - Resident 101 opens grievance, sees vendor completed banner.
  - Resident clicks **"Fixed"** and gives 5 stars. Task status becomes `RESIDENT_CONFIRMED`.

---

### [SC-08] Self-Hosted CMS & Testimonials Reel (≥3 Threshold Rule)
- **Phase**: 8
- **Preconditions**: Society has 2 approved testimonials.
- **Steps**:
  1. Anonymous visitor navigates to `/testimonials` on public website.
  2. Observes notice: "Community reviews reel unlocking soon (2/3 reviews approved)". Testimonial reel is hidden.
  3. Resident 101 submits 3rd review with statutory consent checkbox checked.
  4. Committee member logs into `/admin/cms`, approves 3rd review.
  5. Refresh `/testimonials`.
- **Expected Outcome**:
  - Testimonials reel unlocks with verified resident badges.
  - Flat numbers are masked per privacy policy.

---

### [SC-09] DPDP Act 2023: "Download My Data" & Account Anonymisation
- **Phase**: 8
- **Preconditions**: Resident 101 logged in.
- **Steps**:
  1. Resident navigates to `/app/settings/privacy`.
  2. Clicks **Download My Data**.
  3. Inspects exported `grievease-data-export.json`.
  4. Navigates to `/data-deletion`. Submits account deletion request.
  5. Secretary conducts in-person verification at office and verifies request.
  6. Super Admin approves deletion.
- **Expected Outcome**:
  - Resident name becomes `Anonymised Resident [id]`, phone becomes NULL, email becomes NULL.
  - Status becomes `ANONYMISED`.
  - Past maintenance receipts and ledger records retain historical UUID and balance integrity.
  - Cryptographic `audit_log` hash chain remains completely valid.

---

### [SC-10] Operations: Encrypted Nightly Backup & Cryptographic Audit Verification
- **Phase**: 8
- **Preconditions**: Production terminal access.
- **Steps**:
  1. Run `pnpm backup:verify`.
  2. Inspect generated archive `backup-verify.enc`.
  3. Run `pnpm audit:verify`.
- **Expected Outcome**:
  - Backup archive verified with AES-256-GCM authentication tag and SHA-256 checksum.
  - Audit verification iterates from sequence #1 to latest block, confirming zero hash breaks.

