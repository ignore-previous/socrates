# Evals

Each folder under `evals/` is one case. `case.yaml` holds the prompt, an optional `fixture`, and `expect` fields a person can score. `npm run check` confirms the skill and the cases are well formed. It does not call a model.

## How a model run would go

1. Install the skill into Claude Code or Codex, as the README describes.
2. Start a new session in an empty directory. One case per session.
3. When the case has a `fixture`, copy the contents of that folder into the directory.
4. Send `prompt` as the user message.
5. If the case has `reply`, send that text as the next user message after the agent answers. Score that turn as well.
6. Score the session against every field under `expect`. A pass meets all of them.

This package has no runner and does not call a network API.

## What we should measure

Real sessions come first. The structural check only confirms the cases are well formed.

- Did Socrates find consequential omissions and cover the material branches?
- Did it follow dependencies between decisions and apply answers correctly?
- Did it revise a recommendation only for good reasons?
- Did it respect delegation and produce a useful handoff?
- Was the effort worth it for the task?
- Compare with grilling and a normal assistant where practical.

An interview that is pleasant but leaves substantial rework on the user's intent has not succeeded. Question count is descriptive, not the score.
