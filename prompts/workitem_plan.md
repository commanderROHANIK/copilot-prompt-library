---
title: workitem_plan
variables:
  - WI_ID: Work item ID or URL to plan
---
/fleet Local, no-post, multi-agent planning pass on work item {{WI_ID}}. Advisory only —
never commit, post, comment, resolve, or create/edit anything in ADO unless explicitly asked.

0. Setup
   - Work only in the git worktree at Documents\worktrees. It's shared with other people:
     `git status` first to confirm it's clean, note the current branch to restore later, never
     force-checkout/force-pull over changes that aren't yours.
   - Check out whatever branch is relevant (the base branch the new work will build on — usually
     the target branch of linked PRs, or main/develop if none). If unclear, ask me.
   - Create <Desktop>\wi-plan-<WI-ID>\ for all artifacts (context notes, per-agent plans, final PBI
     list). Nothing is written outside this folder or posted anywhere.

1. Context gathering (single pass, shared across all agents below)
   - Pull the work item: description, acceptance criteria, comments, attachments, linked work items
     (parent/children/related), linked PRs and their diffs/commits, and any linked feature/epic.
   - Read through everything before planning — comments and PR discussions often contain decisions
     or constraints not in the main description.
   - Cross-reference linked PRs against the actual repo state in the worktree: confirm what's
     already merged vs. still open vs. stale, so the plan reflects current reality, not stale PR
     descriptions.
   - Summarize dense: what's actually being asked, what's already decided, what's still open/
     ambiguous, what prior/linked PRs already cover vs. what's left.
   - If anything critical is missing or contradictory (no acceptance criteria, conflicting comments,
     unlinked dependency implied but not attached), ask me before proceeding.

2. The Crew (specialized planning sub-agents — run against the shared context from step 1, with
   read access to the codebase in the worktree)

   a) Scope/Requirements Agent
      - Nail down in/out of scope from the acceptance criteria + comments.
      - Flag ambiguities or missing acceptance criteria as open questions, don't guess.
      - Identify hard dependencies on other work items/features/PRs already linked.

   b) Technical Breakdown Agent
      - Explore the actual codebase for the areas this work item touches — don't plan blind.
        Confirm current structure/patterns before proposing PBIs against them.
      - Break the in-scope work into concrete PBIs, sequenced by dependency.
      - Each PBI: short, actionable title + 2-4 bullet action points, referencing real files/
        modules/subsystems found in the worktree where relevant. No filler, no AI slop, no
        restating the obvious — dense and information-oriented only.
      - Note which touched subsystems/areas each PBI hits (use this repo's blast-radius table /
        task-routing skills if available, same as the review prompt).

   c) Risk/Validation Agent
      - For each PBI from (b): what could go wrong given the actual current code (not assumed),
        what needs test coverage, any rollout/rollback concern, any unknown that needs a spike
        before estimation.
      - Flag PBIs that are actually too big / should be split further, or too vague to estimate.

3. Cross-model validation (Round 2)
   - Re-run the Technical Breakdown and Risk agents' output through a different model to challenge:
     missing PBIs, duplicate/overlapping PBIs, unrealistic sequencing, unclear acceptance criteria
     per PBI, and PBIs that don't actually match what's in the codebase.
   - Merge: drop redundant PBIs, tighten wording, resolve any disagreement between models explicitly
     (state which view won and why).

4. Facilitator — final merge (Round 3)
   - Reconcile Scope, Technical, and Risk agents' output into one final PBI list, in execution
     order, with dependencies marked.
   - Cut anything that's not action/information-dense — if a bullet doesn't tell someone what to do
     or what to watch for, cut it.
   - Sanity-check total scope against the parent work item — no gaps, no scope creep beyond what
     comments/acceptance criteria support.

5. Output (written to the Desktop artifacts folder only)
   - Context summary (short).
   - Final PBI list: title + action bullets + dependencies + risk/test notes per PBI, with real
     file/module references from the worktree where applicable.
   - Open questions for me, if any.
   - Explicit note on anything cut for being redundant, out of scope, or too vague to plan yet.

Restore the worktree to its original branch/state when done. Do not commit, post, comment, resolve,
or create anything in ADO unless I explicitly ask.
