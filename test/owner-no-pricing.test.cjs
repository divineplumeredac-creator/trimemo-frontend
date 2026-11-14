const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const src = fs.readFileSync("src/App.tsx", "utf8");
function section(a,b) {
  const i=src.indexOf(a),j=src.indexOf(b,i+a.length);
  assert.ok(i>=0 && j>i);
  return src.slice(i,j);
}
test("l’administrateur génère sans calcul tarifaire",()=>{
  const owner=section("async function generateOwnerFirstProblematic() {","async function analyzeProject() {");
  assert.match(owner,/await generatePublicProblematics\(undefined, \{ \.\.\.project, pricingQuoteToken: undefined \}\)/);
  assert.doesNotMatch(owner,/ESTIMATE_API|analyzeProject\(/);
  assert.match(src,/Générer une problématique/);
  assert.doesNotMatch(src,/Analyser et proposer une problématique|Analyser le projet et proposer une problématique/);
});
test("la première problématique admin est autorisée sans devis",()=>{
  const fn=section("async function generatePublicProblematics(","async function generateProblematicVariant(");
  assert.match(fn,/!ownerRoute && \(!activeEstimate \|\| !activeProject\.pricingQuoteToken\)/);
  assert.match(fn,/ownerRoute \? ownerAuthHeaders\(\) : \{\}/);
  assert.match(fn,/count: 1, problematicAction: "new", ownerMode: ownerRoute/);
});
test("les améliorations admin ne requièrent aucun devis; les clients conservent l’analyse",()=>{
  const variants=section("async function generateProblematicVariant(","async function generatePlansForProblematic(");
  assert.match(variants,/!ownerRoute && \(!project\.pricingQuoteToken \|\| !estimate\)/);
  const estimate=section("async function analyzeProject() {","async function generateFreePreview(");
  assert.match(estimate,/ESTIMATE_API/);
  assert.match(estimate,/if \(!data\?\.estimate\?\.pricingQuoteToken\)/);
  assert.equal((src.match(/onClick=\{\(\) => void analyzeProject\(\)\}/g)||[]).length,1);
});
test("aucune simulation de paiement dans les tests administrateur",()=>{
  assert.doesNotMatch(src,/simulateOwnerPayment|Simuler un paiement/);
  assert.match(src,/Les projets de test peuvent être rédigés et exportés sans paiement/);
});
