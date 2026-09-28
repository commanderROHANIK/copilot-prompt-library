---
title: descriptionwriter
variables:
  - BRANCH_NAME: Branch name the PR description covers
  - PBI_ID: PBI ID, if applicable
  - WI_ID: Work item ID, if applicable
---
/fleet Local by default, generation of a PR description (and commit message cleanup) for the work
done on branch {{BRANCH_NAME}} / PBI {{PBI_ID}} / work item {{WI_ID}}. Drafts the PR description for
review; commit message cleanup is applied directly to local history since it's low-risk and
easily redone. Posting/updating the PR description on ADO/GitHub only happens if I explicitly ask.

0. Setup
   - Work only in the git worktree at Documents\worktrees. `git status` first to confirm state,
     note the current branch to restore later, never force-checkout/force-pull over changes that
     aren't yours.
   - Identify the actual diff to describe: either the full branch diff against its base, or a
     specific range of local commits (e.g. from the execution/fix prompts' commit logs) — ask me
     which if ambiguous.
   - Load context if available: the work item/PBI description and acceptance criteria, the
     planning artifact (<Desktop>\wi-plan-<WI-ID>\), and any execution/fix logs
     (<Desktop>\wi-plan-<WI-ID>\execution-<PBI-ID>\, <Desktop>\pr-review-<PR-ID>\fix-<date>\) if
     this PR is downstream of those prompts.

1. The Crew

   a) Diff Summarizer Agent
      - Read the actual diff, not just commit messages — commit messages can be stale or vague.
      - Summarize dense: what changed, in which files/subsystems, and why (tie back to the work
        item/PBI acceptance criteria where possible).
      - Flag anything in the diff that ISN'T explained by the linked work item (scope creep,
        unrelated cleanup, leftover debug code) — call it out explicitly, don't silently include it
        in the "why" narrative.

   b) Risk/Testing Summarizer Agent
      - From the diff + any test logs available: what was tested, what test coverage was added/
        changed, what risk areas reviewers should focus on (reuse blast-radius reasoning from the
        review prompt if applicable).
      - Note any known gaps: "not tested," "manual verification only," etc. — don't overstate
        confidence.

   c) Commit Message Agent (only if multiple local commits exist)
      - Check each local commit message for clarity/accuracy against what it actually changed.
      - Where a message is misleading, too vague, or doesn't match its diff: rewrite it directly
        (`git commit --amend` / interactive rebase as needed) — no need to ask, this is local
        history you haven't pushed yet and can always be redone.
      - Leave already-clear messages untouched. Log every rename (original → new) so I can see
        what changed.
      - If commits look like they should be squashed (e.g. several "wip" commits), propose it but
        don't do it unless I ask — squashing is a bigger structural change than a message edit.

2. Facilitator — draft assembly
   - Merge the above into one PR description draft, using this shape (adjust headers to match
     ADO/GitHub norms as needed):
     - **What & why** (tied to work item/PBI, dense, no filler)
     - **Changes** (bullet list by area/file, not a restated diff)
     - **Testing** (what was verified, what wasn't, how to verify manually if needed)
     - **Risk/impact** (blast radius, anything reviewers should scrutinize)
     - **Linked work item(s)** (IDs/links)
     - **Flags** (scope creep, unrelated changes, known gaps) — only if any exist, omit section if
       clean.
   - No AI slop: no "This PR improves the overall quality of the codebase" style filler. Every
     line should tell a reviewer something specific.

3. Output (written to <Desktop>\pr-review-<PR-ID>\ or a new <Desktop>\pr-desc-<branch>\ if no PR ID
   yet)
   - Final PR description draft, ready to paste or post.
   - Commit message change log (original → new), already applied to local history.
   - Flags section reasoning, if scope creep/unrelated changes were found, so I can decide whether
     to split the PR before posting.

4. Post/update on ADO/GitHub (only if I explicitly ask)
   - Never triggers automatically — default behavior is steps 1–3 only.
   - When I ask: create the PR (if none exists yet) or update the existing PR's description on the
     correct platform (ADO or GitHub, matching what I specify) with the finalized draft.
   - Show me the final text once more immediately before posting/updating, so I can catch anything
     last-minute.
   - Never touch anything else on the PR (labels, reviewers, status, comments) unless I separately
     ask.

Do not push local commits, create/update a PR, or touch ADO/GitHub in any way beyond step 4, and
only when explicitly asked.
