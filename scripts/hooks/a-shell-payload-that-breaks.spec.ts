import { describe, expect, it } from "vitest";
import {
  A_BACKSLASH_INSIDE,
  A_NON_ASCII_INSIDE,
  payloadsIn,
  shellPayloadThatBreaks,
  whatBreaksIn,
} from "./a-shell-payload-that-breaks.ts";


const TWO_PAYLOADS = 2;

const ONE_PAYLOAD = 1;

const FIRST = 0;

const VERBATIM = true;

const REWRITTEN = false;

const A_QUOTED_HEREDOC = ["git commit -F - <<'EOF'", "Title", "", "a \\b line", "EOF"].join("\n");

const A_QUOTED_HEREDOC_IN_RUSSIAN = ["git commit -F - <<'EOF'", "Партия", "EOF"].join("\n");

const AN_UNQUOTED_HEREDOC = ["cat > x.txt <<EOF", "a \\b line", "EOF"].join("\n");

const A_DASHED_HEREDOC = ["cat <<-EOF", "\tкириллица", "\tEOF"].join("\n");

describe("payloadsIn", () => {
  it("should take the quoted payload of node -e", () => {
    expect(payloadsIn("node -e 'console.log(1)' && echo done")).toEqual([
      { shape: "node -e '", text: "console.log(1)", verbatim: REWRITTEN },
    ]);
  });

  it("should take the payload of --eval, -p and python -c as well", () => {
    const command = 'node --eval "a" ; node -p "b" ; python -c "c" ; python3 -c "d"';

    expect(payloadsIn(command).map((payload) => payload.text)).toEqual(["a", "b", "c", "d"]);
  });

  it("should take the body of an unquoted heredoc up to its terminator", () => {
    expect(payloadsIn(AN_UNQUOTED_HEREDOC)).toEqual([
      { shape: "<<EOF", text: "a \\b line", verbatim: REWRITTEN },
    ]);
  });

  it("should take the body of a dashed heredoc, whose terminator may be indented", () => {
    expect(payloadsIn(A_DASHED_HEREDOC)).toEqual([
      { shape: "<<EOF", text: "\tкириллица", verbatim: REWRITTEN },
    ]);
  });

  it("should take a quoted heredoc's body too, marked as one the shell leaves verbatim", () => {
    expect(payloadsIn(A_QUOTED_HEREDOC)).toEqual([
      { shape: "<<EOF", text: "Title\n\na \\b line", verbatim: VERBATIM },
    ]);
  });

  it("should read a backslash-escaped delimiter as quoted the same way", () => {
    expect(payloadsIn("cat <<\\EOF\na \\b\nEOF")).toEqual([
      { shape: "<<EOF", text: "a \\b", verbatim: VERBATIM },
    ]);
  });

  it("should not read a here-string as a heredoc", () => {
    expect(payloadsIn("cat <<<word")).toEqual([]);
  });

  it("should take the rest of the command when a heredoc never terminates", () => {
    expect(payloadsIn("cat <<EOF\nfirst\nsecond")).toEqual([
      { shape: "<<EOF", text: "first\nsecond", verbatim: REWRITTEN },
    ]);
  });

  it("should not read an opener inside an unterminated body as a second heredoc", () => {
    expect(payloadsIn("cat <<A\nline <<B\nbroken")).toHaveLength(ONE_PAYLOAD);
  });

  it("should take the rest of the command when a quote never closes", () => {
    expect(payloadsIn("node -e 'open")).toEqual([
      { shape: "node -e '", text: "open", verbatim: REWRITTEN },
    ]);
  });

  it("should find both an evaluator and a heredoc in one command", () => {
    expect(payloadsIn("node -e 'x' <<EOF\nbody\nEOF")).toHaveLength(TWO_PAYLOADS);
  });

  it("should find a heredoc that follows a closed one", () => {
    const command = ["cat <<'A'", "safe", "A", "cat <<B", "second", "B"].join("\n");

    expect(payloadsIn(command).map((payload) => payload.shape)).toEqual(["<<A", "<<B"]);
  });

  it("should not read a word that merely ends in node as an evaluator", () => {
    expect(payloadsIn("mynode -e 'x'")).toEqual([]);
  });

  it("should name the evaluator without the separator that came before it", () => {
    expect(payloadsIn("echo x && node -e 'y'")).toEqual([
      { shape: "node -e '", text: "y", verbatim: REWRITTEN },
    ]);
  });

  it("should read an evaluator however much space was typed between its words", () => {
    const command = "node   -e   'a' ; python3   -c   'b'";

    expect(payloadsIn(command).map((payload) => payload.text)).toEqual(["a", "b"]);
  });
});

