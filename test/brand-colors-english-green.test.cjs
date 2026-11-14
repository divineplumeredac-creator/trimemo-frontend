const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const files = ["src/App.tsx", "src/AdminDashboard.tsx", "src/MarketingHome.tsx", "src/index.css"];

test("les anciennes couleurs roses sont retirées de tous les écrans", () => {
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /#C08081|#87464B/i, path + " contient encore une ancienne couleur");
    assert.match(source, /#1B4D3E/i, path + " doit utiliser le vert anglais");
  }
});
test("les trois couleurs de la nouvelle palette sont présentes", () => {
  const css = readFileSync("src/index.css", "utf8");
  assert.match(css, /--trimemo-vert-principal:\s*#1B4D3E/);
  assert.match(css, /--trimemo-vert-clair:\s*#E7F1EC/);
  assert.match(css, /--trimemo-blanc:\s*#FFFFFF/);
  assert.match(css, /::selection \{ background: var\(--trimemo-vert-principal\); color: var\(--trimemo-blanc\); \}/);
});
test("les erreurs restent visibles et distinctes de la couleur principale", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const admin = readFileSync("src/AdminDashboard.tsx", "utf8");
  assert.match(admin, /danger:"bg-\[#B42318\]\/10/);
  assert.match(admin, /red:"bg-\[#B42318\]\/10/);
  assert.match(app, /role="alert" className="rounded-xl bg-\[#B42318\]\/10/);
});
