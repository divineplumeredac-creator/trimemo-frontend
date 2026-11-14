const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const files = ["src/App.tsx","src/AdminDashboard.tsx","src/MarketingHome.tsx","src/index.css"];

test("le vieux rose est supprimé de toutes les pages Trimémo", () => {
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    assert.ok(!/#C08081/i.test(source), path + " contient encore le vieux rose");
    assert.ok(source.includes("#1B4D3E"), path + " devrait utiliser le vert anglais");
  }
});
test("les trois couleurs de marque restent définies", () => {
  const css = readFileSync("src/index.css", "utf8");
  assert.match(css, /--trimemo-rose-fonce:\s*#87464B/);
  assert.match(css, /--trimemo-vert-anglais:\s*#1B4D3E/);
  assert.match(css, /--trimemo-blanc:\s*#FFFFFF/);
  assert.match(css, /::selection \{ background: var\(--trimemo-vert-anglais\); color: var\(--trimemo-blanc\); \}/);
});
test("les alertes d'erreur ne passent pas au vert", () => {
  const app = readFileSync("src/App.tsx","utf8");
  const admin = readFileSync("src/AdminDashboard.tsx","utf8");
  assert.doesNotMatch(app, /border border-\[#1B4D3E\] bg-\[#1B4D3E\]\/15/);
  assert.match(admin, /danger:"bg-\[#87464B\]\/15/);
  assert.match(admin, /red:"bg-\[#87464B\]\/15/);
});
