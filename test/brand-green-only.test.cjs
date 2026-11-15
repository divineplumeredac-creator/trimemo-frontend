const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const paths=['src/App.tsx','src/AdminDashboard.tsx','src/MarketingHome.tsx','src/AmbassadorProgram.tsx','src/AmbassadorAdminPanel.tsx','src/index.css'];
test('toute la plateforme adopte le bleu pétrole sans anciens verts et roses',()=>{
 for(const path of paths){const s=readFileSync(path,'utf8');assert.doesNotMatch(s,/#1B4D3E|#E7F1EC|#83AE99|#87464B|#C08081/i,path);}
});
test('bleu pétrole, ivoire et or doux sont présents dans la charte',()=>{
 const s=readFileSync('src/index.css','utf8');
 assert.match(s,/--trimemo-bleu-petrole:\s*#173F4D/);
 assert.match(s,/--trimemo-ivoire:\s*#F7F5EF/);
 assert.match(s,/--trimemo-or-doux:\s*#C6A477/);
 assert.match(s,/--trimemo-blanc:\s*#FFFFFF/);
});
test('les erreurs ne sont pas cachées par le nouveau thème',()=>{
 const app=readFileSync('src/App.tsx','utf8'),admin=readFileSync('src/AdminDashboard.tsx','utf8');
 assert.match(admin,/danger:"bg-\[#B42318\]\/10/);
 assert.match(app,/role="alert" className="rounded-xl bg-\[#B42318\]\/10/);
});
