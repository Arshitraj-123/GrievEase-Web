# GrievEase Analytics & Performance Metric Definitions

This document serves as the single source of truth for all metrics, key performance indicators (KPIs), aging formulas, and reporting aggregates across GrievEase. All public dashboards, resident analytics, and administrative views must reconcile strictly against these mathematical definitions.

---

## 1. Timezone & Temporal Bucketing

- **Canonical Timezone**: All date-based aggregations and day boundaries are evaluated according to the society's configured timezone (`society.timezone`, defaulting to `Asia/Kolkata` [UTC+05:30]).
- **Day Boundary**: A metric date `D` encompasses timestamps from `00:00:00.000` to `23:59:59.999` in `society.timezone`.
- **Pre-Aggregation Interval**: Aggregates are computed daily (`YYYY-MM-DD`). Rolling ranges (`30d`, `90d`, `12m`) evaluate closed intervals anchored to the start and end dates in the society timezone.

---

## 2. Core Volume & Lifecycle Metrics

### 2.1 Total Submitted (`total_submitted`)
- **Definition**: Count of grievances created within the date interval where `status != 'DRAFT'`.
- **Formula**: `COUNT(id) WHERE created_at BETWEEN start AND end AND status != 'DRAFT'`.

### 2.2 Active Open Load (`open_load`)
- **Definition**: Count of grievances currently in an unresolved state (`SUBMITTED`, `ACKNOWLEDGED`, `IN_PROGRESS`, `PENDING_INFO`, `ESCALATED`, or `REOPENED`).
- **Formula**: `COUNT(id) WHERE status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')`.

### 2.3 Status Distribution
- **Submitted**: `status = 'SUBMITTED'` (Awaiting initial acknowledgement).
- **Acknowledged / In Progress**: `status IN ('ACKNOWLEDGED', 'IN_PROGRESS')`.
- **Pending Info**: `status = 'PENDING_INFO'` (Awaiting clarification from complainant; SLA clock paused).
- **Escalated**: `status = 'ESCALATED'` (Escalated to a higher governance level).
- **Resolved**: `status = 'RESOLVED'` (Resolver marked issue resolved; within auto-close grace window).
- **Closed**: `status = 'CLOSED'` (Confirmed resolved by resident or auto-closed).
- **Reopened**: `status = 'REOPENED'` (Reopened by resident within 7 days of resolution).

---

## 3. SLA & Duration Calculations

### 3.1 Resolution Time (`resolution_duration_minutes`)
- **Definition**: The net elapsed duration from submission (`grievance.created_at`) to initial resolution (`grievance.resolved_at`), strictly subtracting any time spent in `PENDING_INFO` status.
- **Formula**:
  $$\text{Net Resolution Minutes} = (\text{resolved\_at} - \text{created\_at}) - \sum \text{Intervals in PENDING\_INFO}$$
- **Working Hours Adjustment**: If `working_hours` are enabled for the society, non-working hours and disabled weekdays are deducted from the elapsed duration. If disabled (default 24x7), clock runs continuously.
- **Average Resolution Time**:
  $$\overline{T}_{\text{resolve}} = \frac{\sum \text{Net Resolution Minutes of Resolved Grievances}}{\text{Count of Resolved Grievances}}$$

### 3.2 Time to Acknowledge (`time_to_acknowledge_minutes`)
- **Definition**: Net elapsed time from `grievance.created_at` until the initial acknowledgement event (`type = 'STATUS_CHANGE'` to `ACKNOWLEDGED` or `IN_PROGRESS`, or `type = 'ACKNOWLEDGED'`).
- **Formula**: `first_ack_at - created_at` (adjusted for working hours if enabled).

### 3.3 Time Spent Per Level (`level_duration_minutes`)
- **Definition**: Net minutes a grievance spends assigned to a specific governance level $L \in \{1, 2, 3, 4\}$, from `level_entered_at` until transition to another level or resolution.
- **Formula**: `SUM(level_exit_at - level_entered_at - pending_info_intervals_at_level)`.

### 3.4 SLA Compliance Per Level (`sla_compliance_rate`)
- **Definition**: Percentage of grievances that exited a level (either by being resolved or transferred) before `sla_due_at`.
- **Formula**:
  $$\text{SLA Compliance } \% = \frac{\text{Count of items handled on or before sla\_due\_at}}{\text{Total items handled at this level}} \times 100$$

### 3.5 SLA Breach (`sla_breach_count`)
- **Definition**: An automatic breach event where `sla_due_at` expired without resolver resolution, triggering autonomous escalation to the next level.
- **Recorded in**: `escalation_log` with `reason = 'AUTO_SLA'`.

