# Runbook: Super Admin Sole Approver Governance & Audit Review

## 1. Governance Context & Policy

GrievEase strictly mandates **Maker-Checker Separation of Duties** for all financial and destructive actions:
- Maintenance bill generation runs
- Debt waivers and bill voids
- Credit note issuance
- Deposit refunds

### The Single-Admin Edge Case:
In micro-societies (e.g. fewer than 15 flats) with only ONE registered administrator, strict maker-checker would create an operational dead-end.

To reconcile security with operational continuity:
1. The `SUPER_ADMIN` is permitted to act as sole approver ONLY when society metadata indicates fewer than two eligible officers.
2. Every such action is permanently branded with the `audit_flag = 'SOLE_APPROVER'`.
3. An automated, non-dismissible in-app notification is broadcast to every member of the `GOVERNING_BODY`.
4. A persistent yellow warning banner is surfaced on `/admin/billing` and `/admin/system`.

---

## 2. Monthly Sole Approver Audit Review

Every 30 days (or before quarterly committee meetings), the Governing Body must perform a formal review of all `SOLE_APPROVER` actions.

### Step 2.1: Extract Sole-Approver Ledger & Audit Entries
Run the audit extraction query:
```sql
SELECT 
  a.seq,
  a.timestamp,
  a.actor_id,
  u.full_name AS approver_name,
  a.action,
  a.entity_type,
  a.entity_id,
  a.diff
FROM audit_log a
JOIN app_user u ON a.actor_id = u.id
WHERE a.society_id = '<society_id>'
  AND (a.diff->>'audit_flag' = 'SOLE_APPROVER' OR a.diff->>'sole_approver' = 'true')
ORDER BY a.seq DESC;
```

### Step 2.2: Verify Justifications Against Committee Meeting Minutes
For each extracted entry:
1. **Waivers / Voids**:
   - Verify that physical written approval exists from the society resident or flat owner.
   - Verify that the waiver was not applied to the Super Admin's own flat.
2. **Bill Generation**:
   - Verify that the rate per sq ft or flat matches the general body approved resolution.
3. **Credit Notes**:
   - Verify bank statement showing duplicate or excess cash deposits.

### Step 2.3: Sign-Off & Attestation
The Governing Body records approval in the quarterly minutes:
```markdown
"We, the Governing Body of [Society Name], have examined [N] sole-approver financial actions executed between [Date] and [Date] under audit flag SOLE_APPROVER. We confirm that all entries reconcile with society records."
```

---

## 3. Discrepancy Protocol

If an unauthorized or suspicious sole-approver transaction is identified:
1. Immediately invoke break-glass to freeze the Super Admin account.
2. Post a contra/reversing entry in `society_ledger` to restore ledger balance (financial records are never updated in place).
3. Report the finding to the Registrar of Cooperative Societies.

