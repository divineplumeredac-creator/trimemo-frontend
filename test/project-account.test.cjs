const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const src = fs.readFileSync('src/project-account.ts','utf8');
const js = ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const exportsObj = {};
new Function('exports','require',js)(exportsObj,require);
const register=exportsObj.registerOwnedProject;
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
