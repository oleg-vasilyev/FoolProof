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

const script = `
  const list = document.getElementById("list");
  const grid = document.getElementById("grid");
  const one = document.getElementById("one");
  const none = document.getElementById("none");
  const state = document.getElementById("state");
  const drawn = new Map();

  let chosen = null;
  let listShown = "";
  let stageShown = "";

  const MARKS = { passed: "✓", failed: "✗", running: "▸", waiting: "·" };

  const frame = (world) => {
    const box = document.createElement("div");
    box.className = "world";
    box.innerHTML =
      '<div class="top"><b></b><span class="step"></span>' +
      '<a target="_blank" href="' + world.url + '">open on its own ↗</a></div>' +
      '<iframe src="' + world.url + '"></iframe>';
    grid.appendChild(box);
    return box;
  };

  const stage = (worlds) => {
    const wanted = chosen === null ? "" : chosen.port + "/" + chosen.index;
    if (wanted === stageShown) return;
    stageShown = wanted;

    grid.style.display = chosen === null ? "" : "none";
    one.style.display = chosen === null ? "none" : "";
    one.innerHTML = chosen === null
      ? ""
      : '<iframe src="/world/' + chosen.port + '/?scenario=' + chosen.index + '"></iframe>';
  };

  const rows = (worlds) => {
    const parts = ['<h2>everything at once</h2>',
      '<button class="pick' + (chosen === null ? " on" : "") + '" data-all="1">' +
      '<span class="mark">▦</span><span class="name">every world, live</span></button>'];

    for (const world of worlds) {
      parts.push('<h2>port ' + world.port + '</h2>');
      for (const played of world.played) {
        const on = chosen !== null && chosen.port === world.port && chosen.index === played.index;
        parts.push(
          '<button class="pick ' + played.verdict + (on ? " on" : "") + '"' +
          ' data-port="' + world.port + '" data-scenario="' + played.index + '">' +
          '<span class="mark">' + (MARKS[played.verdict] ?? "·") + '</span>' +
          '<span class="name">' + played.name + "</span></button>"
        );
      }
    }

    return parts.join("");
  };

  const paint = (worlds) => {
    none.style.display = worlds.length === 0 ? "block" : "none";

    const listNext = rows(worlds);
    if (listNext !== listShown) {
      list.innerHTML = listNext;
      listShown = listNext;
    }

    for (const world of worlds) {
      const box = drawn.get(world.port) ?? frame(world);
      drawn.set(world.port, box);
      box.className = "world " + (world.live ? world.banner.verdict : "finished");
      box.querySelector("b").textContent = world.banner.scenario;
      box.querySelector(".step").textContent = world.banner.detail ?? world.banner.step;
    }

    for (const [port, box] of drawn) {
      if (!worlds.some((world) => world.port === port)) {
        box.remove();
        drawn.delete(port);
      }
    }

    stage(worlds);
  };

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button.pick");
    if (!button) return;
    chosen = button.dataset.all
      ? null
      : { port: Number(button.dataset.port), index: Number(button.dataset.scenario) };
    listShown = "";
    tick();
  });

  const answering = (yes) => {
    document.body.className = yes ? "" : "stopped";
    state.textContent = yes ? "" : "the run has stopped — closing this tab loses nothing";
  };

  const POLL_MS = 500;
  const tick = () =>
    fetch("/worlds", { cache: "no-store" })
      .then((r) => r.json())
      .then((worlds) => { answering(true); paint(worlds); })
      .catch(() => answering(false));
  setInterval(tick, POLL_MS);
  tick();
`;

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
<script>${script}</script>
</body>
</html>
`;
