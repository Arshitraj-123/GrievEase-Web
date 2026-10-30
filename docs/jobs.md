# GrievEase Background Jobs & Scheduled Workers Inventory

## 1. Architectural Principles

All background jobs and workers in GrievEase run on **BullMQ** backed by self-hosted Redis.
- **Strict Idempotency**: Every job payload carries an `idempotencyKey` derived from `society_id + job_type + entity_id + date/window`.
- **Zero Third-Party Dispatch**: No external webhooks, email triggers, or SMS gateways are invoked. All worker alerts are persisted directly as in-app notifications (`app_notification`) or internal event records.
- **Audit Logging**: Sensitive background operations (e.g. auto-escalations, late fee postings, hold expiries) append entries to the society's hash-chained `audit_log`.

---

## 2. Master Jobs Inventory

| Job Name | Queue / Handler | Schedule (Cron) | Idempotency Rule | Failure / Retry Policy | Failure Action & Alerting |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `amenity:hold-expire` | `amenity-queue` | `* * * * *` (Every min) | Booking ID + State `AWAITING_PAYMENT` | 3 retries, exponential backoff (10s) | Cancel booking, release GiST lock / capacity counter, emit in-app notice to resident. |
| `grievance:sla-check`| `grievance-queue`| `*/15 * * * *` (15m) | Grievance ID + SLA Level | 3 retries, backoff (30s) | Escalate to Chairman, mark `INTERNAL` event on timeline, notify assignee and Secretary. |
| `billing:cycle-run`  | `billing-queue`  | `0 1 * * *` (Daily 1am) | `society_id:YYYY-MM:generate` | 5 retries with dead-letter queue | Log error to `job_run_log`, alert Super Admin with uncommitted draft status. |
| `billing:late-fee`   | `billing-queue`  | `0 2 * * *` (Daily 2am) | `bill_id:YYYY-MM-DD:late_fee` | 3 retries, backoff (1m) | Post contra ledger line item, emit statement update notification. |
| `vendor:deadline`    | `vendor-queue`   | `0 * * * *` (Hourly)   | `vendor_task_id:accept_check` | 3 retries | Mark task `UNANSWERED`, notify assigner for reassignment. |
| `vendor:confirm-exp` | `vendor-queue`   | `0 3 * * *` (Daily 3am) | `vendor_task_id:confirm_exp` | 3 retries | Set `resident_confirmation = 'NO_RESPONSE'`, notify resolver. |
| `backup:nightly`     | `ops-queue`      | `0 2 * * *` (Daily 2am) | `backup:YYYY-MM-DD` | 2 retries | Write failure to `backup_log`, trigger system health alert banner on `/admin/system`. |
| `audit:chain-verify` | `ops-queue`      | `0 4 * * *` (Daily 4am) | `audit_verify:society_id:date` | 1 retry | On chain break, immediately lock society write operations and dispatch critical alerts. |
| `dpdp:retention-prune`| `ops-queue`     | `0 3 * * 0` (Weekly Sun)| `prune:YYYY-WW` | 3 retries | Delete expired visitor logs (>90d) and contact requests (>180d), log row counts to `job_run_log`. |

---

## 3. Worker Execution Conventions

### 3.1 Society Timezone Alignment
All cron expressions are evaluated against the society's configured timezone (`society.timezone`, default `Asia/Kolkata`).
Financial year boundaries are anchored to `financial_year_start_month` (default April).

### 3.2 Job Execution Record (`job_run_log`)
Every job run records:
- `job_id`: UUID
- `job_name`: string
- `society_id`: nullable UUID (null for global ops tasks)
- `started_at`, `completed_at`: Timestamps
- `status`: `'SUCCESS' | 'FAILED' | 'RETRY'`
- `items_processed`: integer
- `error_message`: text (sanitized, no PII)

