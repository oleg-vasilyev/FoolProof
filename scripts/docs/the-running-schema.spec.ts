import { describe, expect, it } from "vitest";
import { schemaOutOfStepComplaints } from "./the-running-schema.ts";


const FIRST = 0;

const ONE_COMPLAINT = 1;

const DOCUMENT_HEADER = "## Data model\n\n```sql\n";

const FENCE_CLOSE = "\n```\n";

const documentWithSql = (sql: string): string => `${DOCUMENT_HEADER}${sql}${FENCE_CLOSE}`;

const sourceWithExec = (sql: string): string => `db.exec(\`${sql}\`);`;

describe("schemaOutOfStepComplaints", () => {
  it("should say nothing when the document quotes the table exactly as the source creates it", () => {
    const sql = "CREATE TABLE games (id INTEGER PRIMARY KEY);";

    expect(schemaOutOfStepComplaints(documentWithSql(sql), sourceWithExec(sql))).toEqual([]);
  });

  it("should say nothing when only formatting differs — extra whitespace and IF NOT EXISTS", () => {
    const document = documentWithSql("CREATE TABLE games (id INTEGER PRIMARY KEY);");
    const source = sourceWithExec("CREATE TABLE IF NOT EXISTS games (id   INTEGER PRIMARY KEY);");

    expect(schemaOutOfStepComplaints(document, source)).toEqual([]);
  });

  it("should say nothing when neither side declares any table at all", () => {
    expect(schemaOutOfStepComplaints("", "")).toEqual([]);
  });

  it("should name a table the source creates that the document never describes", () => {
    const document = documentWithSql("");
    const source = sourceWithExec("CREATE TABLE games (id INTEGER PRIMARY KEY);");

    const complaints = schemaOutOfStepComplaints(document, source);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"CREATE TABLE games"');
    expect(complaints[FIRST]).toContain("PLAN.md: does not describe");
    expect(complaints[FIRST]).toContain("src/shared/repository/sqlite-connection.ts");
  });

  it("should name a table the document describes that the source never creates", () => {
    const document = documentWithSql("CREATE TABLE games (id INTEGER PRIMARY KEY);");
    const source = sourceWithExec("");

    const complaints = schemaOutOfStepComplaints(document, source);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"CREATE TABLE games"');
    expect(complaints[FIRST]).toContain("which src/shared/repository/sqlite-connection.ts does not create");
  });

  it("should name a table whose columns differ between the document and the source", () => {
    const document = documentWithSql("CREATE TABLE games (id INTEGER PRIMARY KEY);");
    const source = sourceWithExec(
      "CREATE TABLE games (id INTEGER PRIMARY KEY, chat_id INTEGER);"
    );

    const complaints = schemaOutOfStepComplaints(document, source);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"CREATE TABLE games"');
    expect(complaints[FIRST]).toContain("the document must quote the running schema");
  });

  it("should not read the heading as the schema block unless a sql fence follows it directly", () => {
    const document = "## Data model\n\nprose about the schema, but no fence here.\n";
    const source = sourceWithExec("CREATE TABLE games (id INTEGER PRIMARY KEY);");

    const complaints = schemaOutOfStepComplaints(document, source);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("does not describe");
  });

  it("should ignore a statement that is not a CREATE TABLE, INDEX or UNIQUE INDEX", () => {
    const document = documentWithSql("PRAGMA foreign_keys = ON;");
    const source = sourceWithExec("PRAGMA foreign_keys = ON;");

    expect(schemaOutOfStepComplaints(document, source)).toEqual([]);
  });

  it("should read a CREATE UNIQUE INDEX statement as agreeing when both sides match", () => {
    const sql = "CREATE UNIQUE INDEX games_chat_id ON games (chat_id);";

    expect(schemaOutOfStepComplaints(documentWithSql(sql), sourceWithExec(sql))).toEqual([]);
  });

  it("should join two exec blocks in the source into one schema, and flag only the one that changed", () => {
    const document = documentWithSql(
      "CREATE TABLE games (id INTEGER PRIMARY KEY);\nCREATE TABLE players (id INTEGER PRIMARY KEY);"
    );
    const source =
      sourceWithExec("CREATE TABLE games (id INTEGER PRIMARY KEY);") +
      sourceWithExec("CREATE TABLE players (id INTEGER PRIMARY KEY, name TEXT);");

    const complaints = schemaOutOfStepComplaints(document, source);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"CREATE TABLE players"');
  });
});
