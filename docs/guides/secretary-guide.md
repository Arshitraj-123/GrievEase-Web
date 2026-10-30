# GrievEase Society Secretary Operations Manual

## 1. Overview & Core Functions

The **Society Secretary** oversees daily society operations, communication with residents, maintenance cash collections, vendor task assignments, and statutory compliance.

---

## 2. Cash Maintenance Billing & Collections

Under GrievEase's zero-third-party architecture, **payments are made in cash at the society office and recorded manually**.

### 2.1 Recording a Cash Payment
1. Navigate to `/admin/billing/collect`.
2. Search by Flat Number (e.g., `B-402`) or Member Name.
3. Review total outstanding balance (including bill charges and late fees).
4. Enter amount collected in ₹ (converted to integer paise automatically).
5. Specify receipt notes or payer details (e.g., "Paid by tenant with authorization").
6. Click **Record Cash Receipt & Print**.
7. Hand the printed physical receipt (displaying amount in words and Indian digit grouping `1,23,456.00`) to the resident.
8. The ledger (`society_ledger`) is updated with an immutable credit entry.

### 2.2 Waivers & Credit Notes (Maker Role)
1. To adjust an erroneous charge or grant an approved waiver:
   - Navigate to `/admin/billing/waivers/new`.
   - Enter flat, amount, and detailed justification.
   - Click **Submit for Approval**.
2. **Separation of Duties**: You **cannot** approve your own waiver. The Chairman or Committee checker must log in to authorize it.

---

## 3. Grievances & Vendor Task Assignments

### 3.1 Assigning a Vendor Contractor
1. Navigate to `/admin/grievances` and select an open complaint.
2. In the Action Panel, click **Assign Vendor Contractor**.
3. Select an active contractor from the directory (e.g., plumbing, electrical, lift).
4. Set scheduled visit window and priority.
5. Click **Assign Task**.
6. The contractor receives an in-app alert and has `vendor_accept_hours` (default 24h) to accept.
7. Upon scheduling, an authorized **Visitor Gate Pass** (`type: VENDOR`) is automatically generated for the gate console.

---

## 4. Notices, Polls & Communication

1. **Notices**: Publish official society announcements with EN/HI/MR support via `/admin/notices`.
2. **Polls**: Create democratic votes with secret or open balloting via `/admin/polls`.
3. **Office Chat**: Respond to resident inquiries via `/admin/support` or resident chat desk.

---

## 5. DPDP Privacy Requests

When a resident requests data deletion or account closure:
1. Navigate to `/admin/privacy-requests`.
2. Verify the resident's physical identity in the society office (mandated by bylaws).
3. Record in-person verification note.
4. Mark verified and submit to Committee for dual-authorization.

