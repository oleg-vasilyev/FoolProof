# `benchmark/` — the same task, run again and again, so the harness can be measured

The harness — `CLAUDE.md`, the skills, the agents, the gates — changes every week and
nothing says whether it got better. Models change too. This folder holds **tasks** an
agent can be given cold, in a fresh clone, and a runner that scores the result the same
way every time, so two runs weeks apart, or on two models, are comparable numbers
rather than impressions.

```bash
node scripts/tools/tools.ts benchmark flying-start claude-opus-5 high
```

## A run is one cell

Five coordinates, and a comparison is honest only when exactly one of them differs:
the **task** and its version, the **snapshot** (the commit the clone was cut from —
code and harness together, because they live in one repository), the **model**, the
**effort**, and the day. The runner records all five in `runs/<stamp>-<task>-<model>.json`
and appends one row to [`RUNS.md`](RUNS.md).

What the agent gets: the task's `brief.md` on stdin, in a clone of `HEAD` with the
history and this folder removed, dependencies installed, web search and fetch off,
no memory (a fresh path has none), permissions skipped because nobody is there to
answer. The caps live in [`benchmark.json`](benchmark.json) — turns and dollars — and so does
the **pinned model the checkup runs on**, so a checkup measures the harness and not
a model that moved under it.

What the agent never sees: `task.json`, `acceptance.spec.ts`, and this file.

## What is scored, and by what

Deterministic first; a judging model only where nothing else can see.

| Column | Measured by |
|---|---|
| acceptance | the task's hidden spec, copied into the clone after the run, played through the clone's own `node scripts/gates/gate-runner.ts test`, then removed |
| gates | `npm run check:quick` in the clone, each gate's own verdict file |
| obligations | `task.json`'s list of regular expressions, each against one file — or `@commit` for the last commit message and `@closing` for the agent's final message |
| debt named | the task's `debtPattern` found in the closing message or the commit |
| turns, minutes, cost | the headless CLI's own JSON |

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
