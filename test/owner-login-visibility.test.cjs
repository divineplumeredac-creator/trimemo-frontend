const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("src/App.tsx", "utf8");

test("les deux formulaires administrateur affichent le texte saisi sur fond blanc", () => {
  const first = source.slice(source.indexOf("if (ownerRoute) {\n    if (!ownerSessionValid) {"), source.indexOf("    if (!ownerShowWriter) {"));
  const second = source.slice(source.indexOf("{ownerRoute && !ownerSessionValid && ("), source.indexOf('{view !== "dashboard" && (<>'));
  for (const form of [first, second]) {
    assert.match(form, /bg-white p-7 text-\[#173F4D\]/, "le formulaire doit imposer du texte sombre");
    const fields = form.match(/text-\[#173F4D\] caret-\[#173F4D\]/g) || [];
    assert.equal(fields.length, 2, "les champs e-mail et mot de passe doivent être lisibles");
    assert.match(form, /htmlFor="owner-email"/);
    assert.match(form, /id="owner-email"/);
    assert.match(form, /id="owner-password"/);
  }
});
