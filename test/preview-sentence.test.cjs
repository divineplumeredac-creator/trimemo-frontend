const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const src = fs.readFileSync('src/App.tsx', 'utf8');
const start = src.indexOf('function trimToWordsPreservingLayout(');
const end = src.indexOf('\nfunction wordsToPages(', start);
assert.ok(start >= 0 && end > start);
const js = ts.transpileModule(src.slice(start, end), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const {trim, restore} = new Function('countWords', js + '\nreturn {trim: trimToWordsPreservingLayout, restore: restorePreviewRemainder};')((v) => v.trim().split(/\s+/).length);
test('ne coupe pas une phrase et permet de récupérer tous les caractères', () => {
  const content = 'Cette traduction transforme une remarque en exigence interne. Un exemple permet de mieux comprendre.';
  const shown = trim(content, 9);
  assert.equal(shown, 'Cette traduction transforme une remarque en exigence interne.');
  assert.equal(shown + content.slice(shown.length), content);
});
test('refuse de présenter une phrase sans fin dans la limite', () => {
  assert.equal(trim('Une très longue phrase sans ponctuation avant sa fin.', 3), '');
});
test('conserve tout le texte lorsque la limite ne coupe pas le bloc', () => {
  const content = 'Première phrase. Seconde phrase.';
  assert.equal(trim(content, 10), content);
});
test('la reprise restitue exactement le texte conservé et reste idempotente', () => {
  const original = 'Phrase complète. Une autre phrase complète.';
  const shown = trim(original, 3);
  const restored = restore({content: shown, previewRemainder: original.slice(shown.length), previewLimitReached:true});
  assert.equal(restored.content, original);
  assert.equal(restored.previewRemainder, undefined);
  assert.equal(restore(restored), restored);
});
test('un aperçu de plus de 1 000 mots ne tronque pas un bloc qui tient dans le quota', () => {
  const content = Array.from({length: 120}, (_, i) => `La phrase ${i} comprend plusieurs mots pour vérifier correctement cette limite.`).join(' ');
  assert.ok(content.split(/\s+/).length > 1000);
  assert.equal(trim(content, 2000), content);
});
