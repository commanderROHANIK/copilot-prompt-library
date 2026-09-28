---
title: fix-review
variables:
  - PR_ID: PR link or ID (ADO or GitHub)
---
/fleet Local-only fix of validated findings, reply/push only when explicitly asked. Consumes the
triage output from the comment-validation prompt at <Desktop>\pr-review-<PR-ID>\ (or
<Desktop>\wi-plan-<WI-ID>\ triage file if that's where it lives — ask me if not found). PR
{{PR_ID}} may be ADO or GitHub — detect platform, keep replies on the correct platform, never
mix them up.

0. Setup
   - Work only in the git worktree at Documents\worktrees. `git status` first to confirm it's
     clean, note the current branch to restore later, never force-checkout/force-pull over changes
     that aren't yours. Check out the branch this PR is on.
   - Load the triage output: the `valid` findings specifically (ID, source(s), file:line, evidence,
     fix, priority). Ignore `stale-resolved`/`false-positive`/`needs-more-context` findings for
     fixing — those are handled by reply-only logic in step 4, not code changes.
   - Create <Desktop>\pr-review-<PR-ID>\fix-<date>\ for logs. Code changes happen in the worktree
     as local commits, same as the execution prompt. No pushing, no replying, no resolving until I
     explicitly ask.

1. Readiness check
   - Confirm the `valid` findings still hold against current code (code may have moved since
     triage ran) — if a finding no longer applies, flag it and skip it rather than fixing a
     non-issue.
   - Confirm nothing about fixing one finding conflicts with another queued finding (e.g. two fixes
     touching the same lines) — sequence to avoid stepping on each other.

2. The Crew

   a) Fix Sequencer Agent
      - Order the `valid` findings into concrete fix steps: which file, what change, dependency
        order if any fix must land before another.
      - One fix = one local commit, message referencing the finding ID and PR
        (e.g. "Fix SEC-1: validate input on X endpoint (PR #123)").

   b) Test/Validation Agent
      - For each fix: what test proves the issue is resolved (existing test updated, or new test
        added). Run it, confirm pass before moving to the next fix.
      - Flag any fix where no test can reasonably verify it (e.g. pure readability/naming) — note
        "verified by inspection" instead of skipping verification silently.

   c) Reply Drafting Agent
      - For each `valid` finding fixed: draft a short, factual reply for the corresponding
        ADO/GitHub thread — what was changed, referencing the local commit, no vague "fixed it"
        language.
      - For `stale-resolved`/`false-positive` findings still open on the platform (from the
        validation pass): draft the corresponding reply per the validation prompt's Reply mode
        rules (factual, evidence-based, non-dismissive).
      - Do not draft replies for `needs-more-context` — those need my input first.

3. Cross-check (Round 2)
   - Re-run fixes against a different model: confirm each fix actually addresses the finding's
     evidence, doesn't introduce a regression, and matches the original review's suggested fix
     (or explain why it deviates).
   - Merge/resolve any disagreement explicitly.

4. Reply + resolve (only if I explicitly ask, per finding or in batch)
   - Never triggers automatically. Default behavior is steps 1–3 only: local commits + drafted
     (unsent) replies.
   - When I ask to proceed:
     - Show each drafted reply for confirmation before posting, unless I say to post a whole batch
       without individual confirmation.
     - Post the reply, then resolve that specific thread — never resolve without having replied.
     - Push local commits only when I explicitly say so, separate from the reply/resolve step (I
       may want to review the local diff before pushing even after replies are drafted).

5. Output
   - Local commit log: finding ID → commit → test run/result.
   - Drafted replies per finding, clearly marked sent/unsent.
   - Any findings skipped (no longer valid, conflicting, or needs-more-context) with reasoning.
   - Explicit status line: "N commits made locally, nothing pushed. N replies drafted, nothing
     posted. Say push / say post to proceed."

Restore the worktree to its original branch/state only if no changes were made. Never push, post,
reply, resolve, comment, or approve anything beyond what I explicitly authorize.
