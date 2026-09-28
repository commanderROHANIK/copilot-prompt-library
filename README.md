# Copilot Prompt Library

A GitHub Copilot extension for saving, versioning and reusing prompts that contain `{{VARIABLE}}`
placeholders. It gives you chat tools and a **Prompt Library** canvas panel, and it works in every
chat and project session.

## Install

Clone into your Copilot user extensions folder. The folder name becomes the extension id.

```powershell
git clone https://github.com/commanderROHANIK/copilot-prompt-library "$env:USERPROFILE\.copilot\extensions\prompt-library"
```

Start a new chat, or run `/clear` in an existing one. Extensions load when a session starts. You
don't need npm or any build step, because the Copilot runtime provides the SDK.

## Use

Ask in plain language in any chat:

| Say | What happens |
|---|---|
| "open the prompt library" | Opens the canvas: browse, search, edit, **Copy**, **Insert into this chat** |
| "list my prompts" | `promptlib_list` |
| "run review-pr for PR 1234" | Fills in `{{PR_ID}}` and runs the prompt in the current chat |
| "run ai-review2 for PRs 1234, 1240, 1251 in parallel" | Fills in the prompt once per PR and starts **one session per PR** |
| "save this as a prompt called X" | `promptlib_save`, with `{{VAR}}` names detected automatically |

To run the same prompt against several targets at once, ask for it in chat, as in the parallel
example above. Automations/Workflows can't run two copies of the same workflow at the same time.

Tools: `promptlib_list`, `promptlib_get`, `promptlib_save`, `promptlib_delete`, `promptlib_render`.
If a `{{VAR}}` has no value, `promptlib_render` leaves the placeholder in the text and lists it.

## Prompt files

Each prompt is one file, `prompts/<id>.md`. You can edit these files by hand.

```markdown
---
title: review-pr
variables:
  - PR_ID: PR link or ID to review
---
Review PR {{PR_ID}} ...
```

- Placeholder names are upper case: `{{PR_ID}}`, `{{WI_ID}}`, `{{BRANCH_NAME}}`.
- Anything in `<angle brackets>` is plain text that the agent works out while running. It isn't
  filled in beforehand.

## Versioning

Edits made from chat or the canvas write straight to `prompts/` inside this clone. Commit and push
them as with any repo:

```powershell
cd "$env:USERPROFILE\.copilot\extensions\prompt-library"
git add prompts; git commit -m "Update review prompts"; git push
```

On a new machine, clone again (see Install) to get the same prompts.

## Notes

- The canvas runs a local HTTP server on `127.0.0.1` with a random port, one per chat.
  **Insert into this chat** sends the prompt immediately. **Copy** does not send anything.
- The canvas API in the Copilot SDK is marked experimental and may change in future Copilot
  releases.
