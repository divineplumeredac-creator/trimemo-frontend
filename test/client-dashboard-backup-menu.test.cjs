const test=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const app=readFileSync("src/App.tsx","utf8");
const dashboard=app.slice(app.indexOf('{view === "dashboard" && ('),app.indexOf('{view !== "dashboard" && (<>',app.indexOf('{view === "dashboard" && (')));
test("le tableau de bord garde ses deux actions principales",()=>{
  assert.match(dashboard,/Mes projets et documents/);
  assert.match(dashboard,/Retrouvez vos projets et poursuivez votre rédaction\./);
  assert.match(dashboard,/>Actualiser<\/button>/);
  assert.match(dashboard,/>Nouveau projet<\/button>/);
});
test("les textes techniques ne sont plus visibles dans la liste des projets",()=>{
  assert.doesNotMatch(dashboard,/Reprendre un brouillon conservé sur cet appareil/);
  assert.doesNotMatch(dashboard,/Retrouvez une copie enregistrée sur cet appareil/);
  assert.doesNotMatch(dashboard,/Sauvegarder une copie sur cet appareil/);
});
test("les options de sauvegarde sont cachées sous un menu accessible",()=>{
  assert.match(dashboard,/<details className="group relative">/);
  assert.match(dashboard,/<summary aria-label="Options de sauvegarde"/);
  assert.match(dashboard,/<MoreHorizontal className="h-5 w-5"/);
  assert.match(dashboard,/Conserver une copie du projet/);
  assert.match(dashboard,/Reprendre un brouillon \{index \+ 1\}/);
  assert.match(dashboard,/localDraftKeys\.length > 0 \|\| Boolean\(project\.sujet\?\.trim\(\)\)/);
});
test("la sauvegarde et la récupération restent opérationnelles et sécurisées",()=>{
  assert.match(dashboard,/archiveCurrentDraft\(\)/);
  assert.match(dashboard,/recoverLocalDraft\(key\)/);
  assert.match(app,/function recoverLocalDraft\(/);
  assert.match(app,/function archiveCurrentDraft\(/);
});
