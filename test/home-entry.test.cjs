const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/App.tsx', 'utf8');
const start = source.indexOf('function shouldRestoreSavedView(');
const end = source.indexOf('\nfunction trimToWordsPreservingLayout(', start);
assert.ok(start >= 0 && end > start);
const code = ts.transpileModule(source.slice(start, end), {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
const restore = new Function('URLSearchParams', code + ';return shouldRestoreSavedView;')(URLSearchParams);
test('le lien principal ouvre l’accueil même avec des paramètres de campagne', () => {
  assert.equal(restore('/', '', '', false), false);
  assert.equal(restore('/', '?utm_source=campagne', '', false), false);
});
test('préserve les parcours de reprise et les retours particuliers', () => {
  for (const query of ['?project=123', '?payment=paypal', '?account=signup', '?reset-password=1']) assert.equal(restore('/', query, '', false), true, query);
  assert.equal(restore('/owner', '', '', true), true);
  assert.equal(restore('/', '', '#access_token=example', false), true);
});
