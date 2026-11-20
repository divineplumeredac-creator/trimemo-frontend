const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/App.tsx', 'utf8');
const start = source.indexOf('  async function restoreCancelledPayment()');
const end = source.indexOf('  async function startPayment(', start);
assert.ok(start >= 0 && end > start);
const code = ts.transpileModule(source.slice(start, end), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const makeRecovery = new Function('env', `with(env) { ${code}; return restoreCancelledPayment; }`);
function setup({session={token:'test',userId:'owner'},saved,fail=false,changeUser=false}={}) {
 const calls=[];const sessionStorage={removeItem:k=>calls.push(['remove',k])};
 const store={trimemo_client_session:JSON.stringify(session),state:JSON.stringify({})};
 const window={localStorage:{getItem:k=>store[k]||null},sessionStorage,location:{href:'https://trimemo.example/?payment=paypal_cancelled',pathname:'/'},history:{replaceState:(_a,_b,url)=>calls.push(['url',url])}};
 const snapshot=saved||{project:{projectId:'project',files:[]},formula:'MASTER',selectedPlan:{id:'plan'},selectedProblematic:{id:'question'},preview:{plan:{id:'plan'},problematic:{id:'question'}},blocks:[]};
 const env={window,URL,document:{title:'Trimémo'},stateStorageKey:'state',CLIENT_ACCOUNT_API:'/mock',paymentReturnRestoring:{current:true},activeOwnedProject:{current:null},loadPendingProject:()=>({projectId:'project'}),isCurrentRemoteSnapshot:()=>false,
 fetch:async(_url,opts)=>{calls.push(['request',JSON.parse(opts.body)]);if(changeUser)store.trimemo_client_session=JSON.stringify({token:'other',userId:'other'});return fail?{ok:false}:{ok:true,data:{state:snapshot}}},readApiResponse:async r=>{if(!r.ok)throw Error('Projet indisponible');return r.data},pushToast:(...v)=>calls.push(['toast',...v])};
 for(const name of ['setLoading','setClientAuthMode','setClientAuthNotice','setView','setProject','setFormula','setEstimate','setPremium','setSelectedProblematic','setSelectedPlan','setBlocks','setPreview','setPreviewTab','setPremiumNav','setPremiumSection','setSelectedWritingBlockId','setProblematicImprovementComments','setPlanImprovementComments','setProblematicGenerationCount','setPlanGenerationCount','setClientEmailDisplay','setClientNameDisplay'])env[name]=v=>calls.push([name,v]);
 return {env,calls,run:makeRecovery(env)};
}
test('après annulation le projet vérifié retrouve son aperçu',async()=>{
 const {env,calls,run}=setup();await run();
 assert.deepEqual(calls.find(c=>c[0]==='request')[1],{action:'resume',token:'test',projectId:'project'});
 assert.deepEqual(env.activeOwnedProject.current,{projectId:'project',userId:'owner'});
 assert.equal(calls.find(c=>c[0]==='setView')[1],'preview');
 assert.match(calls.find(c=>c[0]==='url')[1],/view=preview/);
 assert.equal(env.paymentReturnRestoring.current,false);
});
test('si le compte change pendant la vérification aucun aperçu ne s’ouvre',async()=>{
 const {env,calls,run}=setup({changeUser:true});await run();
 assert.equal(env.activeOwnedProject.current,null);
 assert.equal(calls.find(c=>c[0]==='setView')[1],'account');
 assert.equal(calls.some(c=>c[0]==='setPreview'),false);
 assert.equal(env.paymentReturnRestoring.current,true);
});
test('sans session la reconnexion conserve le retour en attente',async()=>{
 const {env,calls,run}=setup({session:null});await run();
 assert.equal(calls.find(c=>c[0]==='setView')[1],'account');
 assert.equal(calls.some(c=>c[0]==='request'),false);
 assert.equal(env.paymentReturnRestoring.current,true);
});
test('si le serveur ne vérifie pas le projet aucun aperçu ne s’ouvre',async()=>{
 const {env,calls,run}=setup({fail:true});await run();
 assert.equal(env.activeOwnedProject.current,null);
 assert.equal(calls.find(c=>c[0]==='setView')[1],'account');
 assert.equal(calls.some(c=>c[0]==='setPreview'),false);
});
