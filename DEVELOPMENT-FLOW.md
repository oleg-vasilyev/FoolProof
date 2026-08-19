# How a change becomes a release

The bot is developed by an AI agent — Claude Code, driven by the skills in
[`.claude/skills/`](.claude/skills/). This drawing is the map, not the
authority: each stage's rules live in the skill it names, and on any
disagreement the skill wins, then the drawing is fixed. The two are tied
together in both directions — every skill opens by naming the stage it belongs
to, and `npm run docs:check` fails when a stage reaches for a skill that names a
different one, so neither can be renumbered quietly. **Stages** are what a skill
may cite; the step numbers beside the arrows are positional and shift the moment
a step is inserted, so nothing outside this file refers to them. The retrospective
stage keeps it honest — a lesson that changes a default redraws the step it
touches, in the same commit, and a redraw of this drawing is always reported
in the closing message with the numbers behind it, never made quietly — a
commit-msg hook refuses a commit that changes this file without saying why. The colours are pinned on purpose: every message
sits on a light stage band, so the forced dark text stays readable in both of
GitHub's themes.

```mermaid
%%{init: {"theme": "base", "themeVariables": {
  "textColor": "#111111",
  "signalTextColor": "#111111",
  "signalColor": "#334155",
  "actorTextColor": "#111111",
  "actorBkg": "#e0f2fe",
  "actorBorder": "#0369a1",
  "actorLineColor": "#94a3b8",
  "noteTextColor": "#111111",
  "noteBkgColor": "#fef3c7",
  "noteBorderColor": "#b45309",
  "labelTextColor": "#111111",
  "loopTextColor": "#111111",
  "labelBoxBkgColor": "#f1f5f9",
  "labelBoxBorderColor": "#334155",
  "sequenceNumberColor": "#ffffff"
}}}%%
sequenceDiagram
    autonumber
    actor U as Product owner
    participant C as Claude Code, the AI developer
    participant D as Claude Design, the design system
    participant K as Project skills, .claude/skills
    participant S as Subagents, one per piece of work
    participant H as Auto-linter, fires on its own
    participant R as Second AI agent, the reviewer
    participant G as GitHub, repository and CI
    participant V as Production server

    rect rgb(254, 249, 231)
    note over U,K: Stage 1. Framing the task and the mockup
    U->>C: the feature, in the owner's own words
    C->>C: study the project: CLAUDE.md is already in context, its links lead to PLAN.md and TECH-DEBT.md
    C->>C: check the tech debt: a task that trips a deferred item's trigger takes it into scope
    opt the description leaves questions
        C->>U: every question at once, before any work
        U-->>C: answers
    end
    C->>U: the size of the phase in one line, tripped debt included
    U-->>C: agreed, or cut it down
    opt the feature affects the app's visuals
        C->>S: the poster-designer agent — the requirements, in words
        S->>D: read the design system before drawing anything
        D-->>S: every colour, size and rule the existing posters obey
        S->>S: draw, rasterize with the real fonts, look at the PNG, redraw
        S-->>C: the picture, its SVG, and which numbers it assumes exist
        C->>U: mockup for approval
        U-->>C: approved, or changes
    end
    C->>K: the add-a-feature skill
    K-->>C: how a feature is shaped: the layers, where files go, how they are named
    C->>K: the write-a-spec skill
    K-->>C: how to test: one spec per file, everything around it stubbed
    opt the feature needs new database queries
        C->>K: the add-repository-method skill
        K-->>C: five files that only change together
    end
    C->>C: now, knowing the rules, freeze the interfaces: what each function takes and returns
    end

    rect rgb(245, 245, 245)
    note over C,H: Stage 2. Writing the code and the tests
    C->>C: cut the work into pieces: what runs in parallel, what I keep — the shared shape, the copy, the risky core
    C->>S: briefs to every subagent in one go, each with its own piece and its own skill
    par in parallel
        loop one file at a time
            C->>C: write the core of the feature
            note right of H: saving a file fires this check by itself
            H--)C: style findings for exactly that file
            opt findings exist
                C->>C: fix now, before the next file
            end
            C->>C: write the unit tests: everything around the file replaced with stubs
        end
    and
        S->>S: each writes its piece strictly to the brief
        S-->>C: finished files, proven by their own tests
        C->>C: accept the result, weld the seams between the pieces
    end
    end

    rect rgb(240, 253, 244)
    note over C,H: Stage 3. Quality gates
    C->>K: the finish-phase skill
    K-->>C: the order of the gates and their thresholds
    loop while any gate is red — fix, then re-run only the one that fell
        C->>C: npm run check:phase — one command, every gate in a row, the tests run once
        C->>C: lint and types, the suite under coverage with a 70% floor
        C->>C: Stryker mutates the diff — the tests must notice, 85% threshold
        C->>C: e2e over the diff — the real bot against a fake Telegram
    end
    C->>C: walk everything outside src/ — deploy scripts, systemd units, CI config: almost nothing there has an automatic gate
    end

    rect rgb(240, 249, 255)
    note over C,R: Stage 4. Review by a second AI agent
    C->>R: the phase's whole diff in one piece
    R-->>C: findings, most severe first
    loop for each finding
        alt worth fixing now
            C->>C: fix the code and re-run only the affected gate
        else not worth fixing now
            C->>C: record it in TECH-DEBT.md with the trigger that would make it worth doing
        end
    end
    opt the feature gained an inline keyboard, or a bug got past the units
        C->>K: the write-an-e2e-scenario skill
        K-->>C: when a scenario is owed, and how to drive a whole evening against a fake Telegram
        C->>C: write the scenario and play it — the real bot on a real database
    end
    end

    rect rgb(255, 247, 237)
    note over C,K: Stage 5. Syncing every picture the project holds
    opt the change touched what the bot or the site draws
        opt the phase added a poster the gallery has never drawn
            C->>C: give the new renderer its own gallery cases — npm run docs:check fails on one nobody drew
        end
        C->>C: the poster gallery: open every picture myself, look for overflowing text and broken lines
        C->>K: the refresh-the-pictures skill
        K-->>C: the table of every committed picture, what draws it, and which have no gate but the table
        C->>C: regenerate the stale ones and open every PNG — mockups, posters, previews, icons
        opt the redrawn pictures also live on the design page
            C->>K: the update-the-design-page skill
            K-->>C: pull the page, splice the real drawings in, bump the revision
            C->>D: the implemented reality, pushed back to the design page
        end
    end
    end

    rect rgb(253, 242, 248)
    note over C,K: Stage 6. Retrospective — fixing the process and the documents
    C->>K: the retrospective skill
    K-->>C: five questions about how the work went, each answered with a count
    C->>C: count in numbers: what was rebuilt, what ran for nothing
    C->>K: land a new rule in the skills, so the mistake cannot repeat
    opt the lesson changes the flow itself, not just a rule inside a skill
        C->>C: redraw this very diagram, and keep the evidence that forced it for the closing report
    end
    C->>C: save the takeaway to persistent memory — it outlives this session
    C->>K: the write-a-doc skill
    K-->>C: every fact has one home document, and CLAUDE.md has a line budget
    C->>C: update README, PLAN and whatever else the phase owes
    C->>C: npm run docs:check — links resolve, the tables match the code, the budget holds
    end

    rect rgb(237, 233, 254)
    note over C,V: Stage 7. Release to production
    C->>K: the write-a-commit skill
    K-->>C: the title says what the bot does differently, the body says why the old shape was wrong, plus the Gates paragraph
    C->>G: commit and push to main
    G->>G: CI on push — npm run check:push: lint, types, the e2e harness's own tests, documents — the site ships straight from main, the app's tests wait for the tag
    alt push check red
        G-->>C: the failure report
        C->>C: fix and push again
    else green
        G-->>C: a green check on the commit
        C->>C: npm version with the release message
        C->>C: the pre-push hook runs npm run check:release — a red tag cannot leave the machine
        C->>G: the tag is pushed
        C->>U: a chat message: the release is cut — the version, and what it changes
        opt this diagram was redrawn
            C->>U: the work is done, but the flow was not optimal — what changed here, and the numbers that forced it
        end
        G->>G: CI repeats the full battery on a clean clone — the second opinion
        note right of V: the server does not wait for CI — the local hook is the gate
        V->>G: asks every five minutes whether a new tag appeared
        G-->>V: the newest release tag
        V->>V: installs it — npm ci and a service restart, a failed install rolling back on its own
    end
    end

    rect rgb(236, 254, 255)
    note over U,V: Stage 8. The checkup — occasional, and it is allowed to fix nothing
    opt roughly weekly, and always after a release worth watching
        U->>C: look the whole thing over
        C->>S: the deep-checkup agent
        S->>G: clone the released tag cold and run the full battery on it — trust nothing already on this machine
        S->>V: ask the running bot and its server what is true, rather than what should be
        V-->>S: the service, the timers, the disk, which tag is actually deployed
        S->>S: execute the edges instead of reasoning about them, and write evidence beside every claim
        S-->>C: findings, most severe first — and not one thing repaired
        loop for each finding
            C->>C: check it myself before believing it — a confident agent is not evidence
            alt worth doing now
                C->>C: it becomes the next phase, and that phase owes all seven gates
            else not now
                C->>C: TECH-DEBT.md with the trigger, or persistent memory when the lesson outlives the code
            end
        end
        C->>U: what was found, what I verified, and the one thing I would do first
    end
    end
```
