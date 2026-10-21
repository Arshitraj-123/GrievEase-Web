# ADR 0001: Data Access Architecture & ORM Selection

## Context and Problem Statement
GrievEase is a multi-tenant residential community management system operating under strict client security requirements:
1. Every business table requires multi-tenant isolation via `society_id` and PostgreSQL Row-Level Security (RLS).
2. The audit log must be strictly immutable and cryptographically hash-chained, enforced at the database level with plain SQL triggers rejecting `UPDATE`, `DELETE`, and `TRUNCATE`.
3. The platform must remain cloud-neutral, running locally and in Docker without external dependencies.
4. Schema migrations must be version-controlled, reproducible, reversible where safe, and expressed in plain SQL.

We evaluated three potential data access solutions: **Prisma**, **TypeORM**, and **Drizzle ORM**.

## Decision
We select **Drizzle ORM** (with `pg` and `drizzle-kit`) for the data access layer.

## Comparison & Justification

| Criteria | Drizzle ORM | Prisma | TypeORM |
| :--- | :--- | :--- | :--- |
| **PostgreSQL RLS Support** | **Native & Ergonomic**: Drizzle allows transaction-scoped `SET LOCAL app.current_society = ...` and straightforward custom SQL execution. | **Cumbersome**: Prisma does not natively support transaction-bound session parameters without raw extensions or middleware workarounds. | **Moderate**: Requires manual subscriber or query runner management. |
| **SQL Migrations Control** | **Plain SQL**: Generates standard SQL migrations that can be inspected, committed, and augmented with custom RLS policies and trigger functions. | **Abstracted**: Prisma Migrate works with Prisma Schema; custom SQL requires tricky `prisma migrate diff` or manual edit steps. | **Mixed**: TypeORM migrations can be written in TS/SQL, but often diverge between entity definitions and schema. |
| **Binary & Platform Footprint** | **Zero Native Binaries**: Pure TypeScript/JavaScript with minimal footprint across Linux, macOS, and Windows. | **Heavy Engine Binaries**: Bundles native Rust query engine binaries that frequently cause platform lockups and container size inflation. | **Zero Native Binaries**: JavaScript-only, but heavy reflect-metadata and complex active-record / data-mapper abstractions. |
| **Type Safety & Performance** | **Zero Overhead**: Schema matches TypeScript types 1:1; queries compile directly to parameterized SQL with virtually no query latency overhead. | **High Safety, Higher Latency**: Engine IPC overhead and query generation layers. | **Legacy Decorators**: Relies on experimental decorators and legacy metadata reflection, causing typing quirks. |

## Implementation Strategy
1. **Schema Definition**: Schemas are declared in `apps/api/src/database/schema/` using Drizzle's typed schema builder.
2. **PostgreSQL Row-Level Security (RLS)**:
   - Plain SQL migration enables RLS on tenant tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
   - Tenant isolation policy: `CREATE POLICY tenant_isolation_policy ON ... USING (society_id = NULLIF(current_setting('app.current_society', true), '')::uuid);`.
3. **Audit Log Protections**:
   - PostgreSQL triggers `BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_log` immediately raise an exception `RAISE EXCEPTION 'audit_log is append-only';`.
4. **Per-Request Context**:
   - In NestJS, a database connection interceptor/service sets `app.current_society` and `app.current_user` within transaction boundaries for tenant safety.
