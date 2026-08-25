---
name: add-repository-method
description: Add a query or write to the FoolProof repository layer. Use whenever a feature needs data it cannot currently get — new SQL, a new domain method, a new column read. Covers the files that must change together and the two rules that make the layer worth having.
---

# Adding a repository method

> **Stage 1** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

Features never touch the database. They depend on the interface and call named
domain methods, so adding a query means adding a method — never a query built at
the call site.

Four files change together, and a fifth if the method returns a new shape.
Skipping one is what breaks the layer.

## 1. `src/shared/repository/repository-contract.ts`

Add the method to the `Repository` interface, and any row type it returns.

The name is a domain phrase, not a SQL one: `liveCardInChat`, `rosterInChat`,
`seriesChronology`. A caller should not be able to guess the table from the name.

## 2. `src/shared/repository/sqlite-repository.ts`

The **only** file allowed to contain SQL or to import the connection. Implement the method
here.

- Timestamps are TEXT in `datetime('now')` form, always UTC — the columns are
  sorted and compared directly, so never store or accept a locale format.
- Anything that writes more than one table goes inside a transaction, so a
  failure leaves nothing partial behind.
- No knowledge of column names may leak out of this file. Map rows to the shape
  the interface promised before returning them.

Keep this file to SQL. A row reaches its record shape through
`row-records.ts`, and a column value reaches its type through `column-values.ts`
— nothing here reads `typeof` or picks a fallback.

## 2a. `src/shared/repository/row-records.ts` — only for a new shape

If the method returns a record shape that has no mapper yet, add one here
(`toGame`, `toSeat`, `toPlayerColumn` are the pattern) and give it a case in
`row-records.spec.ts`, which mocks `column-values.ts` so the assertion is *which
coercion each column got*.

This split is the reason the layer is testable at all: anything importing the
connection can only be exercised against a real SQLite, and a real SQLite never
returns the wrong type for a column — so a defensive branch written in the SQL
file is unreachable from its own spec, and the mutation score will say so.

## 3. `src/shared/repository/repository-contract.stub.ts`

Add a `<method>Spy` field with a sensible default in the constructor, and a
method that delegates to it. Every spec that mocks the repository gets the new
method for free; without this step they fail to compile.

## 4. `src/shared/repository/sqlite-repository.integration.spec.ts`

One of the project's integration specs, and it runs against a **real**
temporary SQLite file — its whole job is the SQL, and a mocked database would
assert nothing.

`process.env.DB_PATH` is set before the import, because `sqlite-connection.ts` opens the
connection at module load. Assert the behaviour the method promises, including
what happens with no rows, and — where the schema is doing the work — that the
constraint actually rejects the bad case.

## What not to do

Do not add an npm script for a one-off query. Occasional work (backfills, merging
duplicate players) goes behind `scripts/tools.ts`, which lists itself when run
with no argument; adding a tool is one line in its table.
