---
title: review-and-validate
variables:
  - PR_ID: PR link or ID to review and validate
---
This is a two-phase, chained run — Phase 1 (crew review) immediately followed by Phase 2 (comment-triage validation) in this same session, no separate invocation needed. Local, no-post throughout. Never comment, resolve, approve, push, or commit anything to the real PR/repo unless I explicitly ask.

===== PHASE 1: Multi-agent crew review of PR {{PR_ID}} =====

Strict and rigorous, advisory only.

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

4. Phase 1 output (written to <Desktop>\pr-review-<PR-ID>\ only)
   - Per-role findings tables (raw, pre-dedup) for traceability.
   - Severity × role summary table (post-facilitation).
   - Final deduped findings list.
   - Dedicated Tests section and Packaging/Upgrade section (state "N/A" if not applicable).
   - Facilitator's conflict log: any cases where roles disagreed and how it was resolved.
   - Open questions for me, if any.
   - "approve-ready: yes/no" verdict line with a one-line rationale.
   - "Proposed new recurring checks" list to fold into this prompt next time.

Do not post, comment, resolve, approve, commit, or push anything. Do not stop here — continue
straight into Phase 2 below using the findings list you just produced. Do not restore the worktree
branch yet; Phase 2 needs it in the same state.

===== PHASE 2: Comment-triage validation for the same PR =====

Validate-only by default, multi-source review-comment triage (ADO or GitHub — detect platform from
the link/ID, keep ADO and GitHub content clearly separated in all output, never merge them into one
undifferentiated list). Never resolve, reply, comment, push, or commit anything unless I explicitly
ask — replying is supported but only on request.

0. Setup (already done in Phase 1 — do not repeat)
   - You already have the worktree checked out on the PR's branch, and you already have the Final
     deduped findings list from Phase 1 in-session (ID · Severity · Confidence · file:line · Issue ·
     Evidence · Fix) plus the approve-ready verdict — use that directly as "the local review file,"
     no need to re-read it from disk.
   - Additionally now pull all active/unresolved comment threads from the PR's actual platform (ADO
     or GitHub) — this is new in Phase 2. Keep source tagged per finding: local (carrying its
     original ID, e.g. SEC-1, ENG-2), ado-comment, github-comment (+ author/agent if known, since
     teammates use different models/agents).

1. Validator Agent
   - For every finding — from the Phase 1 final findings list AND every active platform comment —
     re-check it against the CURRENT code in the worktree, not just what the finding/comment claims.
   - Assign one verdict per finding:
     valid — confirmed real issue against current code.
     stale-resolved — code has changed since the finding/comment, issue no longer applies.
     false-positive — finding/comment misreads the code, or severity/claim doesn't hold up.
     needs-more-context — can't confirm without info only a human has (design intent, external
       system behavior, product decision).
   - Every verdict needs: file:line, evidence from current code, one-line reasoning. No verdict
     without evidence — this is the main defense against noise from lower-quality models.
   - Carry forward original severity/confidence from the Phase 1 schema where applicable, don't
     discard it.

2. Facilitator/Triage Agent
   - Dedupe across sources: if the Phase 1 review, an ADO comment, and a GitHub comment (or two
     teammates' agents) point at the same root cause, merge into one entry, list all contributing
     sources, keep the strongest evidence.
   - Prioritize: valid findings first (ranked by severity if the source states one), then
     needs-more-context, then note stale/false-positive as resolved-away (so nothing gets lost, but
     it's clear no action is needed).
   - Flag patterns worth attention: e.g., "3 independent sources flagged the same file for
     different reasons" — that's a signal even if each individual comment is weak alone.

3. Phase 2 output (written to <Desktop>\pr-review-<PR-ID>\, alongside the Phase 1 artifacts)
   - Triage table: finding · source(s) · verdict · evidence · priority.
   - Section per verdict bucket (valid / needs-more-context / stale-resolved / false-positive),
     ADO and GitHub findings clearly labeled throughout, local (Phase 1) findings labeled too.
   - Open questions for me (mainly from `needs-more-context`).
   - Summary line: counts per verdict, and top 3 things that need action first.

4. Reply mode (only if I explicitly ask, per finding or in batch)
   - Never triggers automatically — default behavior is steps 1–3 only, nothing posted anywhere.
   - When I ask to reply to specific finding(s):
     - For `valid`: post a short, concrete acknowledgment referencing the fix approach (or note
       it'll be fixed and linked in a follow-up commit/PR — don't promise specifics not yet true).
     - For `stale-resolved`: reply noting the code has since changed and how, so the reviewer can
       verify and resolve on their end (don't resolve their thread myself unless I explicitly say to).
     - For `false-positive`: reply with the specific evidence from current code that shows why it
       doesn't hold, kept factual and non-dismissive.
     - For `needs-more-context`: don't auto-reply — flag it back to me since I'm the missing
       context, unless I've supplied the answer to include in the reply.
   - Show me the exact reply text for confirmation before posting, per comment, unless I say to
     post a whole batch without individual confirmation.
   - Never resolve/close threads unless I explicitly ask, even when posting a reply.

Restore the worktree to its original branch/state when done, unless changes were made per my
request. Do not push, resolve, reply to, comment on, approve, or commit anything beyond what I
explicitly authorize, across both phases.
