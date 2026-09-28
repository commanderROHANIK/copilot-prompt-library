---
title: start-work
variables:
  - WI_ID: Work item ID or URL
  - PBI_ID: PBI ID to execute
---
/fleet Local-only execution of work item {{WI_ID}}, PBI {{PBI_ID}} (from the prior planning
pass at <Desktop>\wi-plan-<WI-ID>\ if it exists). Make real code changes in the worktree and local
commits for review. Never push, post, comment, resolve, or touch ADO/remote in any way unless I
explicitly ask.

0. Setup
   - Work only in the git worktree at Documents\worktrees. It's shared with other people:
     `git status` first to confirm it's clean, note the current branch to restore later, never
     force-checkout/force-pull over changes that aren't yours. Check out the branch this PBI
     builds on.
   - Create <Desktop>\wi-plan-<WI-ID>\execution-<PBI-ID>\ for notes/logs only (not code). Code
     changes go in the worktree itself, as local commits.
   - Load the existing plan artifact for this PBI if present (title, action bullets, dependencies,
     risk/test notes). If no prior plan artifact exists, pull the PBI/work item directly
     (description, comments, linked items) — flag that you're doing so, since normally this
     should chain off the planning pass.

1. Readiness check (before touching any code)
   - Confirm all dependencies this PBI's plan flagged are actually satisfied now: are blocking
     PRs merged, are prerequisite PBIs done, is anything the plan assumed still true in the current
     code.
   - Confirm branch/worktree state matches what the PBI expects to build on.
   - If anything's not ready (unmerged dependency, stale assumption, unresolved open question from
     planning), stop and ask me before making changes.

2. The Crew (execution-oriented sub-agents, with read/write access to the worktree)

   a) Implementation Sequencer Agent
      - Turn the PBI's action bullets into ordered, concrete dev steps: files/modules to touch,
        order, what depends on what within the PBI.
      - Confirm referenced files/functions exist as described in the plan; flag if the plan's
        assumptions no longer hold.

   b) Test/Validation Agent
      - For each step: what to test/run to verify it before moving to the next step.
      - Identify existing tests covering the touched area vs. new tests needed; write/update tests
        as part of the step, not as an afterthought.

   c) Readiness/Blocker Agent
      - Re-check for anything that'd stop execution: missing access/tooling, unmerged dependency
        PR, unresolved question from planning, a risk flagged earlier that was never answered.
      - Carry forward any open questions from the original plan that are still open.

3. Cross-model validation of the plan (Round 2, before writing code)
   - Re-run the Sequencer and Test agents' output through a different model to challenge: wrong
     step order, missing steps, steps that don't match the real code, missing test coverage.
   - Merge: drop redundant/incorrect steps, tighten wording, state explicitly where models
     disagreed and which view won and why.
   - Confirm final step order with a short summary before starting implementation. If any step
     looks risky/ambiguous, ask me first.

4. Implementation (execute step by step, locally)
   - For each step in the finalized order:
     - Make the code change.
     - Run/add the tests identified for that step; confirm they pass before moving on.
     - Make one local commit per step (small, reviewable, clear message referencing the PBI and
       step, e.g. "PBI-<ID> step 2: <what>"). No pushing.
     - If a step reveals the plan was wrong (file doesn't exist, approach doesn't work), stop,
       adjust, and note the deviation rather than silently going off-plan.
   - Do not squash/rewrite history without asking. Do not touch remotes at all.

5. Wrap-up
   - Summarize what was implemented: steps completed, files touched, tests added/run, local commits
     made (short log), and anything deviated from the original plan and why.
   - List any blockers/open questions still unresolved.
   - Explicit statement: "all changes are local commits on <branch> — nothing pushed or posted to
     ADO. Say the word to push/post."
   - Restore nothing — the worktree now has the real local commits; just confirm current branch/
     state so I know where things stand.

Never push, post, comment, resolve, or modify anything on ADO or the remote repo unless I
explicitly ask.
