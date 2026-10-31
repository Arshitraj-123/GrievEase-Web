# GrievEase GitHub Repository Security Checklist (Human Administrator)

> **Audience**: Repository Owner / Organization Administrator  
> **Purpose**: Instructions for configuring repository-level settings that cannot be automated via code commits.

---

## 1. Visibility & Access Control
- [ ] **Repository Visibility**: Ensure repository is set to **Private** (`Settings > General > Danger Zone > Change repository visibility`).
- [ ] **No Shared Accounts**: Every engineer and maintainer must use their own named GitHub account. Shared "admin" or "deploy" logins are strictly prohibited.
- [ ] **Mandatory Two-Factor Authentication (2FA)**: Enforce 2FA for all members in the GitHub Organization (`Organization Settings > Authentication security > Two-factor authentication`).
- [ ] **Least Privilege Collaborators**: Grant `Triage` or `Write` access to developers; reserve `Admin` access strictly to designated Security / Lead maintainers.

---

## 2. Branch Protection Rules (`main` / `master`)
Navigate to `Settings > Branches > Add branch ruleset` (or `Add branch protection rule`) targeting `main` and `master`:
- [ ] **Require a pull request before merging**:
  - [ ] Require at least **1 approving review** from a code owner.
  - [ ] Dismiss stale pull request approvals when new commits are pushed.
  - [ ] Require review from Code Owners (`CODEOWNERS` file).
- [ ] **Require status checks to pass before merging**:
  - [ ] Require branches to be up to date before merging.
  - [ ] Mandatory checks:
    - `Lint, Full History Secret Scan & Type Check`
    - `Unit & Integration Tests + Restore Verification`
    - `Preflight Checklist Verification`
- [ ] **Do not allow bypassing the above settings**: Ensure administrators are subject to the same rules.
- [ ] **Block Force Pushes**: Explicitly disallow `git push --force` or force with lease.
- [ ] **Block Branch Deletion**: Prevent accidental or malicious branch deletion.
- [ ] **Require Signed Commits (GPG/SSH)**: (Recommended) Reject unsigned commits.

---

## 3. GitHub Advanced Security & Scanning
Navigate to `Settings > Code security and analysis`:
- [ ] **Secret Scanning**: Set to **Enabled**.
- [ ] **Push Protection**: Set to **Enabled** (blocks commits containing secrets before they reach the remote repository).
- [ ] **Dependabot Alerts**: Set to **Enabled**.
- [ ] **Dependabot Security Updates**: Set to **Enabled** (uses `.github/dependabot.yml`).

---

## 4. Actions & CI Security
Navigate to `Settings > Actions > General`:
- [ ] **Workflow Permissions**: Select **Read repository contents and packages permissions** (default least-privilege).
- [ ] **Fork Pull Request Workflows**: Require approval for first-time contributors; ensure repository secrets are NEVER passed to forks.
- [ ] **Pinned Action SHAs**: Verify all GitHub Actions workflows in `.github/workflows/` pin actions by immutable commit SHAs, not mutable tags.

