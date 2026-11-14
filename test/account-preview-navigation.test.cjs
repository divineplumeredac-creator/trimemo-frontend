const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const source = readFileSync("src/App.tsx", "utf8");

test("la connexion et l’inscription ne renvoient plus vers un aperçu local", () => {
  assert.doesNotMatch(source, /Retour à mon aperçu/);
  assert.doesNotMatch(source, /setPendingPaymentMethod\(null\); setView\("preview"\)/);
  assert.match(source, /Retour à l’accueil<\/button>/);
});
test("un aperçu doit appartenir au compte authentifié et au projet actif", () => {
  assert.match(source, /activeOwnedProject\.current\?\.userId === session\.userId/);
  assert.match(source, /activeOwnedProject\.current\?\.projectId === project\.projectId/);
  assert.match(source, /view === "preview" && preview && !ownerRoute && canViewClientPreview/);
  assert.match(source, /view === "preview" && preview && canViewClientPreview/);
});
test("les URLs et brouillons non vérifiés ne donnent pas accès à la page d’aperçu", () => {
  assert.match(source, /if \(view !== "preview" \|\| canViewClientPreview\) return;/);
  assert.match(source, /setView\(hasSession \? "dashboard" : "account"\)/);
});
