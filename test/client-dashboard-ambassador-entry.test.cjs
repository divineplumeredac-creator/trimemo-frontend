const test=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const app=readFileSync("src/App.tsx","utf8");
const amb=readFileSync("src/AmbassadorProgram.tsx","utf8");

test("le tableau de bord client propose Devenir ambassadeur sans inscription supplémentaire",()=>{
 const start=app.indexOf('{view === "dashboard" && (');
 const dashboard=app.slice(start,app.indexOf('{view !== "dashboard" && (<>',start));
 assert.match(dashboard,/Mon tableau de bord/);
 assert.match(dashboard,/Devenir ambassadeur/);
 assert.match(dashboard,/ambassadorOrigin\.current = "dashboard"; setMobileMenuOpen\(false\); setView\("ambassadors"\)/);
 assert.doesNotMatch(dashboard,/authIntent\.current\s*=\s*"ambassador"/);
});
test("le bouton conserve le compte connecté et ouvre le programme existant",()=>{
 assert.match(amb,/window\.localStorage\.getItem\("trimemo_client_session"\)/);
 assert.match(app,/view === "ambassadors" && <AmbassadorProgram/);
 assert.match(app,/onBack=\{\(\) => \{ const origin = ambassadorOrigin\.current; ambassadorOrigin\.current = "home"; setView\(origin\)/);
 assert.match(amb,/\{backLabel\}<\/button>/);
});
test("la page ambassadeur n’écrase pas l’écran de reprise des projets",()=>{
 assert.equal((app.match(/view === "ambassadors" \? "writing" : view/g)||[]).length,2);
});
