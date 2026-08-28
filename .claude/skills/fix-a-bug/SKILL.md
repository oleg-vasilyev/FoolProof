---
name: fix-a-bug
description: Fix something FoolProof already does wrong — reproducing it before reading any code, turning that reproduction into a test that fails first, proving a cause instead of guessing at one, and sweeping for the same shape elsewhere. It is drawn at stages 1, 2 and 3, because a fault can arrive while framing, while writing, or out of a red gate — use when the owner reports the bot getting something wrong, when a checkup finding becomes the next phase, when a gate goes red for a reason its own message does not explain, and when a fault turns up in passing during work that came for something else.
---

# Fixing something that already went wrong

> **Stages 1, 2 and 3** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

**Nobody hands you this skill.** The owner says what should be different, not which
kind of work it is — and most of the ways in here never reach an owner at all. Reading
a request as a fault rather than as something not built yet is yours, before this opens.

Every other skill here is written for work that is **new**: it starts from what
somebody wants and ends at a gate. A fault starts from the other end — the thing
already exists, already passed every gate, and shipped anyway. So the expensive
question is never *how do I fix it*. It is **what is actually true**, and every rule
below buys an answer to that before any code is touched.

The output is a diff like any other, and it replaces no gate. Reproducing and sweeping
frame the phase; the failing test is the first thing **built**, so this joins at stage 2.

## Reproduce before you read the code

Reading the code first produces a theory, and then the code confirms it — because
you are now reading with an answer in hand. What that finds is *a* fault, plausibly
shaped, sitting near the real one. Reproduce first and the code is read against
something that cannot be talked out of its position.

**The reproduction is the smallest input that still shows it.** Shrinking it is not
tidiness: each thing removed that does not stop the fault is a thing proven
irrelevant, and what is left when nothing more can go is very close to the cause.

**Reproduce on the platform it happened on.** A fault reproduced somewhere else is a
different fault wearing the same description. Both times a lock file has broken this
project, every local gate was green and only the Linux runner failed — the machine
was the variable, and no amount of reading on Windows would have shown it. When the
platform cannot be reached, say that the reproduction is partial rather than
treating the local run as one.

**Being unable to reproduce it is a finding, and it is reported as one.** It is
never a licence to fix the most suspicious-looking line: a fix with no reproduction
behind it cannot be shown to have worked, so it buys nothing but the feeling of
having acted. If the report came from a real chat, the evening it happened in can
be read back — `node scripts/tools.ts evening <chat id>`, under gate 3a of
`finish-phase`, which is also where the rule about snapshotting the database lives.

## The failing test is the reproduction, made permanent

**Write it before the fix, and watch it fail.** A test written afterwards is written
against code that already works, so it asserts what the code does rather than what
the bug was — and it passes on the first run, which proves only that it was aimed at
whatever it was pointed at. Watching it go red first is the only moment that proves
it can see the fault at all.

**Read the failure message, not just the colour.** A test that fails for a second,
unrelated reason is green light with extra steps: it will pass once the fix lands
and would have passed with no fix at all.

**Put it at the layer where the fault is still visible as data.** This is the rule
that decides whether the test is worth anything. A ten-player e2e scenario stayed
green through the entire life of the truncation bug it was later used to describe,
because a scenario holds a rasterized PNG and can only assert that a picture arrived,
how wide it is, and that it fits — the truncation lived in the SVG, where it is still
a string, and only a spec holding that string could ever have caught it. Ask what
form the fault takes before choosing a file to put the test in; `write-a-spec` has
the rest, and it applies here unchanged.

## Proving a cause

**Measure before the third hypothesis.** Two guesses is thinking; a third means the
search has no ground under it, and the way out is an experiment rather than a better
guess. Stryker's worker count was argued twice and settled by one run at each
setting, in [running the mutation
gate](../finish-phase/running-the-mutation-gate.md).

