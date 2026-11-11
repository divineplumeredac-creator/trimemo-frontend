const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/App.tsx','utf8');
const start = source.indexOf('function hasMatchingRemoteRecovery(');
const end = source.indexOf('\nfunction isPreviewReady(',start);
assert.ok(start >= 0 && end > start);
const js = ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const {webcrypto} = require('node:crypto');
const {matches, current, digest} = new Function('crypto', 'TextEncoder', js + ';return {matches:hasMatchingRemoteRecovery,current:isCurrentRemoteSnapshot,digest:snapshotDigest};')(webcrypto, TextEncoder);
const preview={plan:{id:'plan-a'},problematic:{id:'problem-a'},introduction:{content:'Introduction entière.'}};
const state={project:{projectId:'project-a'},selectedPlan:{id:'plan-a'},selectedProblematic:{id:'problem-a'},blocks:[{id:'intro',kind:'introduction',status:'done',content:'Introduction entière.',previewRemainder:' Suite conservée.'}]};
test('retrouve la sauvegarde du même projet et conserve la suite',()=>assert.equal(matches('project-a',preview,state),true));
test('refuse projet, plan, contenu ou session incompatible',()=>{
 assert.equal(matches('project-b',preview,state),false);
 assert.equal(matches('project-a',preview,{...state,selectedPlan:{id:'autre'}}),false);
 assert.equal(matches('project-a',preview,{...state,blocks:[{...state.blocks[0],content:'Autre texte.'}]}),false);
 assert.equal(matches('project-a',preview,null),false);
});
test('l’empreinte change si la suite conservée change',async()=>{
 const a=await digest(state.blocks);
 const b=await digest([{...state.blocks[0],previewRemainder:'autre suite'}]);
 assert.match(a,/^[a-f0-9]{64}$/);
 assert.notEqual(a,b);
});
test('ne confirme la sauvegarde que si tous les blocs et leur suite sont identiques',()=>{
 assert.equal(current('project-a',preview,state,state.blocks),true);
 assert.equal(current('project-a',preview,state,[{...state.blocks[0],previewRemainder:' Autre suite.'}]),false);
 assert.equal(current('project-a',preview,state,[{...state.blocks[0],previewRemainder:undefined}]),false);
});
