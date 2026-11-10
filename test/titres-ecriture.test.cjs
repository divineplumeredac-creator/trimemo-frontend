const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const src=fs.readFileSync('src/App.tsx','utf8');
const start=src.indexOf('  function renderAcademicText(');
const end=src.indexOf('  function academicPreviewSegments()',start);
assert.ok(start>=0&&end>start);
const js=ts.transpileModule(src.slice(start,end),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const React={Fragment:'fragment',createElement:(type,props,...children)=>({type,props,children})};
const render=new Function('selectedPlan','React',js+'\nreturn renderAcademicText;')({parts:[]},React);
function textTree(x){if(x==null||x===false)return '';if(typeof x==='string')return x;if(Array.isArray(x))return x.map(textTree).join('');return textTree(x.children)}
test('les titres entiers restent entiers dans la rédaction',()=>{for(const title of ['INTRODUCTION GÉNÉRALE','CONCLUSION GÉNÉRALE','PARTIE I : Les fondements conceptuels de la gestion','CHAPITRE 1 : Les fondements conceptuels']){const nodes=render(title,false,[], '');assert.equal(nodes.length,1,title);assert.equal(textTree(nodes),title.replace(/\s+([,.;:!?])/g, "$1"),title)}});
test('les titres montrés dans les captures ne deviennent pas des paragraphes séparés',()=>{const cases=['INTRODUCTION GÉNÉRALE','PARTIE I : SÉPARER L’ATTEINTE DES OBJECTIFS ET L’USAGE DES RESSOURCES POUR MESURER LA performance','Chapitre 1: Les fondements conceptuels de l’efficacité et de l’efficience','PARTIE II: ARBITRER LA PERFORMANCE STRATÉGIQUE ENTRE ATTEINTE DES OBJECTIFS ET USAGE DES ressources','Chapitre 3: Tensions entre efficacité et efficience dans les décisions stratégiques'];for(const title of cases){const nodes=render(title,false,[], '');assert.equal(nodes.length,1,title);assert.equal(textTree(nodes),title.replace(/\s+([,.;:!?])/g,'$1'),title)}});
