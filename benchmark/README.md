# `benchmark/` — the same task, run again and again, so the harness can be measured

The harness — `CLAUDE.md`, the skills, the agents, the gates — changes every week and
nothing says whether it got better. Models change too. This folder holds **tasks** an
agent can be given cold, in a fresh clone, and a runner that scores the result the same
way every time, so two runs weeks apart, or on two models, are comparable numbers
rather than impressions.

```bash
node scripts/benchmark/run-benchmark.ts flying-start claude-opus-5 high
```

With no arguments it runs the cell [`benchmark.json`](benchmark.json) pins for the checkup.

## A run is one cell

Five coordinates, and a comparison is honest only when exactly one of them differs:
the **task** and its version, the **snapshot** (the commit the clone was cut from —
code and harness together, because they live in one repository), the **model**, the
**effort**, and the day. The runner records all five in `runs/<stamp>-<task>-<model>.json`
and appends one row to [`RUNS.md`](RUNS.md).

What the agent gets: the task's `brief.md` on stdin, in a clone of `HEAD` cut under
the system temp folder, with the history, this folder and `scripts/benchmark/` removed,
dependencies installed, web search and fetch off, no memory (a fresh path has none),
permissions skipped because nobody is there to answer. The caps live in
[`benchmark.json`](benchmark.json) — turns and dollars — and so does the **pinned model
the checkup runs on**, so a checkup measures the harness and not a model that moved
under it.

What the agent never sees: `task.json`, `acceptance.spec.ts`, the reference diff, this
file, and the runner itself. The hidden spec also has to stay outside every runner's
default glob: it fails on the snapshot by design, so a Stryker config that named no
vitest config once ran Vitest's own `**/*.spec.ts` default, reached it in the dry run
and turned the whole mutation gate red at a pristine HEAD.

## The fence

Nothing stops a model from working out that it is being measured, and the brief's
frozen names say as much. What can be stopped is reaching the answer: the hidden spec,
the reference diff and the owner's memory all live outside the clone, and an agent
running without permission prompts has nothing else between it and them. So the runner
writes one hook into `settings.local.json` inside the clone's own `.claude/`, the file git ignores — never into the
shared settings — that refuses any Read, Edit, Write, MultiEdit, NotebookEdit, Glob, Grep or Bash naming a path
outside the clone: an absolute path elsewhere, a `..` that climbs out, the home folder
in any spelling. Two other places it allows, because the session is told to use both and
a refusal for obeying would be noise: the scratchpad Claude Code gives every session
under the temp folder, and the memory folder it keeps for the clone under
`~/.claude/projects/`, which the global instructions tell every session to read first. The detection is
`scripts/hooks/a-step-outside-the-fence.ts`, with its spec; the entry is
`.claude/hooks/refuse-a-step-outside-the-fence.mjs`, and the runner refuses to start an
agent in a clone that lacks it, because a missing hook and a fence that held read alike.

**A refusal is a measurement, not a wall that quietly held.** Every one is appended to
`reports/benchmark-fence.log` in the clone, and the run's record carries the count as
`fence hits` — zero is the expected value, and anything else is a finding about the
model or the brief, read from the transcript the record also names. The fence reads
the text of a command, so it errs on the side of the model: a token with no letter in
it, one carrying a regex or glob character, a fragment in backticks, and on Windows a
path that starts at the root with no drive are all read as pattern rather than path,
because the first calibration counted seven such fragments and not one real step out.
A determined agent can go round it; cutting the clone under temp, where nothing of
value is a `..` away, is the half that does not depend on text.

## What is scored, and by what

Deterministic first; a judging model only where nothing else can see.

| Column | Measured by |
|---|---|
| acceptance | the task's hidden spec, copied into the clone after the run, played through the clone's own `node scripts/gates/gate-runner.ts test`, then removed |
| gates | `npm run check:quick` in the clone, each gate's own verdict file |
| obligations | `task.json`'s list of regular expressions, each against one file — or `@commit` for the last commit message and `@closing` for the agent's final message |
| debt named | the task's `debtPattern` found in the closing message or the commit |
| fence hits | lines in the fence log the hook wrote inside the clone |
| finished | the CLI's own verdict; `void (api error 429)` when the API cut the run short, and such a row is not a result — it is kept so the gap is visible, and never compared |
| turns (CLI), cost | the headless CLI's own JSON — and its `num_turns` counts the last turn-group when the run ended on a subagent's report, so the pinned cell read 2 for a session of three hundred assistant lines; the two columns after it are counted, not reported |
| assistant messages, tool calls | counted off the kept transcript: distinct `message.id` among the lines of type `assistant` (the CLI writes one line per content block, so lines overcount), and the `tool_use` blocks across them; `n/a` when no transcript was kept |
| cost by model | the CLI's `modelUsage`, one cost per model, so a subagent's model shows beside the orchestrator's |
| budget | the cost as a share of `maxBudgetUsd`, so a row one long turn from `void` reads as such |
| minutes | the runner's clock around the agent, wall to wall; the CLI's own duration leaves the tools out and read eleven minutes for a forty-six minute run |

Beside the row, `reports/benchmark/<run>/` keeps the CLI's raw JSON, the closing
message, the fence log and a copy of the session's transcript, and the record names
the clone's path — so a perfect run in ten turns is explained by reading, not believed.

There is no single score on purpose. Acceptance is the headline; the rest says how it
was reached. A weighted number can be added once enough rows exist to know which
columns actually separate runs.

## Writing a task

A task is a folder under `tasks/`: `brief.md` (the owner's words, plus every name the
acceptance is written against — frozen, because a hidden spec has to compile against
any solution), `acceptance.spec.ts` (imports from `#…` aliases, runs real modules, no
mocks: it is an acceptance test, not a unit), and `task.json` (where the spec goes,
how many cases it holds, the obligations, the debt pattern).

**The hidden spec scores zero on the untouched snapshot**, and that is checked when the
task is written, by running it there: a case that passes before any work is done — a
"does not contain" with nothing to contain — measures nothing, and the first task had
one.

Three rules paid for already:

- **The thing the task adds is never merged.** The day it lands, the task is retired
  and the next one written; a task whose answer is in the repository measures memory.
- **Grep `PLAN.md` for the concept before freezing anything.** The first task drafted
  here asked for an award reading the evening backwards from its last game, which
  `PLAN.md` retires by name: the bot never learns an evening has ended. Half the code
  was written before a grep found it.
- **Size it to a phase, not a feature.** Thirty to fifty minutes of agent time at best.
  A task that takes a day gets no repeat runs, and one number is not a measurement.

## What it cannot measure yet

Taste — whether a Russian title reads well, whether two rows on a poster say one
thing twice — is what the owner and the `poster-reader` judge, and neither is in the
loop here. The clone has no `data/`, so the gate that reads a real evening cannot run.
And a run at an old commit gets that commit's harness; overlaying today's harness on an
old snapshot is [`TECH-DEBT.md`](../TECH-DEBT.md)'s.
