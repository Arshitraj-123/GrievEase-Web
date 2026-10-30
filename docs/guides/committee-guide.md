# GrievEase Managing Committee User Manual

## 1. Overview & Committee Governance

Managing Committee members serve as the elected governing body of the cooperative housing society. In GrievEase, committee members possess administrative authority to resolve grievances, monitor contractor performance, approve financial waivers (maker-checker), and moderate public testimonials.

---

## 2. Maker-Checker Financial Approvals

Under GrievEase's anti-fraud financial controls, any financial credit note, void, or maintenance waiver created by a cashier or secretary requires **Committee Approval** before it impacts the flat's ledger balance.

### 2.1 Approving a Pending Waiver
1. Navigate to `/admin/billing/waivers`.
2. Filter by status: `PENDING_APPROVAL`.
3. Click on a waiver entry to inspect:
   - Target Flat & Member
   - Requested waiver amount in ₹
   - Justification provided by the Maker
   - Maker's identity (`created_by`)
4. **Separation Rule**: If you created the waiver, the system will prevent you from approving it ("Maker cannot act as checker").
5. Click **Approve Waiver** (or **Reject with Note**).
6. Upon approval, the system posts an append-only contra ledger line item and dispatches an in-app notice to the flat owner.

---

## 3. Grievance Resolution & SLA Monitoring

1. Navigate to `/admin/grievances` (or `/admin/inbox`).
2. Review grievances categorized by Priority: `EMERGENCY`, `HIGH`, `MEDIUM`, `LOW`.
3. Tickets approaching working-hours SLA limits are highlighted in Amber/Red.
4. Open the grievance details:
   - Read resident's description and attached photos.
   - For anonymous grievances, respect whistleblower confidentiality (complainant identity is cryptographically masked).
5. Record resolution progress or internal notes (visible only to committee).
6. To complete resolution:
   - Click **Mark Resolved**.
   - Input resolution summary.
   - The resident receives an in-app prompt to confirm "Resolved" or "Reopen".

---

## 4. Vendor Contractor Performance Review

1. Navigate to `/admin/vendors`.
2. Inspect the **Vendor Performance Scorecard**:
   - Total Jobs Completed
   - Acceptance Rate & On-Time Arrival Rate
   - Average Completion Duration (Hours)
   - Resident Confirmation Rate & Average Star Rating
3. **Sample Size Rule**: If a contractor has completed fewer than 5 jobs, the scorecard displays *"Not enough data"* to prevent statistical distortion from a single outlier.
4. Export formula-safe CSV reports via **Export Performance CSV**.

---

## 5. Testimonial Moderation

1. Navigate to `/admin/cms` and select the **Testimonials** tab.
2. Review resident reviews submitted via `/testimonials`.
3. Verify that the resident has granted explicit publication consent and that no offensive or defamatory claims exist.
4. Click **Approve**.
5. Once approved, the testimonial appears in the public homepage testimonial reel (provided the society has at least 3 approved reviews).

