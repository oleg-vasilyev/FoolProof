# The logbook

No code lives here. Two kinds of dated record do, and they exist for one reason: a
shape that spans several phases is invisible from inside any of them.

- **`phases/`** — one log per phase, written at its retrospective while the transcript
  still exists. `deep-checkup` is the only reader, and it **empties this folder** of
  what it has used; the rule and its justification are that agent's, under the phase
  that reads them.
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
Delegated:  <n> errands — <what each returned, a clause each>
Rework:     <what was built and then rebuilt> — <what would have settled it earlier>
Loops:      <ground covered twice> — <what sent it back>
Broke:      <a crash, a usage limit, an agent that died mid-errand> — <what it cost>
Gates:      <which ran> · <which were skipped, each with its reason>
Found by:   <for every defect this phase fixed: a gate | the review | the owner | me>
Landed:     <the durable change, or none>
```

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
- **Wall clock** needs both ends at full precision: `git log -1 --format=%cI` for the
  start and `date -Iseconds` for the end. `date +%F` is a date with no time in it and
  cannot produce a duration — the first version of this page recommended it anyway.

`Found by:` is the field the checkup was built for and the easiest to fill in the
project's favour. A defect the owner pointed at is `the owner`, even when a gate would
have caught it eventually, and even when you agreed at once.

## Why these fields and not others

Each one earns its place by failing this test: *could a single retrospective already
see it?* If yes it belongs in the commit's `Retro:` line and not here. `Rework:` and
`Loops:` appear in both because one phase sees its own and only a pile shows a
repeating shape. `Kind:` and `Ran:` are here purely to be divided by each other.
