# Running the mutation gate

> Opened by gate 3 of [finishing a phase](SKILL.md) when the gate is red, when code has moved, or before a mutation command is pasted into a subagent's brief. None of it changes what the gate decides — all of it changes whether the number you read is real.

**That full run grows with the code**: 5637 mutants at v1.14.0, of which one feature
phase added about 2100. It took sixteen minutes until `concurrency` stopped being a
hard `4` and became `"75%"`, measured rather than guessed — 960s at four workers,
596s at twelve, with the score and the timeout count identical, so the verdict never
moved.

The percentage is not there to speed CI up — Stryker computes
`max(1, round(cores × 0.75))`, so the four-vCPU runner gets three workers where
the old constant gave it four. It is there so a number tuned on a sixteen-core
machine cannot oversubscribe a small one. Tune for the machine you measured on,
express it as a share, and check what it computes to on four cores before
committing.

**A crash is not a red gate, and this one has a signature.** The run opens
`max(1, round(cores × 0.75))` Node workers, each carrying a vitest instance — twelve
on a sixteen-core machine, measured at about 200 MB of working set each and far more
committed address space. Beside a loaded desktop that is enough to exhaust Windows'
commit charge, and what comes back then is not a score: a hook panicking with `OOM`,
`npx` failing to fork with `uv_spawn`, Stryker dying with `ERR_IPC_CHANNEL_CLOSED`,
and `taskkill` itself failing with `0xC000012D` — `STATUS_COMMITMENT_LIMIT`, the
system unable to start a 116 KB executable. Read all of that as the machine and never
as the code. The same gate on a freshly booted machine peaked at 3.3 GB across its
workers and finished clean, so the answer is headroom and not a smaller share: the
full run wants the machine mostly to itself.

**`--mutate` takes a glob, and `dir/*.ts` matches the specs too.** Worse, the CLI
flag **replaces** the config's `!src/**/*.spec.ts` rather than adding to it, so the
exclusion has to be repeated on the command line every time. `mutate-changed.ts`
now reads those patterns out of `stryker.config.json` and appends them itself, so
the changed-file gate obeys the config — do not give it a second copy of the list.
An exclusion added to the config is not in force until you have found everything
else that decides the same thing; this one was silently ignored for a whole run:

```
npx stryker run --mutate "src/features/<x>/*.ts,!src/**/*.spec.ts" --reporters clear-text
```

Stryker will otherwise mutate `cell-face.spec.ts`, where almost every mutant
survives because nothing tests the tests — one phase read a 55% total off a run
whose per-source files were all above 82%, and a later one read 49% off a folder
that was actually at 100%. A total far below the per-file numbers means the glob,
not the specs.

**Paste that line into a subagent's brief rather than describing it.** This rule
was already written here when two briefs went out carrying the naive command; both
agents caught it themselves, but a brief that hands over the wrong command is
asking for an afternoon of strengthening tests that were never weak.

Rules about *running* it, learned by burning most of a phase's budget on them:

- **Never re-run a gate to re-read its output, and never truncate the run that
  produced it — grepping the stream is truncating it.** A battery piped through
  `Select-Object -Last 30`, or through a `grep` whose pattern misses the summary
  line, throws away the coverage table and the mutation score the commit message
  then needs, and the cheapest way back is running the thing again — which is the
  rule this one protects. Send the whole run to a file and grep the file. Every
  run also writes `reports/mutation/mutation.json` and `reports/mutation/index.html`,
  and a backgrounded run keeps its own log — read those. `/merge` was closed with eight
  Stryker invocations where two would have done, three of them the same full run
  repeated to look at three slices of one table.
- **Moving code moves its mutants — re-run the gate after a split or a rename.**
  Assertions do not always survive being ported: splitting one render file into two
  silently dropped four that had been killing mutants, including the early return
  that made a conditional legend conditional. The score is the only thing that
  notices, so a refactor after the mutation run is a refactor before another one.
  That is the second round the rule above forbids, and it is the one case where
  taking it is right.
- **`--reporters` replaces the configured set, it does not add to it.** Passing
  `--reporters clear-text` drops the `json` one, so `reports/mutation/mutation.json`
  still holds the *previous* run's survivors — and the rule above sends you straight
  to that stale file. This has already produced a confident reading of seven
  survivors from a run that mutated three files and found two. Override the
  reporters or read the report, never both.
