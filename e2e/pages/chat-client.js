const BASE = document.body.dataset.base;

const feed = document.getElementById("feed");
const box = /** @type {HTMLInputElement} */ (document.getElementById("box"));
const toast = document.getElementById("toast");
const menu = document.getElementById("menu");
const replying = document.getElementById("replying");
const banner = document.getElementById("banner");

let answersSeen = 0;
let standing = null;
let feedShown = "";
let menuShown = "";

const post = (path, body) =>
  fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const flash = (text) => {
  toast.textContent = text;
  toast.classList.add("on");
  setTimeout(() => toast.classList.remove("on"), 1800);
};

const keyboard = (rows, messageId) => {
  if (rows.length === 0) return "";
  const row = (buttons) => buttons.map((b) =>
    '<button data-message="' + messageId + '" data-tap="' + b.data + '">' + b.text + "</button>").join("");
  return '<div class="keys">' + rows.map((r) => "<div>" + row(r) + "</div>").join("") + "</div>";
};

const divider = (name) =>
  '<div class="divider"><span>' + name + "</span></div>";

const bubble = (m) =>
  '<div class="msg' + (m.fromBot ? '' : ' mine') + '">' +
    '<div class="who">' + m.author + " · #" + m.messageId + "</div>" +
    '<div class="body">' + m.text + "</div>" +
    (m.photo === null ? "" : '<img src="' + BASE + 'photo/' + m.photo + '" alt="scoresheet">') +
    keyboard(m.buttons, m.messageId) +
    (m.edits > 0 ? '<div class="edits">edited ' + m.edits + "×</div>" : "") +
  "</div>";

// A world plays several scenarios into one chat. ?scenario=N narrows the page to
// one of them, which is what the hub links to when a scenario is opened on its own.
const ONLY = new URLSearchParams(location.search).get("scenario");

const headline = (state) => {
  if (ONLY === null) return state.banner;
  const at = Number(ONLY) - 1;
  const named = state.scenarios[at];
  if (!named) return state.banner;
  return { scenario: named, step: "", verdict: state.verdicts[at] ?? "waiting", detail: null };
};

const draw = (state) => {
  const head = headline(state);
  if (head) {
    banner.className = head.verdict;
    banner.innerHTML = "<b>" + head.scenario + "</b> <span>" +
      (head.detail ?? head.step) + "</span>";

    const mark = { passed: "✓ ", failed: "✗ ", running: "", waiting: "" }[head.verdict] ?? "";
    document.title = mark + head.scenario;
  }

  const shown = ONLY === null
    ? state.messages
    : state.messages.filter((m) => String(m.scenario) === ONLY);

  let shownScenario = -1;
  const feedNext = shown.map((m) => {
    const opening = m.scenario === shownScenario ? "" : divider(state.scenarios[m.scenario - 1] ?? "by hand");
    shownScenario = m.scenario;
    return opening + bubble(m);
  }).join("");
  if (feedNext !== feedShown) {
    const atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
    feed.innerHTML = feedNext;
    feedShown = feedNext;
    if (atBottom) feed.scrollTop = feed.scrollHeight;
  }

  const menuNext = state.commands.length === 0
    ? "<li>nothing published yet</li>"
    : state.commands.map((c) => "<li><code>/" + c.command + "</code> " + c.description + "</li>").join("");
  if (menuNext !== menuShown) {
    menu.innerHTML = menuNext;
    menuShown = menuNext;
  }

  if (state.answers.length > answersSeen) {
    const latest = state.answers[state.answers.length - 1];
    if (latest) flash(latest);
  }
  answersSeen = state.answers.length;

  standing = state.prompt;
  box.placeholder = standing ? standing.placeholder : "Message";
  replying.textContent = standing ? "replying to #" + standing.messageId : "";
};

feed.addEventListener("click", (event) => {
  const button = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (event.target).closest("button[data-tap]"));
  if (!button) return;
  post(BASE + "chat/tap", { messageId: Number(button.dataset.message), data: button.dataset.tap });
});

const send = () => {
  const text = box.value.trim();
  if (!text) return;
  box.value = "";
  post(BASE + "chat/say", { text, replyTo: standing ? standing.messageId : undefined });
};

document.getElementById("send")?.addEventListener("click", send);
box.addEventListener("keydown", (event) => { if (event.key === "Enter") send(); });

// Whatever this writes into the feed has to be written into feedShown too. It
// used to leave feedShown at "", so one failed poll while the chat was still
// empty pinned the notice there: the next good poll computed the same "" and
// decided nothing had changed.
const nothingHere = (why) => {
  banner.className = "waiting";
  banner.innerHTML = "<b>" + why + "</b>";
  if (feedShown === "") {
    feedShown = '<div class="divider"><span>' + why + "</span></div>";
    feed.innerHTML = feedShown;
  }
};

// Never off the browser's cache: the hub answers 410 for a world it has not swept
// yet, a 410 is cacheable, and a tab that asked one moment too early then stopped
// asking for as long as it stayed open.
const POLL_MS = 350;
const tick = () =>
  fetch(BASE + "chat/state", { cache: "no-store" })
    .then((r) => (r.ok ? r.json().then(draw) : nothingHere("this world has not started yet")))
    .catch(() => nothingHere("the run has stopped — this page is a leftover"));
setInterval(tick, POLL_MS);
tick();

export {};
