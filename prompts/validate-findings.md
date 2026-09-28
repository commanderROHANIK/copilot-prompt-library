---
title: validate-findings
variables:
  - PR_ID: PR link or ID (ADO or GitHub)
---
/fleet Local, validate-only by default, multi-source review-comment triage for PR {{PR_ID}}
(ADO or GitHub — detect platform from the link/ID, keep ADO and GitHub content clearly separated
in all output, never merge them into one undifferentiated list). Never resolve, reply, comment,
push, or commit anything unless I explicitly ask — replying is supported but only on request.

0. Setup

Work only in the git worktree at Documents\worktrees. git status first to confirm it's clean, note the current branch to restore later, never force-checkout/force-pull over changes that aren't yours. Check out the branch this PR is on.
Load my local review file from \pr-review-\ — specifically the Final deduped findings list (ID · Severity · Confidence · file:line · Issue · Evidence · Fix) and the approve-ready verdict. If the folder/file isn't found, ask me for the path rather than assuming it doesn't exist.
Pull all active/unresolved comment threads from the PR's actual platform (ADO or GitHub). Keep source tagged per finding: local (carrying its original ID, e.g. SEC-1, ENG-2), ado-comment, github-comment (+ author/agent if known, since teammates use different models/agents).

1. Validator Agent

For every finding — from the local final findings list AND every active platform comment — re-check it against the CURRENT code in the worktree, not just what the finding/comment claims. Note: local findings already went through a facilitator once, but code may have moved on since that review ran, so re-validate them too, not just the raw platform comments.
Assign one verdict per finding:
valid — confirmed real issue against current code.
stale-resolved — code has changed since the finding/comment, issue no longer applies.
false-positive — finding/comment misreads the code, or severity/claim doesn't hold up.
needs-more-context — can't confirm without info only a human has (design intent, external system behavior, product decision).
Every verdict needs: file:line, evidence from current code, one-line reasoning. No verdict without evidence — this is the main defense against noise from lower-quality models.
Carry forward original severity/confidence from the local review's schema where applicable, don't discard it.

2. Facilitator/Triage Agent
   - Dedupe across sources: if local review, an ADO comment, and a GitHub comment (or two
     teammates' agents) point at the same root cause, merge into one entry, list all contributing
     sources, keep the strongest evidence.
   - Prioritize: valid findings first (ranked by severity if the source states one), then
     needs-more-context, then note stale/false-positive as resolved-away (so nothing gets lost, but
     it's clear no action is needed).
   - Flag patterns worth attention: e.g., "3 independent sources flagged the same file for
     different reasons" — that's a signal even if each individual comment is weak alone.

3. Output (written to the local review folder, alongside my existing artifacts)
   - Triage table: finding · source(s) · verdict · evidence · priority.
   - Section per verdict bucket (valid / needs-more-context / stale-resolved / false-positive),
     ADO and GitHub findings clearly labeled throughout, local findings labeled too.
   - Open questions for me (mainly from `needs-more-context`).
   - Summary line: counts per verdict, and top 3 things that need action first.

4. Reply mode (only if I explicitly ask, per finding or in batch)
   - Never triggers automatically — default behavior is step 1–3 only, nothing posted anywhere.
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
request. Do not push, resolve, or reply to anything beyond what I explicitly authorize.
