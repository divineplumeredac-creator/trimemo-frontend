const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync}=require('node:fs');
const paths=['src/App.tsx','src/AdminDashboard.tsx','src/MarketingHome.tsx','src/index.css'];
test('le rose foncé et le vieux rose sont absents de Trimémo',()=>{
  for(const path of paths){
    const s=readFileSync(path,'utf8');
    assert.doesNotMatch(s,/#87464B|#C08081|--trimemo-rose-fonce/i,path);
    assert.match(s,/#1B4D3E/i,path);
  }
});
test('la marque utilise un vert foncé, un vert clair et le blanc',()=>{
 const css=readFileSync('src/index.css','utf8');
 assert.match(css,/--trimemo-vert-principal:\s*#1B4D3E/i);
 assert.match(css,/--trimemo-vert-clair:\s*#E7F1EC/i);
 assert.match(css,/--trimemo-blanc:\s*#FFFFFF/i);
 assert.match(css,/color: var\(--trimemo-vert-principal\)/);
});
test('les états d’erreur restent distincts du vert utilisé pour les actions',()=>{
 const admin=readFileSync('src/AdminDashboard.tsx','utf8');
 const app=readFileSync('src/App.tsx','utf8');
 assert.match(admin,/danger:"bg-\[#B42318\]\/10/);
 assert.match(admin,/red:"bg-\[#B42318\]\/10/);
 assert.match(app,/role="alert" className="rounded-xl bg-\[#B42318\]\/10/);
});
