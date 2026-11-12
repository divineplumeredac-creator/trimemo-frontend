const test=require('node:test');const assert=require('node:assert/strict');
const makeRes=()=>({code:0,headers:{},status(v){this.code=v;return this},json(v){this.body=v;return this},send(v){this.body=v;return this},setHeader(k,v){this.headers[k]=v}});
test('relais réservé au test, sans destination arbitraire et sans divulguer l’identité',async()=>{
 const {makeSandboxBridge}=await import('../api/sandbox-bridge.js');const old={...process.env};let captured;
 try {process.env.VERCEL_ENV='preview';process.env.VITE_FEDAPAY_SANDBOX_ENABLED='true';const bridge=makeSandboxBridge({getToken:async()=>'fake-identity',send:async(url,opts)=>{captured={url:String(url),opts};return new Response('{"ok":true}',{headers:{'content-type':'application/json'}})}});
 let r=makeRes();await bridge({url:'/api/sandbox-bridge?__route=client-account&action=login',method:'POST',headers:{'content-type':'application/json',authorization:'Bearer user'},body:{a:1}},r);assert.equal(r.code,200);assert.match(captured.url,/\/api\/client-account\?action=login$/);assert.equal(captured.opts.headers['x-vercel-trusted-oidc-idp-token'],'fake-identity');assert.ok(!String(r.body).includes('fake-identity'));
 r=makeRes();await bridge({url:'/api/sandbox-bridge?__route=https%3A%2F%2Fevil.example',method:'GET',headers:{}},r);assert.equal(r.code,404);
 process.env.VERCEL_ENV='production';r=makeRes();await bridge({url:'/api/sandbox-bridge?__route=client-account',method:'POST',headers:{}},r);assert.equal(r.code,404);
 }finally {for(const k of ['VERCEL_ENV','VITE_FEDAPAY_SANDBOX_ENABLED']) if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}
});
