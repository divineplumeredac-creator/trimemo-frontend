const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/App.tsx', 'utf8');
const start = source.indexOf('function isWritingProtected(');
const end = source.indexOf('\nfunction isPreviewReady(', start);
assert.ok(start >= 0 && end > start);
const js = ts.transpileModule(source.slice(start, end), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const protectedWriting = new Function(js + ';return isWritingProtected;')();
test('protège le texte avant paiement et pour un jeton lié à un autre projet',()=>{
  assert.equal(protectedWriting(false,null,null,'projet-a'),true);
  assert.equal(protectedWriting(false,'jeton','projet-b','projet-a'),true);
});
test('autorise la sélection pour le projet débloqué et le propriétaire',()=>{
  assert.equal(protectedWriting(false,'jeton','projet-a','projet-a'),false);
  assert.equal(protectedWriting(true,null,null,'projet-a'),false);
});
test('applique la protection aux deux vues de rédaction',()=>{
  assert.equal((source.match(/style=\{protectWriting \? \{ userSelect: "none"/g)||[]).length,2);
  assert.equal((source.match(/onCopy=\{protectWriting \?/g)||[]).length,2);
});
