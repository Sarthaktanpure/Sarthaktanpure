const box = document.querySelector("#game");
const modes = {
  quiz() {
    box.innerHTML =
      '<h2>HTTP status check</h2><p>Which status code most commonly means a resource was created?</p><button onclick="answer(201)">201</button><button onclick="answer(200)">200</button><button onclick="answer(404)">404</button><p id="result"></p>';
  },
  terminal() {
    box.innerHTML =
      '<h2>Unlock the next prompt</h2><p>Type the command that lists files in a Unix-like terminal.</p><input id="cmd" autofocus placeholder="command"><p id="result"></p>';
    document.querySelector("#cmd").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        document.querySelector("#result").textContent =
          e.target.value.trim() === "ls"
            ? "✓ Access granted. Keep exploring."
            : "Try a command that means “list”.";
      }
    });
  },
};
function answer(n) {
  document.querySelector("#result").textContent =
    n === 201
      ? "✓ Correct — Created."
      : "Not quite. Think about the response after a successful POST.";
}
function show(name) {
  modes[name]();
  history.replaceState(null, "", "?game=" + name);
}
document
  .querySelectorAll("[data-game]")
  .forEach((b) => (b.onclick = () => show(b.dataset.game)));
show(new URLSearchParams(location.search).get("game") || "quiz");
