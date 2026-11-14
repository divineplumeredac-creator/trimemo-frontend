const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const app=readFileSync('src/App.tsx','utf8'),amb=readFileSync('src/AmbassadorProgram.tsx','utf8');
test('un ambassadeur ayant un compte est invité à se connecter sans réinscription',()=>{
 assert.match(amb,/Vous avez déjà un compte Trimémo/);
 assert.match(amb,/onLogin,onSignup/);
 assert.match(amb,/>Se connecter<\/button>/);
 assert.match(amb,/>Créer un compte<\/button>/);
});
test('la connexion depuis les ambassadeurs ouvre d’abord le formulaire de connexion',()=>{
 assert.match(app,/onLogin=\{\(\) => \{ authIntent\.current="ambassador";[^}]*setClientAuthMode\("login"\)/);
 assert.match(app,/onSignup=\{\(\) => \{ authIntent\.current="ambassador";[^}]*setClientAuthMode\("signup"\)/);
 assert.match(app,/Programme Ambassadeurs Trimémo/);
});
