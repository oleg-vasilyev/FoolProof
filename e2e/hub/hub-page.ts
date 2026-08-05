import { readFileSync } from "node:fs";
import { resolve } from "node:path";


const styles = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; height: 100vh; background: #0b1218; color: #e9edf2;
    font: 14px/1.4 -apple-system, "Segoe UI", Roboto, sans-serif;
    display: grid; grid-template-rows: auto 1fr; grid-template-columns: 300px 1fr;
    grid-template-areas: "head head" "list stage";
  }
  header {
    grid-area: head; padding: 12px 18px; background: #17212b; border-bottom: 1px solid #060b0f;
  }
  header b { font-size: 16px; }
  header span { color: #6d7f8f; margin-left: 10px; }
  #state { color: #d7a24c; }
  aside {
    grid-area: list; overflow-y: auto; background: #101a23; border-right: 1px solid #060b0f;
    padding: 8px;
  }
  aside h2 {
    font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6d7f8f;
    margin: 14px 8px 6px;
  }
  .pick {
    display: flex; gap: 8px; align-items: baseline; width: 100%; text-align: left;
    padding: 7px 9px; border: 0; border-radius: 8px; background: none; color: #c7d3de;
    font: inherit; cursor: pointer;
  }
  .pick:hover { background: #17212b; }
  .pick.on { background: #23405c; color: #fff; }
  .pick .mark { width: 12px; flex: none; color: #6d7f8f; }
  .pick.passed .mark { color: #4caf7d; }
  .pick.failed .mark { color: #ff7b7b; }
  .pick.running .mark { color: #8fc7ff; }
  .pick .name { min-width: 0; }
  #stage { grid-area: stage; min-width: 0; overflow: hidden; }
  #grid {
    height: 100%; display: grid; gap: 10px; padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  }
  .world { display: flex; flex-direction: column; border: 1px solid #1d2b38; border-radius: 10px; overflow: hidden; }
  .top { padding: 8px 12px; background: #17212b; display: flex; align-items: baseline; gap: 10px; }
  .top b { font-size: 13px; }
  .top a { color: #6d7f8f; font-size: 12px; margin-left: auto; }
  .step { color: #8fc7ff; font-size: 12px; }
  .running { border-color: #2c4f74; }
  .failed { border-color: #a33; }
  .passed { border-color: #2d6a4a; }
  .waiting { opacity: .55; }
  .finished { border-color: #2a3a48; }
  .finished .top b::after { content: " · finished"; color: #6d7f8f; font-weight: 400; }
  iframe { flex: 1; border: 0; background: #0e1621; width: 100%; height: 100%; }
  #one { height: 100%; padding: 10px; }
  #none { padding: 40px; color: #6d7f8f; }
  body.stopped #stage { opacity: .55; }
`;

const script = readFileSync(resolve(import.meta.dirname, "..", "pages", "hub-client.js"), "utf8");


export const hubPage = (): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>FoolProof e2e — every world at once</title>
<style>${styles}</style>
</head>
<body>
<header>
  <b>FoolProof e2e</b>
  <span>the real bot on each · nothing reaches a real Telegram</span>
  <span id="state"></span>
</header>
<aside id="list"></aside>
<div id="stage">
  <div id="grid"></div>
  <div id="one" style="display:none"></div>
  <div id="none">No world is running yet. Scenarios appear here as workers pick them up, and stay after the run ends.</div>
</div>
<script type="module">${script}</script>
</body>
</html>
`;
