const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const files = ["src/App.tsx","src/AdminDashboard.tsx","src/MarketingHome.tsx","src/AmbassadorProgram.tsx","src/index.css"];
test("les anciennes couleurs sont retirées",()=>{
 for(const f of files) {const s=readFileSync(f,"utf8");assert.doesNotMatch(s,/#1B4D3E|#83AE99|#E7F1EC|#C08081|#87464B/i,f);assert.match(s,/#173F4D/i,f);}
});
test("la palette officielle du Studio académique est utilisée",()=>{
 const s=readFileSync("src/index.css","utf8");
 for(const item of ["--trimemo-bleu-petrole: #173F4D","--trimemo-ivoire: #F7F5EF","--trimemo-or-doux: #C6A477","--trimemo-blanc: #FFFFFF"])assert.ok(s.includes(item),item);
 assert.match(s,/::selection \{ background: var\(--trimemo-bleu-petrole\); color: var\(--trimemo-blanc\); \}/);
});
test("les erreurs restent clairement distinctes de la marque",()=>{
 const admin=readFileSync("src/AdminDashboard.tsx","utf8"),app=readFileSync("src/App.tsx","utf8");
 assert.match(admin,/danger:"bg-\[#B42318\]\/10/);assert.match(admin,/red:"bg-\[#B42318\]\/10/);assert.match(app,/role="alert" className="rounded-xl bg-\[#B42318\]\/10/);
});
