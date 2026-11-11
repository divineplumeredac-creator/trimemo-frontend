const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/App.tsx','utf8');
const start = source.indexOf('function hasMatchingIntroRecovery(');
const end = source.indexOf('\nfunction isPreviewReady(',start);
assert.ok(start >= 0 && end > start);
const js = ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const safe = new Function(js + ';return hasMatchingIntroRecovery;')();
const blocks = [{id:'intro',kind:'introduction',content:'Texte fictif.'}];
test('reconnaît une sauvegarde correspondante',()=>assert.equal(safe('project-a',{project:{projectId:'project-a'},blocks},blocks),true));
test('refuse un autre projet, des blocs différents ou une session absente',()=>{
 assert.equal(safe('project-b',{project:{projectId:'project-a'},blocks},blocks),false);
 assert.equal(safe('project-a',{project:{projectId:'project-a'},blocks},[{...blocks[0],content:'Autre contenu'}]),false);
 assert.equal(safe('project-a',{project:{projectId:'project-a'},blocks},null),false);
});
