# The logbook

No code lives here. Two kinds of dated record do, and they exist for one reason: a
shape that spans several phases is invisible from inside any of them.

- **`phases/`** — one log per phase, written at its retrospective while the transcript
  still exists. `deep-checkup` is the only reader, and it **empties this folder** of
  what it has used; the rule and its justification are that agent's, under the phase
  that reads them. Like the folder below, it appears with the first log — and being
  empty is its ordinary state right after a checkup, not a sign nobody is writing.
- **`checkups/`** — one report per checkup, saved by whoever ran it. **Never pruned**,
  because the first question of every visit is *is this the same finding as last time,
  and did the number move?*, which has no answer without the report before it. The
  folder appears with the first report.

Raw checkup evidence is not here. It stays in `reports/checkup/<YYYY-MM-DD>/evidence/`,
gitignored like every check's output, and that split is deliberate: git history is
permanent, so anything committed is carried by every clone forever even after the file
is deleted. A report is prose and small enough to keep for years; command output is
neither, and *we will clean it up later* is false for exactly the things large enough
to matter. What crosses from the evidence into the report is the **measurements**, one
row each, because a trend is what two checkups written the same way make between them.

## What a phase log carries

Name it `phases/<YYYY-MM-DD>-<slug>.md`, where the slug is the one the phase's commit
will carry — by the retrospective its title is drafted, and if it is not, the log is
being written too early.

Terse. Each line is a clause, not a paragraph: this is evidence for somebody counting,
not a story. A field with nothing in it says `none`, which is an answer; silence is not.

```
Asked:      <what the owner asked for, in their framing, one line>
Kind:       feature | fault | tooling | documents | process | release
Ran:        <wall clock> · <models used> · <subagent tokens, summed>
Path:       <the drawing's stages and steps walked, in that order, joined by →>
Skipped:    <the stages and steps that were not, joined by ·>
Off-map:    <work no step of the drawing describes, or none>
Delegated:  <n> errands — <what each returned, a clause each>
Rework:     <what was built and then rebuilt> — <what would have settled it earlier>
Loops:      <ground covered twice> — <what sent it back>
Broke:      <a crash, a usage limit, an agent that died mid-errand> — <what it cost>
Gates:      <which ran> · <which were skipped, each with its reason>
Found by:   <for every defect this phase fixed: a gate | the review | the owner | me>
Landed:     <the durable change, or none>
```

## The walk is cited by name, never by number

[`DEVELOPMENT-FLOW.md`](../DEVELOPMENT-FLOW.md) draws the stages a change passes
through. `Path:` and `Skipped:` say which of them this phase actually walked, and
between them they must name **every stage in the drawing** — a stage in neither is
the one failure this field exists to make impossible, because a phase that quietly
went round a stage and a phase that simply did not mention it read identically.

**A citation is the opening words of a line in the drawing** — enough of them to fit
one line and no more. That line may be a stage (`framing`, `quality gates`) or a
single step inside one (`check the tech debt`, `the phase-reviewer agent`), and a step
stands for the stage it was drawn in, so writing steps never costs you the coverage
above. Write whichever grain says something: the stage where the phase simply passed
through, the step where the interesting thing was one step.

Never the number: the numbers are positional — the drawing says so about its steps,
and its stages are one insertion away from the same thing.

**`docs:check` reads a log exactly once — in the commit that brings it in.** It
resolves every citation against the drawing, checks the coverage above, and refuses a
citation short enough to fit two lines or a step the drawing repeats in several stages
(no wording separates those, so name their stage instead). After that commit the file
is never read by the gate again, and that is the rule rather than an optimisation: a
log is a record of what happened, not a document kept in step. Rename a stage next
month and every log that cited it stays exactly as written — the citation has become
historical, which is what a record is for. Nothing here is ever edited to match a
drawing that moved.

The walk is the order things happened in, so a line entered twice is written twice:
`… → quality gates → review → write the core of the feature → quality gates → …` is a
phase that went back, and that is the shape worth seeing.

**`Skipped:` is a list, not an argument.** Names only, separated by `·`, no reason
attached to any of them — `Gates:` already carries why a check did not run, and a
justification written beside a skip is a cushion that makes five identical skips read
as five reasonable decisions. Whatever needs arguing goes in the prose below the block,
where the analysis lives.

It takes steps as readily as stages, and a step skipped inside a stage that was walked
is not a contradiction — it is the sharpest thing this field records. Two things are
refused: the same line on both sides at once, and a whole stage called skipped while
the walk goes through a step of it.

`Path:` and `Gates:` are not the same field. `Path:` says which lines of the drawing
were walked; `Gates:` says which checks ran and what each returned. The gates stage is
one step in the drawing and four thresholds in practice, so only the second line can
tell you mutation was the one that did not run.

`Off-map:` is the field for work the drawing has no step for. It is the honest answer
when a phase did something real that no stage describes — and two logs saying the same
thing there is how a missing stage gets found.

## The one rule that matters

**A number you did not measure is written `not measured`, never estimated.** A log read
a week later cannot tell a measurement from a guess, and a guess averaged with four
real numbers poisons all five. **A number `git` can produce is measured, not
remembered** — that is not advice. The first log written under this rule said a gate
had been skipped four times running when the log itself was the sixth, and put five
phases in the day where there were seven; both were one `git log` away, and both were
wrong in the direction that made the day read better.

What is actually knowable:

- **Anything in the history.** How many phases today, which gates their messages
  report, which model each trailer names. `git log --since=<date> --format=%B` answers
  all three, so none of them is ever `not measured`.
- **Subagent tokens and durations** are reported when an errand returns. Sum them.
- **Your own tokens are not available to you.** Say so; do not infer them from how
  long the session felt.
- **Wall clock** needs both ends at full precision, and the start is the **owner's
  opening message**, which the session transcript timestamps. `git log -1 --format=%cI`
  is only a stand-in for it, right when the phase began where the last one ended and
  wrong otherwise: one phase reported 3h31m that way for 1h08m of work, the difference
  being an unrelated errand between the two commits. The end is the final commit's own
  `%cI`. `date +%F` is a date with no time in it and cannot produce a duration — the
  first version of this page recommended it anyway.

`Found by:` is the field the checkup was built for and the easiest to fill in the
project's favour. A defect the owner pointed at is `the owner`, even when a gate would
have caught it eventually, and even when you agreed at once.

## Why these fields and not others

Each one earns its place by failing this test: *could a single retrospective already
see it?* If yes it belongs in the commit's `Retro:` line and not here. `Rework:` and
`Loops:` appear in both because one phase sees its own and only a pile shows a
repeating shape. `Kind:` and `Ran:` are here purely to be divided by each other.

`Path:` is the sharpest case of that. Any phase can see its own route and none has a
reason to write it down; a stage skipped once is a judgement, and the same stage
skipped in five logs running is a stage the drawing claims and the work does not have.
Divided by `Kind:`, it answers the harder question underneath — which kinds of work go
round which stages.
