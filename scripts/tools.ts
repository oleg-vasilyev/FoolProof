import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { rasterize } from "#shared/drawing/rasterize.ts";
import { rootDir } from "#shared/config/env.ts";
import { repository } from "#shared/repository/repository-instance.ts";
import { measureAdvances } from "./measure-advances.ts";
import { ENGLISH_SUFFIX, refreshDesignPage } from "./design-page.ts";
import { GALLERY_DIR, POSTER_DIR } from "./drawn-into.ts";
import { drawnByName, everyDrawing, featuresThatDraw } from "./feature-drawings.ts";
import { SITE_CSS, SITE_CSS_SOURCE, buildSiteCss } from "./site-css.ts";
import { siteImageOf } from "./site-images.ts";
import { REPORTS_DIR, tidyReports } from "./tidy-reports.ts";
import {
  TOOLS_DIR,
  type Say,
  closingLine,
  toolLogPathOf,
  toolVerdictPathOf,
  verdictOfRun,
  type ToolVerdict,
} from "./tool-verdict.ts";


const AFTER_NODE_AND_SCRIPT = 2;

const TOOL_NAME = 0;

const PAGE_TO_READ = 1;

const FILE_TO_WRITE = 2;

const CHAT_TO_FORGET = 1;

const FAILED = 1;

const PASSED = 0;

const JSON_INDENT = 2;

const TOOLS_TRACE = "TOOLS_TRACE";

interface Tool {
  readonly does: string;
  readonly usage: string;
  run(args: readonly string[], say: Say): void | Promise<void>;
}

const writePosters = async (_args: readonly string[], say: Say): Promise<void> => {
  const directory = resolve(rootDir, POSTER_DIR);

  mkdirSync(directory, { recursive: true });

  for (const [name, svg] of Object.entries(await drawnByName((offered) => offered.posters()))) {
    writeFileSync(resolve(directory, `${name}.svg`), svg, "utf8");
    writeFileSync(resolve(directory, `${name}.webp`), await siteImageOf(svg));

    if (name.endsWith(ENGLISH_SUFFIX)) {
      writeFileSync(resolve(directory, `${name}.png`), await rasterize(svg));
    }

    say(`${POSTER_DIR}/${name}`);
  }
};

const drawGallery = async (_args: readonly string[], say: Say): Promise<void> => {
  const directory = resolve(rootDir, GALLERY_DIR);
  const drawings = await everyDrawing((offered) => offered.gallery());

  mkdirSync(directory, { recursive: true });

  for (const drawing of drawings) {
    writeFileSync(resolve(directory, `${drawing.file}.png`), await rasterize(drawing.svg));
    say(`${GALLERY_DIR}/${drawing.file}.png — ${drawing.asks}`);
  }
};

const A_WHOLE_NUMBER = /^-?\d+$/;

const forgetChat = (args: readonly string[], say: Say): void => {
  const asked = args[CHAT_TO_FORGET];

  if (asked === undefined || !A_WHOLE_NUMBER.test(asked)) {
    throw new Error("forget-chat needs the chat id of the group whose data should go");
  }

  const gone = repository.forgetChat(Number(asked));

  say(`chat ${asked}: forgot ${String(gone.games)} games and ${String(gone.players)} players`);
};

