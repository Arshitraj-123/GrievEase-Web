# GrievEase Exhaustive Form & Mutation Endpoint Security Inventory

> **Audit Scope**: 100% of Front-End `<form>` dialogs and Back-End mutation endpoints.
> **Coverage**: 74 Front-End Forms and 159 Backend Mutation Endpoints analyzed.

## 1. Front-End Form & Dialog Inventory

| UI Route / Path | Form Name / Purpose | Captured Fields | Server Validation | CSRF Defense | Rate Limit | Idempotency |
|---|---|---|---|---|---|---|
| `/activate`<br>_apps/web/src/app/activate/page.tsx_ | **activate** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/activate/password`<br>_apps/web/src/app/activate/password/page.tsx_ | **activate/password** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/activate/recovery`<br>_apps/web/src/app/activate/recovery/page.tsx_ | **activate/recovery** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/activate/totp`<br>_apps/web/src/app/activate/totp/page.tsx_ | **activate/totp** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/admin/amenities`<br>_apps/web/src/app/admin/amenities/page.tsx_ | **Amenities Management** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/audit`<br>_apps/web/src/app/admin/audit/page.tsx_ | **Cryptographic Audit Trail** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/adjustments`<br>_apps/web/src/app/admin/billing/adjustments/page.tsx_ | **Financial Adjustments & Waivers** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/collect`<br>_apps/web/src/app/admin/billing/collect/page.tsx_ | **Cash Collection Desk** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `/admin/billing/cycles`<br>_apps/web/src/app/admin/billing/cycles/page.tsx_ | **Maintenance Bill Cycles** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/day-close`<br>_apps/web/src/app/admin/billing/day-close/page.tsx_ | **Daily Cash Close & Reconciliation** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/disputes`<br>_apps/web/src/app/admin/billing/disputes/page.tsx_ | **Payment Disputes Resolution** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/heads`<br>_apps/web/src/app/admin/billing/heads/page.tsx_ | **Maintenance Bill Heads** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/ledger`<br>_apps/web/src/app/admin/billing/ledger/page.tsx_ | **Flat Ledger Explorer** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/opening-balances`<br>_apps/web/src/app/admin/billing/opening-balances/page.tsx_ | **Opening Balances Migration** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/billing/verify`<br>_apps/web/src/app/admin/billing/verify/page.tsx_ | **Receipt Verification Desk** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/admin/bookings`<br>_apps/web/src/app/admin/bookings/page.tsx_ | **Amenity Bookings Desk** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/cms`<br>_apps/web/src/app/admin/cms/page.tsx_ | **admin/cms** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/directory`<br>_apps/web/src/app/admin/directory/page.tsx_ | **Directory & Approved Services** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `/admin/emergency-contacts`<br>_apps/web/src/app/admin/emergency-contacts/page.tsx_ | **Emergency Contacts Directory** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `/admin/grievances/on-behalf`<br>_apps/web/src/app/admin/grievances/on-behalf/page.tsx_ | **Create Grievance On-Behalf** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/grievances/[id]`<br>_apps/web/src/app/admin/grievances/[id]/page.tsx_ | **Grievance Not Found** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/leave`<br>_apps/web/src/app/admin/leave/page.tsx_ | **Resolver Leave Management** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/notices/[id]/edit`<br>_apps/web/src/app/admin/notices/[id]/edit/page.tsx_ | **Edit Notice** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/polls`<br>_apps/web/src/app/admin/polls/page.tsx_ | **Community Polls & Resolutions** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/amenities`<br>_apps/web/src/app/admin/settings/amenities/page.tsx_ | **Amenity Rules & Policies** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/analytics`<br>_apps/web/src/app/admin/settings/analytics/page.tsx_ | **{t('analytics.analyticsSettingsTitle')}** | `visibility` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 2 (60 req/min) | Naturally Idempotent (PUT/DELETE) |
| `/admin/settings/billing`<br>_apps/web/src/app/admin/settings/billing/page.tsx_ | **Billing & Accounting Configuration** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/categories`<br>_apps/web/src/app/admin/settings/categories/page.tsx_ | **Grievance Categories** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/gate`<br>_apps/web/src/app/admin/settings/gate/page.tsx_ | **admin/settings/gate** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/governance`<br>_apps/web/src/app/admin/settings/governance/page.tsx_ | **4-Level Governance Escalation Chain** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/notices`<br>_apps/web/src/app/admin/settings/notices/page.tsx_ | **Noticeboard Settings & Permissions** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/sla`<br>_apps/web/src/app/admin/settings/sla/page.tsx_ | **SLA Escalation Matrix** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/settings/sos`<br>_apps/web/src/app/admin/settings/sos/page.tsx_ | **admin/settings/sos** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/staff`<br>_apps/web/src/app/admin/staff/page.tsx_ | **Domestic Staff Verification & Passes** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/staff/[id]`<br>_apps/web/src/app/admin/staff/[id]/page.tsx_ | **{staff.fullName}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/super-admin-transfer`<br>_apps/web/src/app/admin/super-admin-transfer/page.tsx_ | **Super Admin Succession & Handover** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/support`<br>_apps/web/src/app/admin/support/page.tsx_ | **admin/support** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/users/import`<br>_apps/web/src/app/admin/users/import/page.tsx_ | **Bulk Member Import** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/users/new`<br>_apps/web/src/app/admin/users/new/page.tsx_ | **Add New Member** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/users`<br>_apps/web/src/app/admin/users/page.tsx_ | **Members & Staff Directory** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/vendor-tasks`<br>_apps/web/src/app/admin/vendor-tasks/page.tsx_ | **admin/vendor-tasks** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/vendors`<br>_apps/web/src/app/admin/vendors/page.tsx_ | **admin/vendors** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/admin/visitors`<br>_apps/web/src/app/admin/visitors/page.tsx_ | **admin/visitors** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/amenities/[id]`<br>_apps/web/src/app/app/amenities/[id]/page.tsx_ | **{t.amenities.bookingSuccess}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/deliveries`<br>_apps/web/src/app/app/deliveries/page.tsx_ | **{t.deliveries?.addExpected || 'Register Expected Courier'}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/directory`<br>_apps/web/src/app/app/directory/page.tsx_ | **{t.societyDirectory?.title || 'Society Directory'}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `/app/directory/services`<br>_apps/web/src/app/app/directory/services/page.tsx_ | **{t.societyDirectory?.servicesTitle || 'Approved Local Services'}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/disputes`<br>_apps/web/src/app/app/disputes/page.tsx_ | **{t.billing.reportIssue}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/grievances/[id]`<br>_apps/web/src/app/app/grievances/[id]/page.tsx_ | **Grievance Not Found** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/grievances/[id]/rate`<br>_apps/web/src/app/app/grievances/[id]/rate/page.tsx_ | **{t.grievances.ratingSuccess}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/messages`<br>_apps/web/src/app/app/messages/page.tsx_ | **app/messages** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/settings/gate`<br>_apps/web/src/app/app/settings/gate/page.tsx_ | **app/settings/gate** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/settings/privacy`<br>_apps/web/src/app/app/settings/privacy/page.tsx_ | **{t.societyDirectory?.privacySettingsTitle || 'Directory Privacy Controls'}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/staff/new`<br>_apps/web/src/app/app/staff/new/page.tsx_ | **Personal Information** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/staff/[id]/attendance`<br>_apps/web/src/app/app/staff/[id]/attendance/page.tsx_ | **{staff?.fullName || 'Staff Member'}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/staff/[id]`<br>_apps/web/src/app/app/staff/[id]/page.tsx_ | **{staff.fullName}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/app/visitors/frequent`<br>_apps/web/src/app/app/visitors/frequent/page.tsx_ | **app/visitors/frequent** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/contact`<br>_apps/web/src/app/contact/page.tsx_ | **{isDemo ? 'Request a Society Demo' : 'Contact Us & Society Support'}** | `honeypot, name, society, role, phone...` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/data-deletion`<br>_apps/web/src/app/data-deletion/page.tsx_ | **Data Deletion &amp; Right to Be Forgotten** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/forgot-password`<br>_apps/web/src/app/forgot-password/page.tsx_ | **forgot-password** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/guard/amenities`<br>_apps/web/src/app/guard/amenities/page.tsx_ | **Amenity Attendant Desk** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/guard/deliveries`<br>_apps/web/src/app/guard/deliveries/page.tsx_ | **guard/deliveries** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/guard/entry`<br>_apps/web/src/app/guard/entry/page.tsx_ | **Gate Check-In &amp; Entry Validation** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/guard/incidents`<br>_apps/web/src/app/guard/incidents/page.tsx_ | **Report Security Observation / Incident** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/guard/shift`<br>_apps/web/src/app/guard/shift/page.tsx_ | **guard/shift** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/guard/staff`<br>_apps/web/src/app/guard/staff/page.tsx_ | **guard/staff** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/login/2fa`<br>_apps/web/src/app/login/2fa/page.tsx_ | **login/2fa** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/login`<br>_apps/web/src/app/login/page.tsx_ | **login** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/onboarding/profile`<br>_apps/web/src/app/onboarding/profile/page.tsx_ | **onboarding/profile** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/reset-password`<br>_apps/web/src/app/reset-password/page.tsx_ | **reset-password** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/setup`<br>_apps/web/src/app/setup/page.tsx_ | **setup** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `/testimonials`<br>_apps/web/src/app/testimonials/page.tsx_ | **Trusted by Residents &amp; Housing Societies** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/track`<br>_apps/web/src/app/track/page.tsx_ | **{t.grievances.trackPublicTitle}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `/vendor/tasks/[id]`<br>_apps/web/src/app/vendor/tasks/[id]/page.tsx_ | **{task.title}** | `standard_form_fields` | Enforced (Zod/Pipe) | `SameSite=Lax` + Header | Tier 3 (120 req/min) | Idempotency-Key Header Supported |

