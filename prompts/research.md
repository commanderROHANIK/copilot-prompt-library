---
title: research
variables:
  - TOPIC: Research topic
  - GOAL: Research goal
  - BRANCH_NAME: Branch to research from
---
/fleet Local, no-post architecture research on topic {{TOPIC}}, goal: {{GOAL}}, branch {{BRANCH_NAME}}.
Produces a detailed research report + a separate executive summary for the arch team. Advisory
only — writes locally, never posts/edits the wiki or ADO unless explicitly asked.

0. Clarify before starting
   - Ask upfront questions to sharpen the goal — not a fixed checklist, adapt to the topic, but
     always cover at minimum: what's explicitly out of scope, whether this feeds a specific
     decision/deadline or is exploratory, any known prior research/RFC/wiki page to build on
     instead of re-deriving, and anything the arch team already assumes/disagrees on about this
     topic that should be addressed directly.
   - Do not proceed to research until these are answered or I confirm defaults are fine.

1. Setup
   - Work only in the git worktree at Documents\worktrees. `git status` first to confirm it's
     clean, note the current branch to restore later, never force-checkout/force-pull over changes
     that aren't yours. Check out {{BRANCH_NAME}}.
   - Create <Desktop>\research-<topic-slug>\ for all artifacts (notes, sources, final report,
     exec summary).

2. Gather (shared context for all agents below)
   - Search the codebase on the given branch for everything relevant to the topic: architecture,
     patterns, existing implementations, related subsystems.
   - Search the ADO wiki for related pages, prior decisions, RFCs, diagrams.
   - Pull relevant linked work items/PRs if they surface prior discussion or decisions on this
     topic.
   - Track every source as you go — file:line, wiki page + section, PR/WI number — nothing goes
     into the report without a traceable citation.

3. The Crew

   a) Current-State Agent
      - Document what actually exists today: architecture, code, and what the wiki claims.
      - Explicitly flag discrepancies between wiki documentation and real code — keep these as a
        clearly separated "docs vs. reality" list, not folded into the main narrative.
      - Cite everything: file:line or wiki page per claim.

   b) Options/Tradeoffs Agent
      - Given the goal, lay out the realistic approaches/options, with pros/cons and feasibility
        against the current architecture from (a).
      - Present neutrally — do not recommend one over another unless I explicitly ask for a
        recommendation. State tradeoffs, not conclusions.
      - Cite sources for any claim about feasibility/precedent (existing code doing something
        similar, a wiki page describing a constraint, etc.).

   c) Risk/Constraints Agent
      - Org-specific constraints (compliance, other teams' dependencies, known limitations),
        risks per option from (b), unknowns that would need a spike before committing to a
        direction.
      - Cite sources.

4. Facilitator — synthesis (with cross-model validation)
   - Merge (a)(b)(c) into one coherent research report. Resolve overlaps/contradictions between
     agents explicitly (state which source wins and why).
   - Cross-check: re-run the synthesized claims through a different model to challenge weak
     citations, unsupported claims, missed options, or claims that don't actually match the cited
     source. Fix or flag anything that doesn't hold up.
   - Compile the "docs vs. reality" discrepancies into a separate **Follow-up Ideas** section —
     keep this clearly apart from the two main required outputs, it's a bonus, not core scope.

5. Output (written to <Desktop>\research-<topic-slug>\, two separate files)

   a) Full research report (research-paper style)
      - Goal & scope (from step 0's clarified answers).
      - Current state (with docs-vs-reality flags).
      - Options & tradeoffs.
      - Risks & constraints.
      - Citations/references throughout — every claim traceable to file:line, wiki page, or
        WI/PR number.
      - Open questions still unresolved.

   b) Executive summary (2-pager, for the arch team)
      - Goal, key findings, options at a glance, top risks — dense, no filler.
      - No citations/references — this is the readable digest, not the traceable version.
      - No recommendation unless explicitly asked for one.

   c) Follow-up ideas (separate section/file, not part of a/b)
      - Docs-vs-reality discrepancies worth fixing.
      - Any tangential findings worth a future research pass.

Restore the worktree to its original branch/state when done. Do not post, edit, or comment on the
wiki, ADO, or anywhere else unless I explicitly ask.
