import { getVercelOidcToken } from '@vercel/oidc';

const UPSTREAM = 'https://trimemo-api-git-feat-fedapay-sandbox-divineplumeredac-4026.vercel.app';
const ROUTES = new Set(['academic','client-account','estimate-project','export','fedapay-sandbox','generate-block','generate-free-preview','generate-plans','generate-problematics','preview-continuation','project-state']);

export function makeSandboxBridge({getToken=getVercelOidcToken,send=fetch}={}) {
  return async function handler(req,res) {
    if(process.env.VERCEL_ENV !== 'preview' || process.env.VITE_FEDAPAY_SANDBOX_ENABLED !== 'true') return res.status(404).json({error:'Service indisponible.'});
    if(!['GET','POST','OPTIONS'].includes(req.method)) return res.status(405).json({error:'Méthode non autorisée.'});
    const input=new URL(req.url,'https://preview.invalid');
    const names=input.searchParams.getAll('__route');
    if(names.length!==1 || !ROUTES.has(names[0])) return res.status(404).json({error:'Route indisponible.'});
    input.searchParams.delete('__route');
    const destination=new URL('/api/'+names[0],UPSTREAM);
    destination.search=input.searchParams.toString();
    const headers={};
    for(const key of ['authorization','content-type','accept','x-trimemo-premium-token','x-trimemo-client-token']) if(req.headers[key]) headers[key]=req.headers[key];
    let token;try {token=await getToken()} catch {return res.status(503).json({error:'L’identité du serveur de test est indisponible.'});}
    if(!token)return res.status(503).json({error:'L’identité du serveur de test est indisponible.'});
    headers['x-vercel-trusted-oidc-idp-token']=token;
    let body;
    if(req.method==='POST' && req.body!=null) {
      body=typeof req.body==='string'||Buffer.isBuffer(req.body)?req.body:JSON.stringify(req.body);
      if(Buffer.byteLength(body)>4*1024*1024)return res.status(413).json({error:'Requête trop volumineuse.'});
    }
    try {
      const upstream=await send(destination,{method:req.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(240000)});
      if(upstream.status>=300&&upstream.status<400)return res.status(503).json({error:'L’accès au serveur de test est encore protégé.'});
      for(const header of ['content-type','content-disposition','cache-control']) {const value=upstream.headers.get(header);if(value)res.setHeader(header,value);}
      return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
    } catch {return res.status(503).json({error:'Le serveur de test est indisponible.'});}
  };
}
export default makeSandboxBridge();