describe("whatBreaksIn", () => {
  it("should name a backslash", () => {
    expect(whatBreaksIn("a \\n b", REWRITTEN)).toBe(A_BACKSLASH_INSIDE);
  });

  it("should name a backslash in a body the shell leaves verbatim too, since the loss is downstream", () => {
    expect(whatBreaksIn("a \\n b", VERBATIM)).toBe(A_BACKSLASH_INSIDE);
  });

  it("should name a non-ASCII character", () => {
    expect(whatBreaksIn("партия", REWRITTEN)).toBe(A_NON_ASCII_INSIDE);
  });

  it("should let non-ASCII through a body the shell leaves verbatim", () => {
    expect(whatBreaksIn("партия", VERBATIM)).toBeNull();
  });

  it("should name the backslash first when both are there", () => {
    expect(whatBreaksIn("\\ партия", REWRITTEN)).toBe(A_BACKSLASH_INSIDE);
  });

  it("should pass plain ASCII, apostrophes included", () => {
    expect(whatBreaksIn("it's done", REWRITTEN)).toBeNull();
  });
});

describe("shellPayloadThatBreaks", () => {
  it("should refuse a backslash even in a quoted heredoc", () => {
    expect(shellPayloadThatBreaks(A_QUOTED_HEREDOC)).toContain("<<EOF carries a backslash");
  });

  it("should pass a quoted heredoc carrying only non-ASCII", () => {
    expect(shellPayloadThatBreaks(A_QUOTED_HEREDOC_IN_RUSSIAN)).toBeNull();
  });

  it("should pass a quoted heredoc whose prose mentions an unquoted opener, since the body is one payload", () => {
    const command = [
      "git commit -F - <<'MSG'",
      "Refuse a heredoc written as <<EOF when its body",
      "carries Cyrillic — кириллицу.",
      "MSG",
    ].join("\n");

    expect(shellPayloadThatBreaks(command)).toBeNull();
  });

  it("should not re-read a quoted body's last line once the heredoc has closed", () => {
    const command = [
      "git commit -F - <<'MSG'",
      "a body whose last line mentions <<EOF",
      "MSG",
      "echo 'back \\ slash outside any heredoc'",
    ].join("\n");

    expect(shellPayloadThatBreaks(command)).toBeNull();
  });

  it("should name an unterminated heredoc once, whatever openers its body mentions", () => {
    const said = shellPayloadThatBreaks("cat <<A\nline <<B\nbroken \\") ?? "";

    expect(said.split(";")).toHaveLength(ONE_PAYLOAD);
    expect(said).toContain("<<A carries a backslash");
  });

  it("should still read an unquoted heredoc that follows a quoted one", () => {
    const command = [
      "cat <<'A'",
      "safe here",
      "A",
      "cat <<B",
      "broken \\ here",
      "B",
    ].join("\n");

    expect(shellPayloadThatBreaks(command)).toContain("<<B carries a backslash");
  });

  it("should refuse an unquoted heredoc carrying a backslash", () => {
    const said = shellPayloadThatBreaks(AN_UNQUOTED_HEREDOC);

    expect(said).toContain("<<EOF carries a backslash");
    expect(said).toContain("Use Edit or Write for");
  });

  it("should refuse node -e carrying Cyrillic", () => {
    const said = shellPayloadThatBreaks("node -e 'console.log(\"партия\")'");

    expect(said).toContain("node -e ' carries a non-ASCII character");
  });

  it("should pass node -e carrying plain ASCII", () => {
    expect(shellPayloadThatBreaks("node -e 'console.log(1 + 1)'")).toBeNull();
  });

  it("should pass an ordinary commit message", () => {
    expect(shellPayloadThatBreaks("git commit -m \"it's done\"")).toBeNull();
  });

  it("should pass a command with no payload at all", () => {
    expect(shellPayloadThatBreaks("npm run lint && npm test")).toBeNull();
  });

  it("should say what the refusal is about and where the content goes instead", () => {
    const said = shellPayloadThatBreaks("python -c 'print(\"ё\")'") ?? "";

    expect(said.split("\n")[FIRST]).toBe("Refused: python -c ' carries a non-ASCII character.");
    expect(said).toContain("inside an inline evaluator or an unquoted");
    expect(said).toContain("rewritten by the shell on the way in");
    expect(said).toContain("the loss is downstream of the shell. Use Edit or Write for");
    expect(said).toContain("write the payload to a file and run the file");
    expect(said).toContain("delimiter (<<'EOF') when non-ASCII is all the body carries.");
  });

  it("should name every payload that breaks, not only the first", () => {
    const said = shellPayloadThatBreaks("node -e 'ё' <<EOF\na \\b\nEOF") ?? "";

    expect(said.split(";")).toHaveLength(TWO_PAYLOADS);
    expect(said).toContain("node -e ' carries a non-ASCII character");
    expect(said).toContain("<<EOF carries a backslash");
  });
});
