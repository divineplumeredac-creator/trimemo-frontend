const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const app = readFileSync("src/App.tsx","utf8");
const css = readFileSync("src/index.css","utf8");
test("le nom Trimémo reste entier et lisible dans les deux en-têtes", () => {
  assert.equal((app.match(/studio-brand-wordmark/g)||[]).length,2);
  assert.equal((app.match(/>Trimémo<\/span>/g)||[]).length>=2,true);
  assert.doesNotMatch(app,/Trimé<span className="text-white">mo<\/span>/);
  assert.match(css,/\.studio-site-header \.studio-brand-wordmark \{ color: #FFFFFF !important; \}/);
});
test("le menu d'accueil est bleu pétrole avec accent or et logo inverse", () => {
  assert.match(css,/\.studio-header--home \{\s*background: rgba\(23,63,77,\.985\) !important;/);
  assert.match(css,/border-bottom: 2px solid var\(--trimemo-or-doux\)/);
  assert.match(app,/<BrandLogo className="h-11 w-11 sm:h-12 sm:w-12" light \/>/);
  assert.match(css,/\.studio-header--home \.studio-primary-nav-action \{\s*background: #E8D3AC/);
});
test("la navigation reste accessible entre tablette et ordinateur",()=>{
  assert.match(app,/className="hidden items-center gap-6 font-inter text-sm text-white lg:flex/);
  assert.match(app,/studio-mobile-menu sticky top-\[72px\]/);
  assert.match(app,/shadow-sm lg:hidden/);
  assert.match(app,/studio-primary-nav-action hidden h-10/);
});
test("les titres des sous-menus sont visibles sur fond bleu pétrole",()=>{
  const section=app.slice(app.indexOf('{view !== "account" && mobileMenuOpen && ('),app.indexOf('{view === "account" && ('));
  assert.doesNotMatch(section,/text-\[#173F4D\]/);
  assert.match(section,/text-\[#E8D3AC\]/);
});
