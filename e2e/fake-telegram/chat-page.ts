const styles = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; height: 100vh; display: grid; grid-template-columns: 1fr 260px;
    font: 15px/1.45 -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #0e1621; color: #e9edf2;
  }
  main { display: flex; flex-direction: column; min-width: 0; }
  header {
    padding: 10px 16px; background: #17212b; border-bottom: 1px solid #0b1218;
    display: flex; align-items: center; gap: 10px;
  }
  header b { font-weight: 600; }
  header span { color: #6d7f8f; font-size: 13px; }
  #feed { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .msg { max-width: 620px; padding: 8px 12px; border-radius: 12px; background: #182533; }
  .msg.mine { align-self: flex-end; background: #2b5278; }
  .who { font-size: 12px; color: #7aa6d0; margin-bottom: 2px; }
  .body { white-space: pre-wrap; word-break: break-word; }
  .msg img { display: block; margin-top: 8px; max-width: 100%; border-radius: 8px; background: #fff; }
  .keys { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
  .keys div { display: flex; gap: 4px; }
  .keys button {
    flex: 1; padding: 8px 6px; border: 0; border-radius: 8px; cursor: pointer;
    background: #23405c; color: #dce6f0; font: inherit; font-size: 14px;
  }
  .keys button:hover { background: #2f5479; }
  .edits { font-size: 11px; color: #56697a; margin-top: 4px; }
  .divider { display: flex; align-items: center; gap: 10px; margin: 14px 0 4px; color: #6d7f8f; font-size: 12px; }
  .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #1d2b38; }
  .divider span { white-space: nowrap; }
  footer { padding: 12px 16px; background: #17212b; display: flex; gap: 8px; }
  footer input {
    flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid #24313d;
    background: #0e1621; color: inherit; font: inherit;
  }
  footer button {
    padding: 10px 18px; border: 0; border-radius: 10px; cursor: pointer;
    background: #3a7fbf; color: #fff; font: inherit;
  }
  aside { background: #17212b; border-left: 1px solid #0b1218; padding: 14px; overflow-y: auto; }
  aside h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6d7f8f; margin: 0 0 8px; }
  aside section { margin-bottom: 22px; }
  aside code { color: #8fc7ff; }
  aside li { list-style: none; margin-bottom: 6px; font-size: 13px; }
  aside ul { padding: 0; margin: 0; }
  #toast {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 84px;
    background: #000c; padding: 8px 16px; border-radius: 20px; font-size: 14px;
    opacity: 0; transition: opacity .2s;
  }
  #toast.on { opacity: 1; }
  #replying { padding: 6px 16px; background: #17212b; color: #7aa6d0; font-size: 12px; }
  #banner { padding: 6px 16px; background: #14202b; border-bottom: 1px solid #0b1218; font-size: 12px; }
  #banner b { color: #dce6f0; }
  #banner span { color: #8fc7ff; margin-left: 8px; }
  #banner.failed { background: #2a1416; }
  #banner.failed span { color: #ff9b9b; }
`;

const script = (base: string): string => `
  const BASE = ${JSON.stringify(base)};

  const feed = document.getElementById("feed");
  const box = document.getElementById("box");
  const toast = document.getElementById("toast");
  const menu = document.getElementById("menu");
  const replying = document.getElementById("replying");
  const banner = document.getElementById("banner");

  let answersSeen = 0;
  let prompt = null;
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

  const draw = (state) => {
    if (state.banner) {
      banner.className = state.banner.verdict;
      banner.innerHTML = "<b>" + state.banner.scenario + "</b> <span>" +
        (state.banner.detail ?? state.banner.step) + "</span>";

      const mark = { passed: "✓ ", failed: "✗ ", running: "", waiting: "" }[state.banner.verdict] ?? "";
      document.title = mark + state.banner.scenario;
    }

    let shownScenario = -1;
    const feedNext = state.messages.map((m) => {
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

    prompt = state.prompt;
    box.placeholder = prompt ? prompt.placeholder : "Message";
    replying.textContent = prompt ? "replying to #" + prompt.messageId : "";
  };

  feed.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tap]");
    if (!button) return;
    post(BASE + "chat/tap", { messageId: Number(button.dataset.message), data: button.dataset.tap });
  });

  const send = () => {
    const text = box.value.trim();
    if (!text) return;
    box.value = "";
    post(BASE + "chat/say", { text, replyTo: prompt ? prompt.messageId : undefined });
  };

  document.getElementById("send").addEventListener("click", send);
  box.addEventListener("keydown", (event) => { if (event.key === "Enter") send(); });

  const nothingHere = (why) => {
    banner.className = "waiting";
    banner.innerHTML = "<b>" + why + "</b>";
    if (feed.innerHTML === "") feed.innerHTML = '<div class="divider"><span>' + why + "</span></div>";
  };

  const POLL_MS = 350;
  const tick = () =>
    fetch(BASE + "chat/state")
      .then((r) => (r.ok ? r.json().then(draw) : nothingHere("no world is running on this port")))
      .catch(() => nothingHere("the fake Telegram is not answering"));
  setInterval(tick, POLL_MS);
  tick();
`;

export const chatPage = (base = "/"): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FoolProof — fake Telegram</title>
<style>${styles}</style>
</head>
<body>
<main>
  <header><b>Friday</b><span>group · fake Telegram, nothing here reaches a real chat</span></header>
  <div id="banner"></div>
  <div id="feed"></div>
  <div id="replying"></div>
  <footer>
    <input id="box" placeholder="Message" autocomplete="off">
    <button id="send">Send</button>
  </footer>
</main>
<aside>
  <section>
    <h2>The / menu</h2>
    <ul id="menu"></ul>
  </section>
  <section>
    <h2>Try</h2>
    <ul>
      <li><code>/game Oleg, Anya, Roma</code></li>
      <li><code>/game</code> then reply with names</li>
      <li><code>/next</code> · <code>/stats</code> · <code>/help</code> · <code>/status</code></li>
    </ul>
  </section>
</aside>
<div id="toast"></div>
<script>${script(base)}</script>
</body>
</html>
`;
