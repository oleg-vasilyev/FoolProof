# Give every gate one interface, and make a gate that departs from it stop compiling

```
Asked:      я ожидаю что вссе гейты имеют общий интфейс, который пишет в файл, а не
            консоль · и нужно гарантировать, чтобы в будущем не мог появиться гейт,
            который не следует общему интерфейсу · а tools нужен console.log?
Kind:       tooling
Ran:        1h40m · claude-opus-5 · 256,606 subagent tokens
Path:       read it for the kind of work it is → the size of the phase in one line →
            now, knowing the rules, freeze the interfaces → the plan-reviewer agent →
            Writing the code and the tests → npm run check:phase → the phase-reviewer agent →
            Writing the code and the tests → npm run check:phase → the retrospective skill →
            land each rule yourself → the write-a-doc skill → write the phase log
Skipped:    check the tech debt · Reading every sentence, then syncing every picture ·
            Release to production
Off-map:    none
Delegated:  2 errands — plan-reviewer over the frozen signatures: 7 findings, one of which
            would otherwise have deleted a live lint rule in silence; phase-reviewer over
            the diff: 8 findings, 1 blocking
Rework:     the lint zone, designed on no-restricted-syntax and rebuilt on no-console plus
            a say.ts — the config explains that trap in its own words twelve lines above
            the block I was extending, and I did not read it · savedFindingsIn written to
            return [] on a corrupt file and changed to null · the findings cap written at
            write time and moved to read time
Loops:      gates → review → gates, once — sent back by the blocking finding
Broke:      none
Gates:      lint · typecheck · check-docs · test:coverage · test:mutation-changed ·
            e2e:changed · plan-reviewer · phase-reviewer — skipped: the copy reading, no
            user-visible string exists in scripts/; the gallery, nothing drawn; the real
            evening, no poster changed
Found by:   the plan review — the flat-config block that would have killed the
            feature-import ban, and the { kind: "none" } escape the tuple did not close;
            the phase review — a tsc failure the parser cannot read leaving a red gate with
            no reason on disk, and a signal-killed vitest reading as green; the probes —
            three guards seen refusing
Landed:     memory/the-review-runs-before-the-expensive-gate.md — check:quick, freeze,
            review, then check:phase; broken twice in one session, at six minutes a time
```

Nine gates of eleven already worked this way: `outputsOf(gate)` names the files a gate
writes, the runner deletes them before the run, and `numbersFor` builds the verdict by
reading them. Two departed. `typecheck` and `e2e:typecheck` declared no file at all and
were fed from the captured stream — line 142 of `gate-numbers.ts` was the only use of
that parameter in the file. And `e2e:changed` wrote vitest's report but kept its own
decision — play everything, play these, play nothing — in a `console.log`, so a run that
played nothing produced `{ kind: "none" }` and vanished from the battery's paragraph
entirely, reading exactly like a battery with no e2e in it.

The guarantee the owner asked for is three things, and only the first two are guarantees.
`outputsOf` returns `readonly [string, ...string[]]`, so a gate naming no file stops
compiling. `numbersFor` lost its `output` parameter, so nothing can be fed from a stream
because nothing hands one over. `{ kind: "none" }` left the union, which is the escape
the tuple does not close: a gate could otherwise name a path, satisfy the type and read
nothing. The lint zone is tidiness — `no-console` does not know `process.stdout.write`,
and the block now says so rather than claiming the guarantee.

Two reviews, 256k tokens, and both paid for themselves on one finding each. The plan
review read the lint config and found that a second block setting `no-restricted-syntax`
for `scripts/gates/**` would have replaced the block that bans importing a feature — a
probe on `console.log` would have gone green and the deleted rule would never have been
missed. The phase review found that a tsc failure without a `file(line,col):` prefix left
its reason in no file at all, which is the failure this whole phase was about, committed
by the phase itself.
