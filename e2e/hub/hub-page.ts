const styles = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; background: #0b1218; color: #e9edf2;
    font: 14px/1.4 -apple-system, "Segoe UI", Roboto, sans-serif;
    display: flex; flex-direction: column;
  }
  header { padding: 12px 18px; background: #17212b; border-bottom: 1px solid #060b0f; }
  header b { font-size: 16px; }
  header span { color: #6d7f8f; margin-left: 10px; }
  #grid { flex: 1; display: grid; gap: 10px; padding: 10px; grid-template-columns: repeat(auto-fit, minmax(520px, 1fr)); }
  .world { display: flex; flex-direction: column; border: 1px solid #1d2b38; border-radius: 10px; overflow: hidden; min-height: 70vh; }
  .top { padding: 8px 12px; background: #17212b; display: flex; align-items: baseline; gap: 10px; }
  .top b { font-size: 13px; }
  .top a { color: #6d7f8f; font-size: 12px; margin-left: auto; }
  .step { color: #8fc7ff; font-size: 12px; }
  .running { border-color: #2c4f74; }
  .failed { border-color: #a33; }
  .passed { border-color: #2d6a4a; }
  .failed .top { background: #2a1416; }
  .waiting { opacity: .55; }
  .finished { border-color: #2a3a48; }
  .finished .top b::after { content: " · finished"; color: #6d7f8f; font-weight: 400; }
  iframe { flex: 1; border: 0; background: #0e1621; }
  #none { padding: 40px; color: #6d7f8f; }
`;

const script = `
  const grid = document.getElementById("grid");
  const none = document.getElementById("none");
  const drawn = new Map();

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

  const paint = (worlds) => {
    none.style.display = worlds.length === 0 ? "block" : "none";

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
  };

  const POLL_MS = 500;
  const tick = () => fetch("/worlds").then((r) => r.json()).then(paint).catch(() => undefined);
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
  <span>one chat per worker · the real bot on each · nothing reaches a real Telegram</span>
</header>
<div id="grid"></div>
<div id="none">No world is running yet. Scenarios appear here as workers pick them up, and stay after the run ends.</div>
<script>${script}</script>
</body>
</html>
`;
