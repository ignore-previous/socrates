# Socrates by Ignore Previous

Socrates helps you plan work that agents will carry out, such as software, research and automation. It brings hidden choices and the way decisions affect each other into view, recommends an option where it can, and goes deeper only on the branches that matter. At the end it restates the plan in its own words and waits for your confirmation before any implementation starts. The skill is the `skills/socrates` folder.

The skill is a folder of instructions and does not open a network connection of its own.

## Install

### Claude Code

Add this repo as a marketplace, then install the plugin from it:

```text
/plugin marketplace add ignore-previous/socrates
/plugin install socrates@ignore-previous
```

The same two steps work from a shell: `claude plugin marketplace add ignore-previous/socrates`, then `claude plugin install socrates@ignore-previous`. Start a new session afterwards so the skill loads. `claude plugin update socrates@ignore-previous` fetches a later version.

Claude Code namespaces plugin skills, so after a marketplace install the slash command is `/socrates:socrates`. The trigger phrases below still work as they are. A manual copy keeps the plain `/socrates`.

### Claude.ai

Zip the skill folder so that `socrates/` is at the top of the zip, for example from a clone of this repo. In Git Bash, macOS or Linux:

```bash
cd skills && zip -r socrates.zip socrates
```

In PowerShell on Windows, from the repo root:

```powershell
Compress-Archive -Path skills\socrates -DestinationPath socrates.zip
```

Do not use GitHub's "Download ZIP" for this. Its top folder is the repo name, not `socrates`.

In Claude.ai open Customize > Skills, choose "+", then "+ Create skill" and "Upload a skill", and pick the zip. Skills need code execution and file creation turned on in your settings. On Team and Enterprise plans an owner can disable user-created skills.

### Codex

In a Codex session, ask the built-in installer to fetch the folder from this repo:

```text
$skill-installer install https://github.com/ignore-previous/socrates/tree/main/skills/socrates
```

Restart Codex if the skill does not appear. To do it by hand, use the manual copy below with `.agents/skills`.

### Manual copy

Clone the repo and copy the skill folder to `.claude/skills/socrates` (Claude Code) or `.agents/skills/socrates` (Codex). Put it in a project for one repo, or under your home directory for all of them. Start a new session afterwards.

```bash
git clone https://github.com/ignore-previous/socrates.git
mkdir -p "${HOME}/.claude/skills"
cp -R socrates/skills/socrates "${HOME}/.claude/skills/socrates"
```

## Triggers

"question me", "Socrates this", "grill me" and "poke holes" start the skill, as does the slash command (`/socrates:socrates` from the marketplace, `/socrates` from a manual copy). It also starts on its own before a non-trivial build, design or config change whose requirements are not settled. It stays quiet for an ordinary code review or a clear implementation request.

Questions come as a numbered list in chat, each with a recommended answer, so you can reply "yes" to accept the recommendations or answer by number. That also works with voice dictation. In a longer interview, Socrates mentions your tool's built-in question prompt once and switches to it if you prefer.

## Before you install

Socrates is meant to replace other grilling or questioning skills. Remove those first, or both will answer to "grill me".

## Check the repo

`npm run check` needs Node.js and nothing else. It confirms the skill's front matter and links, the eval cases, the plugin and marketplace files and their shared version, and the line endings. It does not call a model.

```bash
git fetch origin
npm run check
```

Run `git fetch origin` first: the check also reads the commits on your branch since `origin/main`.

Contributors run `npm run check`. The maintainer runs `npm run check:maintainer`, which adds a check that every commit on the branch uses the project's own author identity.

## How we build this

Socrates is built with AI coding agents (Claude Code and Codex). Every change is reviewed before it ships.

## Licence

MIT. See [LICENSE](LICENSE).

Built with Claude and Grok.
