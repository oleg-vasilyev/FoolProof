import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { rasterize } from "#scoresheet/bot/rasterizer.ts";
import { rootDir } from "#shared/config/env.ts";
import { refreshDesignPage } from "./design-page.ts";
import { MOCKUP_DIR, posters } from "./mockups.ts";


const AFTER_NODE_AND_SCRIPT = 2;

const TOOL_NAME = 0;

const PAGE_TO_READ = 1;

const FILE_TO_WRITE = 2;

const FAILED = 1;

interface Tool {
  readonly does: string;
  readonly usage: string;
  run(args: readonly string[]): void;
}

const writeMockups = (): void => {
  const directory = resolve(rootDir, MOCKUP_DIR);

  mkdirSync(directory, { recursive: true });

  for (const [name, svg] of Object.entries(posters())) {
    writeFileSync(resolve(directory, `${name}.svg`), svg, "utf8");
    writeFileSync(resolve(directory, `${name}.png`), rasterize(svg));
    console.log(`${MOCKUP_DIR}/${name}.png`);
  }
};

const TOOLS: Readonly<Record<string, Tool>> = {
  mockups: {
    does: `draw the sample evening into ${MOCKUP_DIR}/ as SVG and PNG`,
    usage: "node scripts/tools.ts mockups",
    run: writeMockups,
  },
  "design-page": {
    does: "redraw every mockup on a Claude Design page, leaving its prose alone",
    usage: "node scripts/tools.ts design-page <page.html> <out.html>",
    run: (args) => {
      const from = args[PAGE_TO_READ];
      const to = args[FILE_TO_WRITE];

      if (from === undefined || to === undefined) {
        throw new Error("design-page needs the page to read and the file to write");
      }

      refreshDesignPage(from, to);
    },
  },
};

const listItself = (): void => {
  console.log("tools:");

  for (const [name, tool] of Object.entries(TOOLS)) {
    console.log(`  ${name} — ${tool.does}`);
    console.log(`      ${tool.usage}`);
  }
};

const args = process.argv.slice(AFTER_NODE_AND_SCRIPT);
const asked = args[TOOL_NAME];
const tool = asked === undefined ? undefined : TOOLS[asked];

if (asked === undefined) {
  listItself();
} else if (tool === undefined) {
  console.error(`no tool called "${asked}"`);
  listItself();
  process.exit(FAILED);
} else {
  tool.run(args);
}
