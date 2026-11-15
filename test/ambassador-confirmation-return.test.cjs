const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync}=require("node:fs");
const src=readFileSync("src/App.tsx","utf8");
test("le lien de confirmation de l’ambassadeur conserve sa destination entre navigateurs",()=>{
 assert.match(src,/query\.get\("next"\) === "ambassadors"/);
 assert.match(src,/setView\("ambassadors"\)/);
 assert.match(src,/ambassador: authIntent\.current === "ambassador"/);
});
test("les deux formes de confirmation sont prises en charge",()=>{
 assert.match(src,/query\.get\("token_hash"\)/);
 assert.match(src,/action: "verify-email"/);
 assert.match(src,/action: "confirm-session"/);
 assert.match(src,/implicitConfirmation/);
});
test("les liens expirés affichent une solution sans exposer les jetons",()=>{
 assert.match(src,/window\.history\.replaceState\(\{\}, document\.title, window\.location\.pathname\)/);
 assert.match(src,/setShowConfirmationResend\(true\)/);
 assert.match(src,/linkError/);
});

test("le parcours ambassadeur est conservé sans paramètre de redirection",()=>{
 assert.match(src,/confirmedSignupIntent === "ambassador"/);
 assert.match(src,/data\.user\.signupIntent/);
});
test("les anciens liens de confirmation basculent sur le domaine public avant vérification",()=>{
 const entry=readFileSync("src/main.tsx","utf8");
 assert.match(entry,/window\.location\.hostname === 'trimemo-frontend\.vercel\.app'/);
 assert.match(entry,/window\.location\.replace\(/);
 assert.match(entry,/https:\/\/trimemo-redac\.company/);
 assert.match(entry,/window\.location\.hash/);
});
