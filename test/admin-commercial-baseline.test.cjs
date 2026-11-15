const test=require("node:test");const assert=require("node:assert/strict");const {readFileSync}=require("node:fs");const src=readFileSync("src/AdminDashboard.tsx","utf8");
test("Lancement commercial suivi dès le 16 novembre",()=>{
  assert.match(src,/const \[includeHistory,setIncludeHistory\]=useState\(false\)/);
  assert.match(src,/Suivi commercial — depuis le 16 novembre 2026/);
  assert.match(src,/Afficher l’historique d’avant-lancement/);
});
test("Tous les endpoints des indicateurs reçoivent le filtre",()=>{
  for(const action of ["overview","clients","projects","orders","usage","logs"]) assert.ok(src.includes('api("'+action+'",{includeHistory})'),action);
});
test("Historique optionnel et rechargement des données",()=>{
  assert.match(src,/\},\[api,tab,includeHistory\]\)/);
  assert.match(src,/\},\[api,includeHistory\]\)/);
  assert.match(src,/setIncludeHistory\(event\.target\.checked\)/);
});
test("Les dossiers de révision et les ambassadeurs restent disponibles",()=>{
  assert.match(src,/api\("revisions"\)/);
  assert.match(src,/Les demandes de révision antérieures au lancement restent accessibles/);
  assert.match(src,/AmbassadorAdminPanel token=\{token\}/);
});
