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
    participant D as Claude Design, the design page
    participant K as Project skills, .claude/skills
    participant S as Subagents I brief by hand — a batch of files to write, or one question to answer
    participant R as Named agents, .claude/agents
    participant G as GitHub, repository and CI
    participant V as Production server

    rect rgb(254, 249, 231)
    note over U,K: Stage 1. Framing the task and the mockup
    U->>C: what should be different, in the owner's own words
    C->>C: read it for the kind of work it is: something the bot does wrong, or something it does not do at all yet
    C->>C: study the project: CLAUDE.md is already in context, its links lead to PLAN.md and TECH-DEBT.md
    C->>C: check the tech debt: a task that trips a deferred item's trigger takes it into scope
    opt the bot already does this, and does it wrong
        C->>K: the fix-a-bug skill
        K-->>C: reproduce before reading the code, and prove the cause rather than guessing a third time
        C->>C: reproduce it on the platform it happened on, with the smallest input that still shows it
        C->>C: grep the code for the same shape elsewhere — the report names one place, a habit leaves several
    end
    opt something is assumed that the repository can settle on its own
        C->>S: one brief, one question — what to open rather than assume, and what the answer must carry
        S-->>C: the answer, and whatever it could not establish said as that rather than left out
    end
    opt questions are left that only the owner can answer
        C->>U: every question at once, before any work
        U-->>C: answers
    end
    C->>U: the size of the phase in one line, tripped debt and the sweep included
    U-->>C: agreed, or cut it down
    opt the feature affects the app's visuals
        C->>R: the poster-designer agent — the requirements, in words
        R->>D: read the design system before drawing anything
        D-->>R: every colour, size and rule the existing posters obey
        R->>R: name the cases the drawing must survive before drawing: emptiest, fullest, widest, each optional part gone, a tie
        R->>R: draw every named case, rasterize with the real fonts, look at each PNG, and redraw whatever fails the look
        R->>R: lay them into one contact sheet: every case, the neighbour it will sit next to, and an inventory naming every mark and label in a player's words
        R->>C: the named cases, committed as docs/posters/[gallery script].cases.txt — docs:check later holds the gallery to them
        R-->>C: the sheet, the SVG behind each panel, and which numbers the drawing assumes exist
        C->>R: the copy-reader agent — the inventory of every line the drawing puts on the poster, read as sentences
        R-->>C: the ones no person would say, each with a better line
        C->>C: fix the wording and have the sheet redrawn — the owner approves text somebody has already read
        C->>U: the contact sheet for approval — everything to compare, in one image
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
    opt the phase adds something a player can reach, or changes a contract other code depends on
        C->>R: the plan-reviewer agent — the owner's own words and the frozen signatures, nothing retold
        R->>R: derive the rest from the repository: the schema, the limits, what already solves this
        R-->>C: what the plan promises, each checked against a file, and what it has not accounted for
        opt a finding changes what the owner already approved
            C->>U: the finding, while nothing is written yet
            U-->>C: decided
        end
    end
    end

    rect rgb(245, 245, 245)
    note over C,S: Stage 2. Writing the code and the tests
    C->>C: cut the work into pieces: what runs in parallel, what I keep — the shared shape, the copy, the risky core
    opt the feature says anything to a player
        C->>C: write both copy tables first, before a line of the code that reads them
        C->>R: the copy-reader agent — the finished sentences and the signatures they will be called from
        R-->>C: every line written out with real values in it, then the ones no person would say — each with a blunt verdict and a better line
        C->>C: fix the tables now, while nothing is built on them
    end
    opt ten files or more, and the artifact they are written against already drawn and looked at
        C->>S: briefs to every subagent in one go, each with its own piece and its own skill — these run beside the loop below
        S->>S: each writes its piece strictly to the brief
        S-->>C: finished files, proven by their own tests
        C->>C: accept the result, weld the seams between the pieces
    end
    opt the phase came for a fault
        C->>C: write the failing test at the layer that can still see the fault, and watch it go red before any fix
        note over C: a test written after the fix asserts what the code does, not what the bug was
    end
    loop one file at a time
        C->>C: write the core of the feature
        note over C: saving the file fires the lint hook on it, unasked
        opt it found something
            C->>C: fix now, before the next file
        end
        C->>C: write the unit tests: everything around the file replaced with stubs
    end
    opt a fault turns up that this phase did not come for
        C->>K: the fix-a-bug skill
        K-->>C: decide it here rather than carrying it back, and the line is the files this diff already changes
        C->>C: a fault inside them is fixed and absorbed, one outside them goes to TECH-DEBT.md with its trigger
        C->>C: either way say which in the closing message, because a silent widening and a silent deferral read the same
    end
    end

    rect rgb(240, 253, 244)
    note over C,K: Stage 3. Quality gates
    C->>K: the finish-phase skill
    K-->>C: the order of the gates and their thresholds
    C->>C: npm run check:phase — one command, every gate in a row, the tests run once
    note over C: lint and types · the suite under coverage, 70% floor · Stryker on the diff, 85% of the mutants must die · e2e over the diff, the real bot against a fake Telegram
    loop while any gate is red
        opt the failure is not obvious from the message it printed
            C->>K: the fix-a-bug skill
            K-->>C: measure before the third hypothesis, and read the report already on disk instead of running the gate again
        end
        C->>C: fix it, then re-run that gate alone — never the whole chain
    end
    end

    rect rgb(240, 249, 255)
    note over C,R: Stage 4. Review by an agent that did not write the diff
    C->>R: the phase-reviewer agent — the whole diff in one piece, deploy scripts, service units and CI included, which no automatic gate covers at all
    R-->>C: findings, most severe first
    loop for each finding
        alt worth fixing now
            C->>C: fix the code and re-run only the affected gate
        else not worth fixing now
            C->>C: record it in TECH-DEBT.md with the trigger that would make it worth doing
        end
    end
    opt the feature gained an inline keyboard, or a bug got past the unit tests
        C->>K: the write-an-e2e-scenario skill
        K-->>C: when a scenario is owed, and how to drive a whole evening against a fake Telegram
        C->>C: write the scenario and play it — the real bot on a real database
    end
    end

    rect rgb(255, 247, 237)
    note over C,R: Stage 5. Reading every sentence, then syncing every picture
    opt a key changed after stage 2 read the tables, or the prose lives outside them
        C->>R: the copy-reader agent — only what moved since, and the call sites that now exist
        R-->>C: the same verdicts, on the lines that changed under it
        C->>C: take the better lines as written, and where a sentence claimed more than the rule delivers, fix the code behind it
    end
    opt the change touched what the bot or the site draws
        opt the phase added a poster the gallery has never drawn
            C->>C: copy the cases named at stage 1 into the gallery — npm run docs:check fails on a poster nobody drew
        end
        C->>K: the refresh-the-pictures skill
        K-->>C: the table of every committed picture, what draws it, and which have no gate but the table
        C->>C: draw the gallery and regenerate the stale ones — posters, previews, icons
        C->>R: the poster-reader agent — the contact sheet, every regenerated PNG, the lines to read, but never what any of it is for
        R-->>C: what each line says to somebody who has never seen the code, then the set read against itself
        opt the phase had a mockup approved at stage 1
            C->>R: a second reading, this time with the approved sheet — how does what shipped differ from what was signed off?
            R-->>C: every difference it can see, without ruling on which were meant
        end
        C->>C: for each reading that surprised, decide whether the reading or the line is wrong — and what the line should say instead
        opt the redrawn pictures also live on the design page
            C->>K: the update-the-design-page skill (a fork — it runs as its own subagent, so it pulls the page, splices the real drawings in and bumps the revision itself)
            K->>D: the implemented reality, pushed back to the design page
            K-->>C: the revision the page now carries, the byte check that must pass before design-page.sync is committed, and every sentence it rewrote
        end
    end
    end

    rect rgb(253, 242, 248)
    note over C,K: Stage 6. Retrospective — fixing the process and the documents
    opt something was rebuilt, a gate ran twice, an agent was paid for nothing, or a bug reached a player
        C->>S: the retrospective, run in a fork of this very conversation — its evidence is the transcript, which no cold agent can see and a fork inherits whole
        S->>K: the retrospective skill
        K-->>S: six questions about how the work went, each answered with a count, the last asking what should now come out
        S-->>C: the six answers, each carrying its number rather than an impression, and the rules it proposes — but it writes no file, because a reviewer may still be reading
        C->>C: land each rule yourself, in the file whose readers it is for
        opt the phase fixed something that had already shipped
            C->>C: name the gate that should have caught it, and what it would take for that gate to see it
        end
        C->>K: land a new rule in the skills, so the mistake cannot repeat
        opt the lesson changes the flow itself, not just a rule inside a skill
            C->>C: redraw this very diagram, and keep the evidence that forced it for the closing report
        end
        C->>C: save the takeaway to persistent memory — it outlives this session
    end
    C->>C: write the phase log to logbook/phases/ — every phase, straight ones included, or the pile only ever shows the bad ones
    C->>C: name in it the lines of this drawing the phase walked and the ones it went round — a whole stage or a single step, each cited by the opening words it is drawn with, never by a number
    C->>K: the write-a-doc skill
    K-->>C: every fact has one home document, and CLAUDE.md has a line budget
    C->>C: update README, PLAN and whatever else the phase owes
    opt a skill outgrew its budget, somebody proposed rewriting one, or a rule inside one may no longer be enforced
        C->>R: the skill-auditor agent — which skill, and whether a rewrite is wanted at all
        R-->>C: a row per rule — enforced by a machine, stated in another file, or the only place a remedy is written down
        C->>C: adopt a rewrite only when that inventory shows it loses no remedy, and check each cut against the file it names
    end
    C->>C: npm run docs:check — links resolve, the tables match the code, the budget holds
    end

    rect rgb(237, 233, 254)
    note over C,V: Stage 7. Release to production
    C->>K: the write-a-commit skill
    K-->>C: the title says what the bot does differently, the body says why the old shape was wrong, plus the Gates paragraph
    C->>G: commit and push to main
    G->>G: CI on push runs npm run check:push — lint, types, the e2e harness's own tests and the docs check. The site ships straight from main, so the app's full suite waits for the tag
    alt push check red
        G-->>C: the failure report
        C->>C: fix and push again
    else green
        G-->>C: a green check on the commit
        alt the phase changed what a player or the operator gets
            C->>C: npm version with the release message
            C->>C: the pre-push hook runs npm run check:release — a red tag cannot leave the machine
            C->>G: the tag is pushed
            C->>U: a chat message: the release is cut — the version, and what it changes
            G->>G: CI repeats the full battery on a clean clone — the second opinion
            note right of V: the server does not wait for CI — the local hook is the gate
            V->>G: asks every five minutes whether a new tag appeared
            G-->>V: the newest release tag
            V->>V: installs it — npm ci and a service restart, a failed install rolling back on its own
        else it changed only the tooling, the documents or this process
            C->>U: a chat message: it is on main and the next tag carries it — no restart bought nothing
        end
        opt this diagram was redrawn
            C->>U: the work is done, but the flow was not optimal — what changed here, and the numbers that forced it
        end
    end
    end

    rect rgb(236, 254, 255)
    note over U,V: Stage 8. The checkup — occasional, and it is allowed to fix nothing
    opt roughly weekly, and always after a release worth watching
        U->>C: look the whole thing over
        C->>R: the deep-checkup agent
        R->>G: clone the released tag cold and run the full battery on it — trust nothing already on this machine
        R->>V: ask the running bot and its server what is true, rather than what should be
        V-->>R: the service, the timers, the disk, which tag is actually deployed
        R->>R: run the edge cases instead of reasoning about them, and write evidence beside every claim
        R->>R: sweep one skill or agent for rules that should already be gone, and read one section of PLAN.md line by line — both rotate, and the report names where they stopped
        R->>R: read a week of phase logs as one pile and divide their fields — who found each defect, which gate keeps being skipped, what a kind of work keeps costing
        R->>R: delete the logs folded in, naming each — its one write outside reports/, and not a repair to anything the project ships
        R-->>C: findings, most severe first, with the measurements as a table so the next checkup can compare
        loop for each finding
            C->>C: check it myself before believing it — a confident agent is not evidence
            alt worth doing now
                C->>C: it becomes the next phase, and that phase owes every gate its own diff opens
            else not now
                C->>C: record it in TECH-DEBT.md with its trigger, or in persistent memory when the lesson outlives the code
            end
        end
        C->>U: what was found, what I verified, and the one thing I would do first
    end
    end
```