## 2. Backend Mutation Endpoints Inventory

| HTTP Method | Endpoint | Request DTO / Schema | Server Validation | Rate Limiting Tier | Idempotency Guarantee |
|---|---|---|---|---|---|
| `POST` | `/api/v1/bookings/:id/cancel` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/bookings` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/:id` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/:id/blackouts` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/bookings/:id/approve` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/bookings/:id/reject` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/bookings/:id/no-show` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/settings` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/check-in` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/no-show` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PATCH` | `/api/v1/admin/settings/analytics` | `AnalyticsSettingsDto` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/auth/login` | `any` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/refresh` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/logout` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/2fa/verify` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/step-up` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/activate` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/activate/password` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/activate/recovery` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/activate/totp` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/activate/totp/confirm` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/recovery/start` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/recovery/verify-questions` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/recovery/use-code` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/recovery/reset-with-ticket` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/auth/setup` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 1 (5 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/disputes` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/heads` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/heads/:id` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/cycles/preview` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/cycles/:id/commit` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/payments` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/sessions/open` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/sessions/close` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/sessions/:id/reconcile` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/adjustments` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/adjustments/:id/decide` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/disputes/:id/resolve` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/ledger/:flatId/verify` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/opening-balances/preview` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/opening-balances/commit` | `Record` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/settings` | `Record` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/contact` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/testimonials` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/conversations` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/conversations/:id/messages` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/support-tickets` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/faq` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/testimonials/:id/moderate` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/contact-requests/:id` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/support/conversations/:id/messages` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/support/tickets/:id/resolve` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/settings/:key` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `PUT` | `/api/v1/directory/preference` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/directory/services/:id/reviews` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/emergency-contacts` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/directory/reviews/:id/moderate` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/escalation/sweep` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/categories` | `CategoryDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/area-tags` | `AreaTagDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/chain/assign` | `GovernanceAssignmentDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/sla` | `SlaConfigDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/leave` | `ResolverLeaveDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/working-hours` | `WorkingHoursDayDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/governance/settings` | `Record` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/grievances/drafts` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `DELETE` | `/api/v1/grievances/drafts` | `CreateGrievanceDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/grievances` | `CreateGrievanceDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/notes` | `AddGrievanceNoteDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/remind` | `GrievanceAppealDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/mark-resolved` | `GrievanceAppealDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/appeal` | `GrievanceAppealDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/reopen` | `GrievanceRateDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/rate` | `GrievanceRateDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/acknowledge` | `UpdateGrievanceStatusDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/status` | `UpdateGrievanceStatusDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/internal-note` | `AddGrievanceNoteDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/request-info` | `RequestInfoDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/escalate` | `ManualEscalateDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/assign` | `GrievanceAssignDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/flag` | `GrievanceFlagDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/:id/reveal-identity` | `RevealIdentityDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/grievances/on-behalf` | `CreateOnBehalfDto` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/heartbeat` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/pin/set` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/pin/unlock` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/shift/check-in` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/shift/check-out` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/incidents` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/patrol/scan` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/handover` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/staff/verify-scan` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/guards/devices` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/guards/devices/:id/revoke` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/import/upload` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/import/commit` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/import/rollback/:batchId` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/import/slips/export-csv` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/notices/:id/acknowledge` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/notices` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/admin/notices/:id` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Naturally Idempotent (PUT/DELETE) |
| `PATCH` | `/api/v1/notifications/:id/read` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/notifications/read-all` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/community/polls/:id/vote` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/polls` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/polls/:id/extend` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/requests/public` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/consent` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/me/deletion-request` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/:id/verify` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/sos/raise` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/sos/alerts/:id/cancel` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/api/sos/alerts/:id/ack` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/sos/alerts/:id/respond` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/sos/alerts/:id/resolve` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/api/sos/drills/start` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/sos/settings` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/staff` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/staff/link` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/staff/:id/attendance` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/staff/:id/reviews` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/staff/verify-pass` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/staff/:id/verify` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/staff/:id/block` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/staff/:id/unblock` | `string` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/admin/staff/merge` | `any` | Enforced (Whitelist: true) | Tier 2 (60 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/storage/upload` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/backups/record` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/users` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/users/recovery-requests/:ticketId/cancel` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/users/recovery-requests/:ticketId/approve` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/users/super-admin/nominate` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/users/super-admin/confirm` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `DELETE` | `/api/v1/users/me/sessions/:sessionId` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/users/me/sessions/revoke-others` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PATCH` | `/api/v1/users/me/preferences` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/users/:id/activation-code` | `string` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/users/:id/change-role` | `Role` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PATCH` | `/api/v1/users/:id/status` | `Zod / Nest ValidationPipe` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/tasks/:id/respond` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/tasks/:id/schedule` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/tasks/:id/complete` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/tasks/:id/resident-confirm` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/:id` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/visitors/passes` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/visitors/passes/:id/cancel` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/api/visitors/verify` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/visitors/passes/:id/admit` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/visitors/walkin` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/visitors/approvals/respond` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/visitors/logs/:id/exit` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/api/visitors/deliveries/expected` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/visitors/deliveries/arrival` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `PUT` | `/api/v1/api/visitors/deliveries/logs/:id/collect` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Naturally Idempotent (PUT/DELETE) |
| `POST` | `/api/v1/api/visitors/blocklist` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |
| `POST` | `/api/v1/api/visitors/frequent` | `any` | Enforced (Whitelist: true) | Tier 3 (120 req/min) | Idempotency-Key Header Supported |

## 3. Defense-in-Depth Form Hardening Rules

1. **Zero Client Trust**: All payloads are parsed and validated on the backend via NestJS ValidationPipes with `whitelist: true` and `forbidNonWhitelisted: true`. Unknown fields trigger `BAD_REQUEST`.
2. **Mass-Assignment Protection**: Injected administrative fields (`role`, `is_admin`, `society_id`, `status`) are stripped and rejected server-side.
3. **CSRF & Cookie Protection**: Cross-site request forgery is prevented via `SameSite=Lax` cookies, `Origin` / `Referer` validation, and anti-CSRF headers on state-mutating requests.
4. **Idempotency**: All payment, billing, cash-collection, and grievance state-transition endpoints require or accept `Idempotency-Key` headers backed by Redis locks to prevent duplicate submissions.
