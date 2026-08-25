# Reading a survivor the mutation gate left alive

> Opened when the mutation gate is red. A survivor is a sentence about the spec, not a hole to be plugged, and which sentence decides what to write — [writing a spec](SKILL.md) is the rules the answer has to obey.

The gate itself — thresholds, the glob traps, when to run it — is `finish-phase`'s.
What a survivor *means* is this skill's, and the answer is rarely "write another
assertion". Two of the commonest causes are rules in [writing a spec](SKILL.md)
itself: a spy left dirty by the test before it, and an assertion whose subject is
something *missing*. The rest:

- **One round of survivor-killing per phase, and only for mutants whose death would
  prevent a bug a player could see.** Above roughly 95% the survivors are mostly
  equivalent mutants and type-narrowing guards; the threshold is 85 in `src/` and 80
  for the tooling, and `finish-phase` says why they differ. One left
  alive on purpose is worth a sentence in the commit message, not another two rounds.
- **Read the survivor's own line before believing it is a gap.** A line number quoted
  from memory cost a whole extra run: the rule everyone worried about was already
  killed and the survivor beside it was equivalent. Print the mutant and its
  replacement from `reports/mutation/mutation.json`, never the line you remember.
- **An arithmetic mutant on a nullable accumulator is usually equivalent.** `sum +
  null` is `sum + 0` in JavaScript, so *add the value even when it is absent* changes
  nothing observable. Recognising that is cheaper than writing the test that cannot
  exist.
- **The commonest real cause is not a missing test at all** — it is an exact boundary
  nobody asserted. A case that proves the branch runs does not prove the number it
  turns on, so a mutant that moves `>=` to `>` survives a suite that looks thorough.
