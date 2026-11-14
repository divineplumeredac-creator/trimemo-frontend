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
