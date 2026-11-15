const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('src/AmbassadorAdminPanel.tsx','utf8');
test('l’administrateur est informé du résultat de l’envoi e-mail',()=>{
 assert.match(source,/notification\?\.status==="failed"/);
 assert.match(source,/notification\?\.status==="unconfigured"/);
 assert.match(source,/setError\(notification\.message\)/);
 assert.match(source,/setNotice\(notification\?\.message\|\|"Statut mis à jour\."\)/);
});
test('un renvoi explicite est possible pour les candidatures approuvées ou refusées',()=>{
 assert.match(source,/admin-resend-notification/);
 assert.match(source,/Renvoyer l’e-mail/);
 assert.match(source,/a\.status==="active"\|\|a\.status==="rejected"/);
 assert.match(source,/window\.confirm\("Renvoyer l’e-mail/);
});
