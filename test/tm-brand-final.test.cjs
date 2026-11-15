const test=require("node:test");const assert=require("node:assert/strict");const {readFileSync}=require("node:fs");
const app=readFileSync("src/App.tsx","utf8"),admin=readFileSync("src/AdminDashboard.tsx","utf8"),home=readFileSync("src/MarketingHome.tsx","utf8"),html=readFileSync("index.html","utf8");
test("Le logo TM vectoriel remplace l'ancien logo dans les espaces Trimémo",()=>{
 assert.match(app,/trimemo-tm-inverse\.svg/);assert.match(app,/trimemo-tm\.svg/);
 assert.doesNotMatch(app,/trimemo-logo\.webp/);
 assert.match(admin,/trimemo-tm-inverse\.svg/);
 assert.match(home,/trimemo-tm\.svg/);
});
test("Le logo principal affiche le bleu pétrole et l'or doux",()=>{
 const light=readFileSync("public/trimemo-tm.svg","utf8"),dark=readFileSync("public/trimemo-tm-inverse.svg","utf8");
 assert.match(light,/#173F4D/);assert.match(light,/#C6A477/);
 assert.match(dark,/#FFFFFF/);assert.match(dark,/#C6A477/);
});
test("Le favicon contient le monogramme TM et l'index le charge",()=>{
 const favicon=readFileSync("public/favicon.svg","utf8");
 assert.match(favicon,/viewBox="0 0 256 256"/);assert.match(favicon,/#173F4D/);assert.match(favicon,/#C6A477/);
 assert.match(html,/rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"/);
});
test("Le menu clair utilise le logo coloré et les menus sombres le logo inverse",()=>{
 assert.match(app,/<BrandLogo className="h-12 w-12" \/>/);
 assert.match(app,/<BrandLogo className="h-12 w-12" light \/>/);
 assert.match(app,/light \? "\/trimemo-tm-inverse\.svg" : "\/trimemo-tm\.svg"/);
});