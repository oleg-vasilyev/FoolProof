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

const stage = () => {
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

  stage();
};

list.addEventListener("click", (event) => {
  const button = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (event.target).closest("button.pick"));
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

export {};
