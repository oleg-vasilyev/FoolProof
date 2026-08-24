import { FIRST_GROUP, SPEC_DOCUMENT, read } from "./the-documents.ts";


const SCHEMA_SOURCE = "src/shared/repository/sqlite-connection.ts";

const A_SCHEMA_STATEMENT = /^CREATE (TABLE|INDEX|UNIQUE INDEX)/;

const THE_DOCUMENTED_BLOCK = /## Data model\n+```sql\n([\s\S]*?)```/;

const AN_EXECUTED_BLOCK = /db\.exec\(`([\s\S]*?)`\)/g;

const ANY_WHITESPACE = /\s+/g;

const BETWEEN_STATEMENTS = ";";

const schemaStatementsIn = (sql: string): ReadonlyMap<string, string> =>
  new Map(
    sql
      .split(BETWEEN_STATEMENTS)
      .map((statement) =>
        statement.replaceAll("IF NOT EXISTS ", "").replace(ANY_WHITESPACE, " ").trim()
      )
      .filter((statement) => A_SCHEMA_STATEMENT.test(statement))
      .map((statement) => {
        const [name = statement] = statement.split("(");

        return [name.trim(), statement];
      })
  );

const documentedSql = (document: string): string =>
  THE_DOCUMENTED_BLOCK.exec(document)?.[FIRST_GROUP] ?? "";

const createdSql = (source: string): string =>
  [...source.matchAll(AN_EXECUTED_BLOCK)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .join(BETWEEN_STATEMENTS);

export const schemaOutOfStepComplaints = (document: string, source: string): readonly string[] => {
  const documented = schemaStatementsIn(documentedSql(document));
  const created = schemaStatementsIn(createdSql(source));
  const names = new Set([...documented.keys(), ...created.keys()]);

  return [...names].flatMap((name) => {
    const inDocument = documented.get(name);
    const inSource = created.get(name);

    if (inDocument === undefined) {
      return [`${SPEC_DOCUMENT}: does not describe "${name}" from ${SCHEMA_SOURCE}`];
    }

    if (inSource === undefined) {
      return [`${SPEC_DOCUMENT}: describes "${name}", which ${SCHEMA_SOURCE} does not create`];
    }

    if (inDocument !== inSource) {
      return [
        `${SPEC_DOCUMENT}: "${name}" differs from ${SCHEMA_SOURCE} — the document must quote the running schema`,
      ];
    }

    return [];
  });
};

export const schemaOutOfStep = (): readonly string[] =>
  schemaOutOfStepComplaints(read(SPEC_DOCUMENT), read(SCHEMA_SOURCE));
