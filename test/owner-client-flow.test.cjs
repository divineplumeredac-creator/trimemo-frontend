const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('src/App.tsx', 'utf8');
const between = (a,b) => source.slice(source.indexOf(a), source.indexOf(b,source.indexOf(a)+a.length));
test('administration et client commencent chacun avec une seule problématique', () => {
  const fn = between('async function generatePublicProblematics(', 'async function generateProblematicVariant(');
  assert.match(fn, /count: 1, problematicAction: "new", ownerMode: ownerRoute/);
  assert.match(fn, /ownerRoute \? ownerAuthHeaders\(\) : \{\}/);
  assert.doesNotMatch(source, /function generateOwnerPremium/);
});
test('améliorations de problématiques respectent le mode propriétaire authentifié', () => {
  const fn = between('async function generateProblematicVariant(', 'async function generatePlansForProblematic(');
  assert.match(fn,/ownerMode: ownerRoute/);
  assert.match(fn,/ownerRoute \? ownerAuthHeaders\(\) : \{\}/);
});
test('le formulaire administrateur ne demande plus de formule', () => {
  assert.doesNotMatch(source,/\{formulaOptions\.map\(/);
  assert.doesNotMatch(source,/\n\s+Formule\s*\n/);
});
test('nouveau projet admin repart de compteurs réinitialisés', () => {
  const fn = between('function startNewOwnerProject(', 'async function generatePublicProblematics(');
  assert.match(fn,/setProblematicGenerationCount\(0\)/);
  assert.match(fn,/setPlanGenerationCount\(0\)/);
  assert.match(source,/onClick=\{startNewOwnerProject\}/);
});
