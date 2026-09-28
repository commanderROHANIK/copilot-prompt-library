---
title: ai-review2
variables:
  - PR_ID: PR link or ID to review
---
/fleet Local, no-post, multi-agent crew review of PR {{PR_ID}}. Strict and rigorous, advisory
only — never comment, resolve, approve, push, or commit anything to the real PR/repo.

0. Setup
   - Work only in the git worktree at Documents\worktrees. It's shared with other people:
     `git status` first to confirm it's clean, note the current branch to restore later, never
     force-checkout/force-pull over changes that aren't yours. Check out whatever branch the PR needs.
   - Create <Desktop>\pr-review-<PR-ID>\ for all artifacts (notes, per-role findings tables, diffs,
     final report). Nothing is written outside this folder or posted anywhere.
   - Fetch PR diff, description, commits, changed-files, and linked work item(s). If no work item
     is linked, ask me for one or confirm reviewing without it.

1. Build the plan FROM the PR (not from a static checklist)
   - Identify touched subsystems, blast radius, languages, config, DB access, public/WCF/REST
     contracts, new projects/DLLs/native/installer files.
   - Match touched paths against this repo's Blast Radius table and task-routing skills
     (activeroles-policy-engine, activeroles-naming-contexts, activeroles-cache-architecture,
     activeroles-dynamic-nodes, activeroles-dynamic-groups, activeroles-native-edb-testing,
     activeroles-nuget-package-upgrade) — pull their documented failure modes in rather than
     re-deriving from scratch.
   - Derive up to ~12 checks per changed area specific to THIS change (e.g. SQL touched →
     Azure-SQL/on-prem parity + migration/rollback + idempotency; new files/DLLs/projects →
     WiX registration + clean install + upgrade-from-previous-version; cache/NC/native/API-contract/
     config-default changes → their specific failure modes per the matching skill).
   - Distribute the relevant checks to each crew role below (a role only reviews checks in its lane;
     don't duplicate another role's mandate).

2. The Crew (specialized reviewer roles — each runs independently in Round 1)

   a) Engineer/Architect Reviewer
      - Correctness & regressions, new bugs, edge cases/missing gaps, architecture & patterns,
        dead code, readability/naming, code quality, PR-description accuracy, linked-work-item
        alignment.

   b) Security Reviewer
      - AuthN/authZ changes, input validation/injection, secrets/config exposure, privilege/ACL
        changes, unsafe deserialization, crypto misuse, new attack surface from contract/API changes.
      - Every finding here defaults to at least "Major" severity unless explicitly justified lower.

   c) Reliability/Blast-Radius Reviewer
      - Blast radius across subsystems, cache/NC/dynamic-node/dynamic-group failure modes per the
        matching skill, performance regressions, rollback/idempotency of any migration or state change.

   d) Packaging & Upgrade Reviewer (only active if files/DLLs/projects added or changed)
      - WiX registration, clean install, upgrade-from-previous-version, Azure-SQL/on-prem parity
        for schema changes. Reports "N/A" if nothing in this lane is touched.

   e) Test Reviewer (only active if tests are present in the diff)
      - Determinism (no time/order/network/random flakiness), hard vs. loose assertions, negative
        tests, real regression coverage, flags uncovered changed lines, proposes stronger assertions.

   Each role's output uses this schema per finding:
     ID (role-prefixed, e.g. SEC-1, ENG-2) · Severity (Blocker/Major/Minor/Nit) · Confidence (High/
     Med/Low) · file:line · Issue · Evidence · Concrete fix.

3. Facilitator — cross-check and risk-weighting (Rounds 2–3)
   Round 2 — Facilitator re-opens the code and every role's findings together:
     - Drop false positives, merge duplicate findings across roles (keep the strictest severity/
       most specific fix), flag explicit disagreements between roles (e.g. Engineer says fine,
       Security says blocker) and state the reasoning for which one governs.
     - Weighting rubric: Security Blocker/Major > Reliability Blocker > Engineer Blocker > any
       Major > Minor > Nit. A single unresolved Security or Reliability Blocker forces
       "approve-ready: no" regardless of other roles' votes.
   Round 3 — Facilitator finalizes the surviving, deduped findings list with severity + confidence
     + file:line + evidence + fix, and writes the final risk-weighted recommendation.

4. Output (written to the Desktop artifacts folder only)
   - Per-role findings tables (raw, pre-dedup) for traceability.
   - Severity × role summary table (post-facilitation).
   - Final deduped findings list.
   - Dedicated Tests section and Packaging/Upgrade section (state "N/A" if not applicable).
   - Facilitator's conflict log: any cases where roles disagreed and how it was resolved.
   - Open questions for me, if any.
   - "approve-ready: yes/no" verdict line with a one-line rationale, at the very end.
   - "Proposed new recurring checks" list to fold into this prompt next time.

Restore the worktree to its original branch/state when done. Do not post, comment, resolve,
approve, commit, or push anything.
