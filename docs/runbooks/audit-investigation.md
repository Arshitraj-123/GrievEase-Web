# Runbook: Audit Log Hash Chain Break & Tamper Investigation

## 1. Overview & Cryptographic Architecture

The GrievEase `audit_log` records every sensitive administrative and financial event using an append-only, cryptographic hash chain:
$$\text{hash}_n = \text{SHA-256}(\text{hash}_{n-1} \parallel \text{canonical\_json}(\text{entry}_n))$$
- Genesis block: $\text{hash}_0 = \text{"0".repeat(64)}$
- PostgreSQL Trigger: `audit_log_immutable_trigger` raises an uncatchable exception on `UPDATE`, `DELETE`, or `TRUNCATE`.

A chain verification failure indicates that either:
1. A direct unauthorized database modification was made (bypassing triggers via `ALTER TABLE ... DISABLE TRIGGER ALL`).
2. Disk corruption / bit-rot occurred on the PostgreSQL storage volume.
3. An administrative record was excised or reordered.

---

## 2. Detection & Alerting

Chain verification runs daily at 04:00 AM via the `audit:chain-verify` worker and can be manually executed via:
```bash
pnpm audit:verify --society=<society_id>
```

### Alert Symptoms:
- Automated in-app critical alert dispatched to Governing Body and Chairman: `CRITICAL: Audit hash chain integrity failure detected at sequence #<seq>`.
- `/admin/system` dashboard displays red health badge: `Cryptographic Audit Chain: COMPROMISED`.

---

## 3. Step-by-Step Forensic Investigation

### Step 3.1: Identify the Broken Block
Run verification with verbose forensic output:
```bash
node scripts/audit-verify.js --society=<society_id> --verbose
```
The script will output the exact failure point:
```text
[ERROR] Chain broken at Sequence #1042!
Stored hash:    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Computed hash:  7a38c13b...
Difference:     Expected prev_hash at #1043 did not match hash at #1042.
```

### Step 3.2: Inspect Surrounding Records & Snapshots
Extract blocks $n-1$, $n$, and $n+1$ directly using read-only psql query:
```sql
SELECT seq, timestamp, actor_id, actor_role, action, entity_type, entity_id, prev_hash, hash, diff
FROM audit_log
WHERE society_id = '<society_id>' AND seq BETWEEN 1040 AND 1045
ORDER BY seq ASC;
```
Check:
- Was an entry deleted (e.g. sequence numbers jump from 1041 to 1043)?
- Was a financial amount or actor ID altered in place?
- What was the transaction timestamp and actor associated with sequence 1042?

### Step 3.3: Cross-Reference Database WAL Logs
Inspect PostgreSQL write-ahead logs (WAL) to identify the client connection and IP address that executed the query:
```bash
grep -rn "audit_log" /var/log/postgresql/
```
Look for direct `psql` connections or non-application connection pools.

### Step 3.4: Reconcile Against Off-Site Daily Hash Notarization
Compare the computed hash against the daily signed hash snapshot published to off-site custody or recorded in committee meeting minutes:
- If historical notarized hash matches `stored_hash`, the alteration occurred *after* the notarization date.
- If notarized hash does not match, the tampering occurred prior to that notarization date.

---

## 4. Legal & Regulatory Escalation

Under cooperative housing society rules and DPDP Act 2023:
1. **Immediate Lockdown**: Place the affected society tenant in maintenance read-only mode if financial embezzlement is suspected.
2. **Governing Body Emergency Meeting**: Convene Chairman, Secretary, and Governing Body within 24 hours.
3. **Statutory Notice**: If financial records or cash receipts were tampered with, prepare forensic extract for the Registrar of Cooperative Societies and the external statutory auditor.

---

## 5. Resealing & Recovery

If tampering is investigated and confirmed to be storage corruption or remediated through authorized legal channels:
1. Document the incident report in a signed physical affidavit.
2. An authorized dual-keyholder script inserts a special corrective `AUDIT_CHAIN_RESEAL` event with the explanation, signing with the Chairman and Super Admin keys.
3. Restart monitoring and record new genesis baseline.

