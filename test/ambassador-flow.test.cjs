const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const app=readFileSync('src/App.tsx','utf8'),marketing=readFileSync('src/MarketingHome.tsx','utf8');
test('programme accessible depuis accueil et navigation',()=>{
 assert.match(marketing,/Devenez ambassadeur Trimémo/);
 assert.match(app,/view === "ambassadors" && <AmbassadorProgram/);
 assert.match(app,/Devenir ambassadeur/);
});
test('parrainage enregistré uniquement après création du projet',()=>{
 assert.match(app,/await registerOwnedProject\(/);
 assert.ok(app.indexOf('await attributeReferralToProject(next.projectId')>app.indexOf('await registerOwnedProject(CLIENT_ACCOUNT_API, session, next'));
});
test('retour au programme après connexion',()=>{
 assert.match(app,/authIntent.current === "ambassador"/);
 assert.match(app,/setView\("ambassadors"\)/);
});

test('le retour au programme fonctionne après confirmation de compte',()=>{assert.match(app,/trimemo_auth_intent/);});
