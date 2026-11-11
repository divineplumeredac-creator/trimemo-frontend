const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const src = fs.readFileSync('src/project-account.ts','utf8');
const js = ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const exportsObj = {};
new Function('exports','require',js)(exportsObj,require);
const register=exportsObj.registerOwnedProject;
const recover=exportsObj.recoverMatchingAttachments;
const session={token:'synthetic',userId:'a'};
test('crée le projet sous le compte avant son utilisation',async()=>{
 let sent;const project={projectId:'p',sujet:''};
 const result=await register('/synthetic',session,project,()=>session,async(_url,init)=>{sent=JSON.parse(init.body);return {ok:true,json:async()=>({success:true})}});
 assert.equal(result,project);assert.equal(sent.projectId,'p');assert.equal(sent.state.project.projectId,'p');assert.deepEqual(sent.state.blocks,[]);
});
test('refuse une erreur serveur ou un changement de compte',async()=>{
 const project={projectId:'p',sujet:''};
 await assert.rejects(register('/synthetic',session,project,()=>session,async()=>({ok:false,json:async()=>({error:'refus'})})),/refus/);
 await assert.rejects(register('/synthetic',session,project,()=>({token:'other',userId:'b'}),async()=>({ok:true,json:async()=>({success:true})})),/compte a changé/);
});

test('reprend les pièces jointes dans le même onglet sans modifier la copie serveur',()=>{
 const file={name:'guide.pdf',type:'application/pdf',category:'methodology',content:''};
 const draft={project:{projectId:'p',sujet:'Sujet',files:[file]},attachmentBackupKey:'backup',blocks:[{id:'1',content:'texte'}]};
 const remote=JSON.parse(JSON.stringify(draft)); delete remote.attachmentBackupKey;
 const sessionFiles=[{...file,content:'data:application/pdf;base64,c29tZQ=='}];
 assert.deepEqual(recover(draft,remote,sessionFiles),sessionFiles);
 assert.equal(remote.project.files[0].content,'');
});

test('conserve les versions lorsque le texte, le plan, le projet ou les pièces divergent',()=>{
 const draft={project:{projectId:'p',sujet:'Sujet',files:[]},blocks:[{id:'1',content:'local'}],selectedPlan:{id:'plan'}};
 const remote=JSON.parse(JSON.stringify(draft));
 for(const mutate of [r=>r.blocks[0].content='serveur',r=>r.selectedPlan.id='autre',r=>r.project.sujet='autre',r=>r.project.files.push({name:'x'})]) {
  const changed=JSON.parse(JSON.stringify(remote)); mutate(changed);
  assert.throws(()=>recover(draft,changed,null),/diffère|diffèrent/);
 }
 assert.throws(()=>recover({...draft,attachmentBackupKey:'f'},remote,null),/plus disponibles/);
 assert.throws(()=>recover(draft,{...remote,project:{...remote.project,projectId:'autre'}},null),/correspond pas/);
});
