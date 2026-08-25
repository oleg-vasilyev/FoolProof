---
name: write-a-commit
description: Write a commit message or a release message in this repository's voice — the title, the body that explains why the previous shape was wrong, the gate numbers a phase-final commit carries, and the exact npm version command a release uses. Use before any commit, and before cutting a release tag.
---

# Writing a commit message

> **Stage 7** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

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

**A phase-final commit ends with the Gates paragraph**, in one fixed shape, so
two phases can be compared without re-parsing prose. The history holds this
paragraph in three different layouts; this one wins because it is the tersest
that still shows a regression at a glance:

```
Gates: check:phase green — <N> tests in <M> files, coverage <st>/<br>/<fn>/<ln>,
mutation <score>% over <the diff | everything>, e2e <N> cases in <M> files.
Copy: <what was read and when, or why nothing was>.
Gallery: <one specific claim about what was seen, or why it stayed shut>.
Review: <N> findings, <their fate in a clause>.
Retro: <the counted answers that were not none> → <the file each default landed in>,
or that the phase went straight and had nothing to count.
Tag: <the version, or that this rides the next one and why>.
```

Four rules inside it. Every gate is named even when skipped — a skipped gate
carries its reason (`gallery not opened: no SVG changed`), never silence.

**The `Retro:` line is here because this paragraph is the only thing that asks.**
Gates 1 to 5 are pulled in by the work: nothing ships without compiling, passing
and being reviewed. The retrospective is the one gate whose whole value goes to the
*next* phase, so this phase never needs it and never notices its absence. The
proof is a phase that skipped it: the same paragraph, lacking a retro line but
carrying a gallery one, produced a written verdict on the gallery — "not opened, no
renderer changed" — and total silence about the retrospective. The template asked
about one and not the other, and that alone decided which happened.

**And it carries counts because the same failure works one level down.** The
retrospective asks six questions; a single slot took one verdict, so five of them
could go unanswered and the line still read as finished. It compresses the block
`retrospective` produces — it may not report a verdict that block never reached, and
a phase whose answers were all `none` says that rather than staying quiet.
Coverage is four numbers in statements/branches/functions/lines order. A
mutation survivor left alive on purpose gets its own sentence after the
paragraph, naming the mutant and why its death is not worth buying.

**Trailer, always the last line:**

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

The model name in the trailer is whichever Claude actually wrote the commit.

## The release

**Not every phase gets one** — `finish-phase` has the test and the reason. When it
says no, the phase still ends in the working commit above; there is simply no `npm
version` after it, and the `Tag:` line says which tag will carry the work instead.

A release starts from a green `main`: after pushing the phase commits, wait for
the push CI (`gh run watch --exit-status`, about a minute) and fix a red
`check:push` before cutting anything — a tag must not point at a commit the
site is already failing on.

A release is `npm version` with `-m`, so the commit and the tag carry the same
message; `%s` becomes the version:

```bash
npm version minor -m "Release %s

A minor: <one paragraph — what this tag gives the player or the operator,
in plain words, no gate numbers, no file names>.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
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
