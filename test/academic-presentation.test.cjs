const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const src = fs.readFileSync('src/App.tsx','utf8');
const start = src.indexOf('function ProblematicPresentation('), end = src.indexOf('type Toast = {',start);
assert.ok(start >= 0 && end > start);
const code = ts.transpileModule(src.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
const {ProblematicPresentation,PlanPresentation} = new Function('React',code+'; return {ProblematicPresentation,PlanPresentation};')(React);
test('la question, son angle et sa justification restent lisibles',()=>{
 const html=renderToStaticMarkup(React.createElement(ProblematicPresentation,{index:0,item:{title:'Sujet étudié',question:'Comment améliorer la situation ?',angle:'Approche locale',rationale:'Le problème existe.'}}));
 for(const value of ['Problématique 1','Sujet étudié','Question de recherche','Comment améliorer la situation ?','Angle de recherche','Approche locale','Pourquoi cette problématique ?','Le problème existe.'])assert.ok(html.includes(value),value);
});
test('le plan affiche tous les niveaux et ses ouvertures',()=>{
 const plan={title:'Plan du mémoire',description:'Présentation du plan',introductionGeneral:{title:'Introduction générale'},conclusionGeneral:{title:'Conclusion générale'},parts:[{id:'p1',number:1,title:'Cadre général',chapters:[{id:'c1',number:1,title:'Fondements',sections:[{id:'s1',number:1,title:'Notions',subsections:[{id:'ss1',number:1,title:'Définitions',internalTitles:[{id:'i1',number:1,title:'Concept central'}]}]}]}]}]};
 const html=renderToStaticMarkup(React.createElement(PlanPresentation,{index:0,plan}));
 for(const value of ['Introduction générale','Cadre général','Fondements','Notions','Définitions','Concept central','Conclusion générale'])assert.ok(html.includes(value),value);
});
test('les deux espaces utilisent la même présentation et conservent leurs actions',()=>{
 assert.equal((src.match(/<ProblematicPresentation item=\{item\} index=\{index\} \/>/g)||[]).length,2);
 assert.equal((src.match(/<PlanPresentation plan=\{plan\} index=\{index\} \/>/g)||[]).length,2);
 assert.ok(src.includes('Améliorer cette problématique'));
 assert.ok(src.includes('Valider ce plan'));
});