const TOOLS: Readonly<Record<string, Tool>> = {
  posters: {
    does:
      `draw the sample evening into ${POSTER_DIR}/ in every language — SVG and WebP for ` +
      "the site, PNG for the README",
    usage: "node scripts/tools.ts posters",
    run: writePosters,
  },
  "site-css": {
    does: `rebuild ${SITE_CSS} from ${SITE_CSS_SOURCE} and the classes the pages use`,
    usage: "node scripts/tools.ts site-css",
    run: (_args, say) => {
      buildSiteCss();
      say(`${SITE_CSS} — rebuilt`);
    },
  },
  gallery: {
    does: `draw every edge of every poster into ${GALLERY_DIR}/ for a human or an agent to look at`,
    usage: "node scripts/tools.ts gallery",
    run: drawGallery,
  },
  "tidy-reports": {
    does: `delete everything under ${REPORTS_DIR}/ that no config, script or agent names`,
    usage: "node scripts/tools.ts tidy-reports",
    run: (_args, say) => {
      tidyReports(say);
    },
  },
  advances: {
    does: "measure every glyph a name can carry against the shipped bold face, so text is fitted rather than guessed at",
    usage: "node scripts/tools.ts advances",
    run: (_args, say) => measureAdvances(say),
  },
  "forget-chat": {
    does: "delete one chat's games, players and language choice, leaving every other chat alone",
    usage: "node scripts/tools.ts forget-chat <chat id>",
    run: forgetChat,
  },
  "design-page": {
    does: "redraw every mockup on a Claude Design page, leaving its prose alone",
    usage: "node scripts/tools.ts design-page <page.html> <out.html>",
    run: async (args, say) => {
      const from = args[PAGE_TO_READ];
      const to = args[FILE_TO_WRITE];

      if (from === undefined || to === undefined) {
        throw new Error("design-page needs the page to read and the file to write");
      }

      await refreshDesignPage(from, to, say);
    },
  },
};

const offeredByFeatures = async (): Promise<readonly (readonly [string, Tool])[]> =>
  (await featuresThatDraw()).flatMap((offered) =>
    Object.entries(offered.tools).map(
      ([name, tool]) =>
        [
          name,
          {
            does: tool.does,
            usage: tool.usage,
            run: (args: readonly string[], say: Say) => {
              for (const line of tool.say(args)) {
                say(line);
              }
            },
          },
        ] as const
    )
  );

const NOTHING_TAKEN = 0;

const takenTwiceIn = (names: readonly string[]): readonly string[] =>
  names.filter((name, at) => names.indexOf(name) !== at);

const allOf = (offered: readonly (readonly [string, Tool])[]): Readonly<Record<string, Tool>> => {
  const taken = takenTwiceIn([...Object.keys(TOOLS), ...offered.map(([name]) => name)]);

  if (taken.length > NOTHING_TAKEN) {
    throw new Error(
      `two tools are offered under the name ${taken.join(", ")} — whichever loaded last ` +
        `would silently win, and the one nobody can reach looks exactly like a tool that works`
    );
  }

  return { ...TOOLS, ...Object.fromEntries(offered) };
};

const everyTool = allOf(await offeredByFeatures());

const listItself = (): void => {
  console.log("tools:");

  for (const [name, tool] of Object.entries(everyTool)) {
    console.log(`  ${name} — ${tool.does}`);
    console.log(`      ${tool.usage}`);
  }
};

const recorded = async (verb: string, tool: Tool, args: readonly string[]): Promise<ToolVerdict> => {
  const startedAt = new Date();
  const said: string[] = [];
  const say: Say = (line) => {
    said.push(line);
    console.log(line);
  };
  let error: unknown = null;

  try {
    await tool.run(args, say);
  } catch (thrown) {
    error = thrown;
  }

  const verdict = verdictOfRun(verb, args.slice(TOOL_NAME + 1), startedAt, new Date(), said, error);

  mkdirSync(resolve(rootDir, TOOLS_DIR), { recursive: true });
  writeFileSync(resolve(rootDir, toolLogPathOf(verb)), `${said.join("\n")}\n`, "utf8");
  writeFileSync(
    resolve(rootDir, toolVerdictPathOf(verb)),
    JSON.stringify(verdict, null, JSON_INDENT),
    "utf8"
  );

  if (error !== null && process.env[TOOLS_TRACE] !== undefined) {
    console.error(error);
  }

  console.log(closingLine(verdict));

  return verdict;
};

const args = process.argv.slice(AFTER_NODE_AND_SCRIPT);
const asked = args[TOOL_NAME];
const tool = asked === undefined ? undefined : everyTool[asked];

if (asked === undefined) {
  listItself();
} else if (tool === undefined) {
  console.error(`no tool called "${asked}"`);
  listItself();
  process.exit(FAILED);
} else {
  process.exit((await recorded(asked, tool, args)).ok ? PASSED : FAILED);
}
