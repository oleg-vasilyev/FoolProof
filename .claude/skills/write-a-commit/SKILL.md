---
name: write-a-commit
description: Write a commit message or a release message in this repository's voice — the title, the body that explains why the previous shape was wrong, the gate numbers a phase-final commit carries, and the exact npm version command a release uses. Use before any commit, and before cutting a release tag.
---

# Writing a commit message

Two kinds exist here, and nothing else: a **working commit** on `main`, and a
**release** made by `npm version`. Both are prose in the project's voice — no
conventional-commit prefixes, no scopes, no bullet-list changelogs, no file
lists. The diff already says *what* changed; a message that repeats it has
wasted the reader's one visit.

## The working commit

**Title:** one imperative sentence about behaviour, written for the person the
change serves — a player, the operator, a future reader. It survives being read
alone in `git log --oneline`.

- `Count the chats, not just the games, and lock the report to one reader`
- `Say where the two numbers about the site are read`

Not: `Update status handler`, `feat(diagnostics): add chat summary`, `Fix
tests`. A title that names files or layers has already failed — name what the
bot now does differently.

**Body:** paragraphs, not bullets. Its one obligation is the thing a diff
cannot show — **why the previous shape was wrong**, and what was decided along
the way: the alternative rejected, the constraint that forced the shape, the
number that was measured rather than guessed. Write it the way the README is
written: plain claims, each carrying its reason.

**A phase-final commit carries the gate numbers** — test count, coverage,
mutation score, e2e result — so a later regression has something to be compared
against. A mutation survivor left alive on purpose gets its sentence here too.

**Trailer, always the last line:**

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## The release

A release is `npm version` with `-m`, so the commit and the tag carry the same
message; `%s` becomes the version:

```bash
npm version minor -m "Release %s

A minor: <one paragraph — what this tag gives the player or the operator,
in plain words, no gate numbers, no file names>.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push --follow-tags
```

The title is always `Release X.Y.Z`. The body opens by naming the bump — `A
minor:`, `A patch:` — and says what somebody running the previous version gets
by taking this one. Gate numbers stay in the phase commits underneath; the
release message is the shop window, not the ledger. Patch versus minor is the
Bot API user's view: new commands or screens are a minor, a fix to existing
behaviour is a patch.

## Judging one before it lands

1. Could the title be pasted into `/help` as a claim about the bot? If it only
   makes sense to somebody holding the diff, rewrite it.
2. Does the body say anything the diff does not? If not, it is missing its
   reason for existing.
3. Would the numbers in a phase-final commit let a reader two months from now
   notice a regression? Absent numbers are a gap, not a style choice.