### 3.6 Final Level Overdue (`FINAL_LEVEL_OVERDUE`)
- **Definition**: Grievances currently at Level 4 (Governing Body) where `status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')` and `CURRENT_TIMESTAMP > sla_due_at`.
- **Note**: Auto-escalation halts at Level 4; these tickets are flagged as `FINAL_LEVEL_OVERDUE` across executive dashboards.

---

## 4. Quality, Feedback & Friction Metrics

### 4.1 Reopen Rate (`reopen_rate`)
- **Definition**: Percentage of resolved grievances that were reopened by the resident within the 7-day window.
- **Formula**:
  $$\text{Reopen Rate} = \frac{\text{Count of grievances with at least one REOPEN event}}{\text{Total resolved grievances}} \times 100$$

### 4.2 Appeal Rate (`appeal_rate`)
- **Definition**: Percentage of grievances where the resident filed a formal appeal under the 4-level chain.
- **Formula**:
  $$\text{Appeal Rate} = \frac{\text{Count of grievances with an appeal entry}}{\text{Total submitted grievances}} \times 100$$

### 4.3 Resident Satisfaction Score (`satisfaction_score`)
- **Definition**: Arithmetic mean of 1-to-5 star ratings submitted by residents upon grievance closure.
- **Formula**:
  $$\text{Average Satisfaction} = \frac{\sum_{i=1}^{N} \text{stars}_i}{N} \quad (N = \text{Count of rated grievances})$$
- **Sample Size Requirement**: The rating count $N$ must always be shown alongside the average (e.g., `4.6 ★ (142 reviews)`). If $N < 5$, the rating is suppressed with "Insufficient Data".

### 4.4 Aging Buckets (Open Inventory)
For currently open grievances (`status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')`):
- **0–1 Days**: $\text{Age} \le 24\text{ hours}$.
- **1–3 Days**: $24\text{ hours} < \text{Age} \le 72\text{ hours}$.
- **3–7 Days**: $72\text{ hours} < \text{Age} \le 168\text{ hours}$.
- **7+ Days**: $\text{Age} > 168\text{ hours}$.

### 4.5 Recurring Issue Detection (`recurring_issues`)
- **Definition**: Any combination of `(category_id, area_tag_id)` that has experienced $\ge 3$ distinct grievance submissions within a rolling 30-day window.
- **Privacy Rule**: Displays `Category Name` + `Area Tag Name` + `Count` only. Free-text titles and descriptions are strictly excluded.

---

## 5. Resolver Performance & Fair Accountability Rules

### 5.1 Volume Normalization
Resolvers must be evaluated on **rates and averages**, not raw counts, to avoid penalizing individuals handling higher ticket volumes.

### 5.2 Minimum Sample Size Rule
- If a resolver has closed fewer than 5 grievances ($N < 5$) in the selected date range:
  - Do NOT calculate an SLA hit rate or ranking.
  - Display: `Not enough data (<5 closed)`.

### 5.3 Isolation by Governance Level
Resolvers must **never** be ranked against resolvers of different governance levels (e.g. Level 1 Secretary cannot be ranked alongside Level 3 Chairman). Comparisons exist strictly within peers at the same governance level.

### 5.4 Exclusion of Resolver Leave
Items that breached SLA during dates where the assigned resolver had an active, approved `resolver_leave` record are excluded from that resolver's breach count (attributed to vacancy/reassignment instead).

### 5.5 Neutral Performance Labels (Configurable Thresholds)
Based on SLA Hit Rate with sample size $N \ge 5$:
- **Excellent**: $\text{SLA Hit Rate} \ge 90\%$.
- **On Track**: $75\% \le \text{SLA Hit Rate} < 90\%$.
- **Needs Support**: $\text{SLA Hit Rate} < 75\%$.

*(Note: Threshold values are configurable per society in `society_setting` and labelled as pending client confirmation).*

---

## 6. Privacy & Small-Number Suppression Rules

To prevent re-identification through small population inference:

1. **Cell Suppression Threshold (`MIN_CELL_SIZE = 5`)**:
   - Any aggregated cell (e.g. by wing, category, or area) with a value $1 \le V < \text{MIN\_CELL\_SIZE}$ is replaced by `< 5`.
2. **Complementary Suppression**:
   - If only one cell in a row/column is suppressed, the second lowest cell must also be suppressed to prevent algebraic recovery from totals.
3. **Wing & Flat Exclusion for Anonymous Complaints**:
   - Anonymous complaints (`is_anonymous = true`) have `submitter_user_id = NULL` and `flat_id = NULL`.
   - Anonymous complaints are included in global totals, category totals, and status splits, but are **100% excluded from wing heatmaps and floor distributions**.
4. **Zero-PII Export Guarantee**:
   - Public and resident analytics APIs and exports never contain `name`, `email`, `phone`, `flat_number`, `user_id`, or free-text inputs.
