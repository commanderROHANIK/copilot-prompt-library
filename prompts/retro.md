---
title: retro
variables:
  - WI_ID: Completed work item ID
  - PBI_ID: Completed PBI ID
  - PR_ID: Completed PR ID or URL
---
/fleet Local, no-post retro for completed work item {{WI_ID}} / PBI {{PBI_ID}} / PR {{PR_ID}}.
Compares what was planned vs. what actually happened, to improve the review/plan/execute prompts
over time. Advisory only — writes a retro file locally, never posts/comments/updates anything on
ADO/GitHub.

0. Setup
   - Work only in the git worktree at Documents\worktrees, if code inspection is needed beyond the
     merged diff. `git status` first, note current branch to restore later, never
     force-checkout/force-pull over changes that aren't yours.
   - Gather every artifact this PBI/work item produced across the pipeline, whatever exists:
     - Planning: <Desktop>\wi-plan-<WI-ID>\ (PBI list, scope/risk notes, open questions)
     - Execution: <Desktop>\wi-plan-<WI-ID>\execution-<PBI-ID>\ (step order, commit log, deviations
       noted during implementation)
     - Review: <Desktop>\pr-review-<PR-ID>\ (findings, approve-ready verdict, conflict log)
     - Fix/reply: <Desktop>\pr-review-<PR-ID>\fix-<date>\ (findings fixed, replies sent)
     - PR description: <Desktop>\pr-desc-<branch>\ or the equivalent under pr-review folder.
   - If a stage's artifacts don't exist (e.g. no formal planning pass was run), note that as a gap,
     don't fabricate what would have been in it.
   - Create <Desktop>\retro-<WI-ID>\ for the retro output.

1. The Crew

   a) Plan-vs-Actual Agent
      - Compare the planning artifact's PBI list/scope against what was actually implemented
        (execution logs, final commits, final diff).
      - Flag: scope that was planned but not delivered, scope that was delivered but not planned
        (creep), PBIs that were split/merged/reordered from the original plan, and why (deviation
        notes from execution should explain most of this — flag any unexplained gaps).

   b) Review-Findings Agent
      - Compare the review pass's findings (severity, category) against the fix/reply logs: what
        was actually fixed vs. dismissed as false-positive/stale, and whether those calls held up
        (e.g. re-check any "false-positive" verdict was actually correct, not just convenient).
      - Identify recurring finding categories (e.g. repeated security findings in the same
        subsystem across PBIs) — these are candidates for the review prompt's "proposed new
        recurring checks" list.

   c) Process/Estimate Agent
      - From execution logs: how many steps/commits did it take vs. what the plan implied, how
        many times did the plan need adjusting mid-execution, how many round-trips on review
        findings before approve-ready.
      - Note any bottleneck: repeated back-and-forth on the same finding, a blocker that stalled
        execution, an open question from planning that was never actually answered before work
        started anyway.

2. Facilitator — synthesis
   - Merge the three agents' output into one retro, don't just concatenate their raw notes.
   - Prioritize actionable takeaways over narrative: every point should either (a) propose a
     specific addition to one of the pipeline prompts (review/plan/execute/validate), or (b) flag a
     one-off circumstance that doesn't need a process change.
   - Explicitly separate "systemic, worth changing the prompts for" from "one-off, not worth
     generalizing."

3. Output (written to <Desktop>\retro-<WI-ID>\)
   - Scope drift summary: planned vs. delivered, with reasoning.
   - Review-accuracy summary: findings that held up vs. didn't, recurring categories.
   - Process summary: friction points, estimate accuracy, unresolved-but-proceeded questions.
   - "Proposed prompt changes" list, mapped to which prompt each change belongs to (review / plan /
     execute / validate / this retro prompt itself) — written so they can be pasted directly into
     that prompt's "recurring checks" or equivalent section.
   - Gaps noted: any stage whose artifacts were missing/incomplete, so retro coverage itself
     improves next time.

Do not post, comment, update, or modify anything on ADO/GitHub. This is a local, backward-looking
summary only.