**A number out of an instrument nobody has proven is not a measurement.** The first
output of a new check, a new script, a new query is a claim about the instrument
before it is a claim about the code. One written here to ask whether every
`TECH-DEBT.md` entry names a trigger reported thirteen entries missing one, and the
number went to the owner as a finding; the file was in fact clean, and the check had
never been shown a trigger phrased *if*, *the next time* or *with the next phase
that*. Calibrate against cases whose answer you already know before quoting it, and
when it does cry wolf, widen its vocabulary rather than rewording its subject to
suit it.

**A gate that stays green proves nothing about a fault it cannot see.** When the
theory is that some check should have caught this, break the thing deliberately and
watch it go red — the probe goes in through an edit, and the proof is the output,
not the intention. Breaking today's file only proves the rule fires on today's file,
which is the easy half; the probe that matters changes the **shape** of what the rule
reads — reorder, rename, leave a field out, hand it a format it has never seen. A
rule written to catch silent failures failed silently in its first hour: it read an
`<img>` only when `src`, `width` and `height` came in that order, so a `class` in
front of them dropped the image out of every check, weighing included, without a
word. A rule that cannot parse its subject must say so rather than skip it.

**Read the evidence that already exists before producing more.** Every check here
writes under `reports/`, and re-running one to re-read its own output is the
canonical waste in this project — the rule and the trap underneath it, where a
reporter flag silently leaves the previous run's report on disk, are in [running the
mutation gate](../finish-phase/running-the-mutation-gate.md). A long run's console
output is only ever a tail, so a number wanted from the middle of one is saved while
it runs, not recovered by running it again.

## The sweep: one occurrence is a report, not a count

A fault almost never has exactly one site, because it came from a habit rather than
a typo. The same lost backslash has reached this repository twice — once inside a
`docs:check` rule whose path split then could not do its job and reported nothing
forever, and once more caught a substring from shipping. `TECH-DEBT.md`, under *Half
of `docs:check` is proven once*, has both and a third of the same shape. Copying a
render call to a second module left its font guard behind, and `CLAUDE.md` has what
that would have committed, beside the rule about refusing at construction.

So the last step of understanding a fault is **grep for its shape, not for its
symptom** — the wrong call, the missing guard, the assumption — across `src/`,
`scripts/`, `e2e/`, `.claude/` and the documents. Two traps make that grep lie:

- **`\b` is ASCII-only.** A word boundary does not match around Cyrillic, so a search
  for a Russian word bounded that way finds nothing and reports it as nothing.
- **A name that changed has callers no compiler sees.** Skills and documents hold
  commands that are run by hand. `docs:check` now fails a document naming a path this
  repository does not have, so that half is mechanical; a changed *name* still rots
  in silence.

What the sweep finds goes into the phase's size before any of it is fixed.

## A fault found while doing something else

Deciding this belongs here, not with the owner — the size of the phase was agreed
without it, and carrying every stray finding back is what makes a flow need
babysitting. The line is **the files this diff already changes** — `git diff
--name-only`, not a judgement about what was opened or read:

- a fault inside them — fix it, and the phase absorbs it;
- a fault outside them — `TECH-DEBT.md` with the trigger that would make it worth
  doing.

The sweep above guarantees this line gets straddled: fix the occurrences already in
the diff, and let one debt entry name the rest, so the count lives on disk.

The rule is about work, not words. A stale sentence in a file this phase now cites
is corrected where it stands — a debt entry would cost more lines than the fix.

Then say which happened in the closing message. A silent widening and a silent
deferral look identical from the outside, and both look like nothing was found.

## What the fix owes afterwards

**Name the gate that should have caught it.** Every gate in this project exists
because something got past the ones before it, and a shipped bug is the only
evidence that can say which one is blind. The answer belongs in the retrospective at
stage 6, phrased as what it would take for that gate to *see* the fault — not as a
resolution to be more careful.

**A bug that got past the units is one of the things that earns an e2e scenario.**
`write-an-e2e-scenario` has the list and the bar; the fault having crossed a real
seam is the evidence it asks for.
