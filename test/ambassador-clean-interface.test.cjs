const test=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const user=readFileSync("src/AmbassadorProgram.tsx","utf8");
const admin=readFileSync("src/AmbassadorAdminPanel.tsx","utf8");
test("l’espace étudiant reste simple et ne montre pas de notes techniques",()=>{
  for(const text of ["Recrutement pilote","phase pilote","commandes admissibles","versements sont validés manuellement","Tester mon lien","Commissions par devise","Conditions du pilote","après approbation par l’administrateur"]){
    assert.ok(!user.includes(text),text);
  }
  assert.match(user,/Faites découvrir Trimémo autour de vous/);
  assert.match(user,/10 %/);
  assert.match(user,/Conditions du programme/);
});
test("les conditions essentielles restent disponibles",()=>{
  assert.match(user,/achats annulés ou remboursés/);
  assert.match(user,/au plus tôt 14 jours/);
  assert.match(user,/rôle d’ambassadeur/);
  assert.match(user,/checkbox/);
});
test("la candidature et les gains restent accessibles",()=>{
  assert.match(user,/endpoint\("apply"/);
  assert.match(user,/endpoint\("me"/);
  assert.match(user,/referralLink/);
  assert.match(user,/Mes gains/);
  assert.match(user,/Historique de mes gains/);
});
test("la console de gestion reste opérationnelle mais épurée",()=>{
  assert.match(admin,/admin-decision/);
  assert.match(admin,/admin-payout/);
  assert.match(admin,/Candidatures, parrainages et commissions/);
  assert.doesNotMatch(admin,/Aucun transfert automatique n’est effectué/);
});
