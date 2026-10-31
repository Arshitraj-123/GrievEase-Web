# GrievEase Dependency Security Audit & Vulnerability Triage Allowlist

> **Audit Date**: 2026-10-31  
> **Package Manager**: pnpm v12.14.0  
> **Node LTS Target**: Node 22 LTS (`node:22-alpine`)  
> **Audit Status Summary**: **0 Critical**, 16 High, 21 Moderate, 1 Low (Total: 38 transitive findings).

---

## 1. Resolved & Eliminated Vulnerabilities

### A. `xlsx` (SheetJS Prototype Pollution & ReDoS)
- **Status**: **COMPLETELY EXCISED**
- **Action**: Removed `xlsx` dependency from `apps/api/package.json`. Replaced with secure, actively maintained `exceljs`.

### B. `tinypool` (Prototype Pollution in Worker Options -> RCE)
- **Status**: **RESOLVED VIA OVERRIDE**
- **Action**: Pinned `tinypool: ">=2.1.2"` via `pnpm-workspace.yaml`. Both critical RCE advisories eliminated.

---

## 2. Triaged Transitive Findings & Justifications with Expiry Dates

| Package | Severity | Count | Root Ingestion Path | Context & Compensating Control | Review Expiry Date |
|---|---|---|---|---|---|
| `multer` | High / Low | 16 High, 1 Low | `@nestjs/platform-express` -> `multer` | Incomplete cleanup / async race condition on streaming multi-part bodies. **Compensating Controls**: Nginx reverse proxy enforces strict `client_max_body_size 15M;` before packets reach Node.js runtime. GrievEase only accepts image files (`.jpg`, `.png`, `.webp`) and verifies magic bytes via Sharp. | **2027-04-30** (Targeted for upgrade in NestJS v11) |
| `body-parser` | Moderate | 21 Moderate | `express` -> `body-parser` | URL-encoded parsing depth. **Compensating Controls**: Express JSON parser is limited to `100kb` payloads in `main.ts`. Unauthenticated endpoints enforce Redis sliding-window rate limiting. | **2027-04-30** |

---

## 3. SBOM (Software Bill of Materials) Generation
GrievEase generates an automated CycloneDX / SPDX Software Bill of Materials tracking all direct and transitive dependencies:
- **Output Artifact**: `docs/evidence/sbom.json`
- **Specification**: CycloneDX JSON format
- **Generation Tool**: `scripts/generate-sbom.js`
