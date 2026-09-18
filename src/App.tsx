import React, { useState } from 'react';

const FILES = {
  problematics: `import OpenAI from 'openai';

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  console.log('ENV KEY EXISTS:', !!process.env.OPENAI_API_KEY);
  console.log('BODY:', req.body);

  try{
    const {sujet, domaine, niveau, type, pages, consignes} = req.body;
    
    if(!sujet || sujet.trim().length < 3){
      throw new Error('Champ "sujet" manquant ou vide. Frontend doit envoyer {sujet: "..."}');
    }
    if(!process.env.OPENAI_API_KEY){
      throw new Error('OPENAI_API_KEY manquante dans Vercel - Ajoutez-la en Production + Preview + Development puis Redeploy');
    }

    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

    const prompt = \`Sujet EXACT à traiter obligatoirement: "\${sujet}". 
Domaine: \${domaine || 'Gestion'}. 
Niveau: \${niveau || 'Master 2'}. 
Type: \${type || 'Mémoire'}. 
Pages: \${pages || 60}. 
Consignes: \${consignes || 'Aucune'}.

RÈGLE ABSOLUE: Tu DOIS inclure le sujet exact "\${sujet}" dans chaque problématique, mot pour mot.
Génère JSON strict:
{
  "problematiques":[
    {"id":"p1","titre":"titre contenant le sujet exact \\"\${sujet}\\"","texte":"question centrale avec sujet exact \\"\${sujet}\\"","angle":"...","score":9.2,"pertinence":"..."},
    {"id":"p2","titre":"...","texte":"...","angle":"...","score":8.8,"pertinence":"..."},
    {"id":"p3","titre":"...","texte":"...","angle":"...","score":8.5,"pertinence":"..."}
  ]
}\`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role:"system", content:"Tu es expert académique, tu réponds uniquement en JSON valide et tu dois inclure le sujet exact dans chaque sortie. Pas de markdown."},
        {role:"user", content: prompt}
      ],
      response_format: {type:"json_object"},
      temperature: 0.7
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log('OPENAI RESULT:', result);
    return res.status(200).json(result);

  }catch(e){
    console.error('API ERROR:', e);
    return res.status(200).json({
      error: e.message,
      debug: {keyExists: !!process.env.OPENAI_API_KEY, body: req.body, timestamp: new Date().toISOString()},
      problematiques: []
    });
  }
}`,
  plans: `import OpenAI from 'openai';

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  try{
    const {sujet, problematique, domaine, niveau} = req.body;
    if(!sujet) throw new Error('sujet manquant');
    if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquante');

    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

    const prompt = \`Sujet EXACT: "\${sujet}"
Problématique choisie: "\${problematique}"
Domaine: \${domaine} - Niveau: \${niveau}

Génère 3 plans détaillés qui traitent OBLIGATOIREMENT le sujet "\${sujet}".
Chaque plan doit mentionner le sujet exact dans ses titres de parties.

JSON attendu:
{
  "plans":[
    {
      "id":"plan1","titre":"Plan contenant \\"\${sujet}\\"",
      "parties":[
        {"titre":"Partie I - ... \\"\${sujet}\\"","sous_parties":["A. ...","B. ..."]},
        {"titre":"Partie II - ...","sous_parties":["A. ...","B. ..."]}
      ],
      "pertinence":9
    }
  ]
}\`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role:"system", content:"Expert académique. JSON valide uniquement. Tu DOIS inclure le sujet exact dans chaque titre."},
        {role:"user", content: prompt}
      ],
      response_format: {type:"json_object"},
      temperature: 0.7
    });

    return res.status(200).json(JSON.parse(completion.choices[0].message.content));
  }catch(e){
    console.error(e);
    return res.status(200).json({error: e.message, plans: []});
  }
}`,
  block: `import OpenAI from 'openai';

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  try{
    const {sujet, partie, plan, domaine, niveau} = req.body;
    if(!sujet) throw new Error('sujet manquant');
    if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquante');

    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

    const prompt = \`Sujet EXACT de mémoire: "\${sujet}"
Partie à rédiger: "\${partie}"
Plan global: \${JSON.stringify(plan).slice(0,1000)}
Domaine: \${domaine} - Niveau: \${niveau}

Rédige 400-500 mots académiques qui traitent directement "\${sujet}".
Le texte DOIT citer le sujet exact au moins 2 fois.
Ton académique, sources implicites, structuré.

JSON: {"contenu":"...texte avec sujet exact...","sources":["..."],"mots":450}\`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role:"system", content:"Rédacteur académique Master. Tu dois inclure le sujet exact mot pour mot au moins 2 fois dans chaque bloc."},
        {role:"user", content: prompt}
      ],
      response_format: {type:"json_object"},
      temperature: 0.7
    });

    return res.status(200).json(JSON.parse(completion.choices[0].message.content));
  }catch(e){
    console.error(e);
    return res.status(200).json({error: e.message, contenu: ""});
  }
}`
};

export default function App() {
  const [sujet, setSujet] = useState("Manager et management au profit des entreprises africaines");
  const [domaine, setDomaine] = useState("Gestion");
  const [niveau, setNiveau] = useState("Master 2");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [timeMs, setTimeMs] = useState<number | null>(null);
  const [apiUp, setApiUp] = useState<{ok:boolean; text:string; status:number} | null>(null);
  const [checkKeyResult, setCheckKeyResult] = useState<any>(null);
  const [checklist, setChecklist] = useState([false,false,false,false,false]);
  const [activeFile, setActiveFile] = useState<keyof typeof FILES>('problematics');
  const [copied, setCopied] = useState<string | null>(null);
  const [frontendSubject, setFrontendSubject] = useState(sujet);

  const containsSubject = result ? JSON.stringify(result).toLowerCase().includes(sujet.toLowerCase().split(' ').slice(0,3).join(' ').toLowerCase()) : null;
  const exactMatch = result ? JSON.stringify(result).includes(sujet) : null;

  const testApi = async () => {
    setLoading(true);
    setResult(null);
    setStatus(null);
    setTimeMs(null);
    const start = performance.now();
    try {
      const res = await fetch('https://trimemo-api.vercel.app/api/generate-problematics', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          sujet,
          domaine,
          niveau,
          type: 'Mémoire de fin d’études',
          pages: 60,
          consignes: 'Inclure le sujet exact mot pour mot dans chaque problématique'
        })
      });
      const elapsed = Math.round(performance.now() - start);
      setTimeMs(elapsed);
      setStatus(res.status);
      const json = await res.json().catch(async () => ({ raw: await res.text() }));
      setResult(json);
    } catch (e:any) {
      setResult({ error: e.message, hint: 'API peut être down ou CORS bloqué. Vérifiez URL dans Vercel.' });
      setStatus(0);
      setTimeMs(Math.round(performance.now() - start));
    } finally {
      setLoading(false);
    }
  };

  const checkApiUp = async () => {
    try {
      const res = await fetch('https://trimemo-api.vercel.app/api');
      const text = await res.text();
      setApiUp({ ok: res.ok, text: text.slice(0,600), status: res.status });
    } catch (e:any) {
      setApiUp({ ok: false, text: e.message, status: 0 });
    }
  };

  const checkKey = async () => {
    setCheckKeyResult({ loading: true });
    try {
      const res = await fetch('https://trimemo-api.vercel.app/api/debug-key', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ping: true }) });
      const json = await res.json();
      setCheckKeyResult(json);
    } catch (e:any) {
      setCheckKeyResult({
        exists: false,
        message: "Route /api/debug-key inexistante. C'est normal - elle n'est pas déployée.",
        action: "Allez dans Vercel > Votre projet > Settings > Environment Variables : vérifiez que OPENAI_API_KEY est bien listée. Puis Deployments > ... > Redeploy > UNCHECK 'Use existing Build Cache'",
        logs: "Vercel > Deployments > Dernier deployment > Runtime Logs > Cherchez 'ENV KEY EXISTS' après avoir déployé le fichier corrigé ci-dessous"
      });
    }
  };

  const copyFile = async (key: keyof typeof FILES) => {
    await navigator.clipboard.writeText(FILES[key]);
    setCopied(key);
    setTimeout(()=>setCopied(null), 2000);
  };

  const progress = checklist.filter(Boolean).length;

  // Fallback dynamique demo
  const fallbackProblematiques = [
    {
      id: 'p1',
      titre: `En quoi "${frontendSubject}" constitue-t-il un levier de performance durable ?`,
      texte: `Comment ${frontendSubject} peut-il être opérationnalisé pour améliorer durablement la compétitivité des entreprises africaines ?`,
      angle: "Performance & Durabilité",
      score: 9.2
    },
    {
      id: 'p2',
      titre: `Quels modèles de ${frontendSubject} adaptés au contexte africain ?`,
      texte: `Dans quelle mesure ${frontendSubject} nécessite-t-il une adaptation culturelle et structurelle propre aux entreprises africaines ?`,
      angle: "Contextualisation",
      score: 8.9
    },
    {
      id: 'p3',
      titre: `Le ${frontendSubject} : frein ou accélérateur de transformation ?`,
      texte: `Comment mesurer l'impact concret de ${frontendSubject} sur la croissance et la résilience des entreprises africaines ?`,
      angle: "Impact mesurable",
      score: 8.6
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0A2342] font-[Inter,system-ui,sans-serif]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-[#0A2342] text-white border-b border-[#C5A46B]/20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#C5A46B] grid place-items-center font-bold text-[#0A2342]">T</div>
            <span className="font-['Fraunces'] text-lg tracking-tight">TRIMEMO • DIAGNOSTIC CLÉ</span>
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase opacity-60 hidden md:block">Clé présente ≠ Clé utilisée • Fix immédiat</div>
          <div className="px-3 py-1 rounded-full bg-white/10 text-xs">Vercel + OpenAI</div>
        </div>
      </header>

      {/* BANDEAU 5 RAISONS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <div className="rounded-[24px] bg-[#0A2342] text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#C5A46B]/20 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A46B] text-[#0A2342] text-[11px] font-bold tracking-widest uppercase mb-4">Diagnostic • Ta clé est là mais le code ne l'utilise pas</div>
            <h1 className="font-['Fraunces'] text-3xl md:text-5xl leading-[0.95] max-w-3xl">Ta clé OPENAI est dans Vercel, mais tes problématiques parlent encore d'IA générative ?</h1>
            <p className="mt-4 text-white/70 max-w-2xl text-[15px] leading-relaxed">C'est 100% un bug de wiring, pas de clé. Voici les 5 raisons même avec clé présente — et le fix copier-coller juste en dessous.</p>
            
            <div className="grid md:grid-cols-5 gap-3 mt-8">
              {[
                {n:"01", t:"Clé ajoutée mais pas redeployée sans cache", d:"Vercel garde l'ancien build. Sans redeploy SANS cache, process.env.OPENAI_API_KEY reste undefined en prod."},
                {n:"02", t:"Clé seulement en Preview", d:"Tu as coché Preview mais pas Production. Ton API en prod lit vide et tombe en fallback générique."},
                {n:"03", t:"req.body.sujet jamais injecté dans le prompt", d:"L'ancien api/generate-problematics.js a un prompt fixe 'IA générative'. Il ignore ton sujet."},
                {n:"04", t:"Erreur OpenAI silencieuse → fallback générique", d:"Quota à 0$, clé invalide, ou response_format non parsé. Ton catch renvoie des problématiques mock sans le sujet."},
                {n:"05", t:"Frontend envoie 'sujet' mais API attend 'topic'", d:"Mismatch de nom de champ. req.body.topic est vide, donc prompt sans sujet."},
              ].map(r=>(
                <div key={r.n} className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                  <div className="text-[#C5A46B] font-bold text-xs tracking-widest">{r.n}</div>
                  <div className="mt-2 font-semibold text-[13px] leading-tight">{r.t}</div>
                  <div className="mt-2 text-[11.5px] leading-relaxed text-white/60">{r.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OUTIL DIAG */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* left tester */}
        <div className="rounded-[20px] bg-white border border-[#0A2342]/10 shadow-sm p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-['Fraunces'] text-2xl">Outil de diagnostic intégré</h2>
              <p className="text-[13px] text-[#0A2342]/60 mt-1">Teste ton API déployée en 1 clic. On vérifie si elle renvoie bien TON sujet.</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] uppercase tracking-widest font-semibold">Live</span>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold opacity-60">Sujet exact à tester (pré-rempli)</label>
              <input value={sujet} onChange={e=>setSujet(e.target.value)} className="mt-2 w-full rounded-xl border border-[#0A2342]/15 bg-[#F8F6F0] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C5A46B]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold opacity-60">Domaine</label>
              <select value={domaine} onChange={e=>setDomaine(e.target.value)} className="mt-2 w-full rounded-xl border border-[#0A2342]/15 bg-[#F8F6F0] px-3 py-3 text-[14px]">
                <option>Gestion</option><option>Droit</option><option>Marketing</option><option>Finance</option><option>RH</option>
              </select>
            </div>
          </div>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold opacity-60">Niveau</label>
              <select value={niveau} onChange={e=>setNiveau(e.target.value)} className="mt-2 w-full rounded-xl border border-[#0A2342]/15 bg-[#F8F6F0] px-3 py-3 text-[14px]">
                <option>Master 2</option><option>Master 1</option><option>Licence 3</option><option>Doctorat</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2 mt-6 md:mt-7">
              <button onClick={testApi} disabled={loading} className="flex-1 h-[46px] rounded-xl bg-[#0A2342] text-white font-semibold text-sm hover:bg-[#12345f] disabled:opacity-50">
                {loading ? 'Test en cours…' : 'Tester mon API Vercel → POST /generate-problematics'}
              </button>
              <button onClick={checkApiUp} className="h-[46px] px-4 rounded-xl border border-[#0A2342]/15 text-sm font-medium bg-white hover:bg-[#F8F6F0]">GET /api</button>
            </div>
          </div>

          {/* results */}
          <div className="mt-6 grid gap-4">
            {apiUp && (
              <div className={`rounded-xl p-4 border text-[12px] ${apiUp.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between"><span className="font-bold">GET https://trimemo-api.vercel.app/api → {apiUp.status}</span><span>{apiUp.ok ? 'UP' : 'DOWN'}</span></div>
                <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px]">{apiUp.text}</pre>
              </div>
            )}

            {(status !== null || result) && (
              <div className="rounded-xl border border-[#0A2342]/15 overflow-hidden">
                <div className="flex flex-wrap gap-2 p-3 bg-[#0A2342] text-white text-[12px]">
                  <span className="px-2 py-1 rounded bg-white/10">HTTP {status ?? '—'}</span>
                  <span className="px-2 py-1 rounded bg-white/10">{timeMs !== null ? `${timeMs} ms` : ''}</span>
                  {exactMatch !== null && (
                    <span className={`px-2 py-1 rounded font-bold ${exactMatch ? 'bg-emerald-400 text-[#0A2342]' : 'bg-amber-300 text-[#0A2342]'}`}>
                      {exactMatch ? '✓ Sujet exact trouvé dans réponse' : '✗ Sujet exact ABSENT → BUG CONFIRMÉ'}
                    </span>
                  )}
                  {containsSubject !== null && !exactMatch && (
                    <span className={`px-2 py-1 rounded ${containsSubject ? 'bg-white/20' : 'bg-red-400 text-white'}`}>{containsSubject ? 'Sujet partiel présent' : 'Aucune trace du sujet'}</span>
                  )}
                </div>
                <pre className="p-4 max-h-[380px] overflow-auto bg-[#FBFAF7] text-[11.5px] leading-relaxed font-mono whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
                <div className="p-3 bg-amber-50 border-t border-amber-200 text-[12px]">
                  {result?.error ? (
                    <div><b>Erreur visible renvoyée par API :</b> {result.error} <br/> <span className="opacity-70">Regarde Vercel &gt; Runtime Logs. Le fix fichier ci-dessous retourne volontairement l'erreur au frontend au lieu d'un fallback muet.</span></div>
                  ) : exactMatch ? (
                    <div className="text-emerald-800"><b>OK</b> — Ton API utilise bien le sujet. Si tu vois encore de l'IA générative, vide le cache navigateur et teste en navigation privée.</div>
                  ) : (
                    <div className="text-amber-800"><b>BUG CONFIRMÉ</b> — Réponse ne contient pas ton sujet mot pour mot. Remplace tes 3 fichiers API par les corrigés ci-dessous puis redeploy SANS cache.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-[#C5A46B]/50 bg-[#C5A46B]/10 p-4">
            <div className="text-[12px] font-bold">Test curl à coller dans ton terminal :</div>
            <code className="mt-2 block rounded-lg bg-[#0A2342] text-[#C5A46B] p-3 text-[11px] overflow-auto">{`curl -X POST https://trimemo-api.vercel.app/api/generate-problematics \\
  -H "Content-Type: application/json" \\
  -d '{"sujet":"${sujet}","domaine":"${domaine}","niveau":"${niveau}","type":"Mémoire","pages":60}'`}</code>
          </div>
        </div>

        {/* right checklist + verify key */}
        <div className="space-y-6">
          <div className="rounded-[20px] bg-white border border-[#0A2342]/10 shadow-sm p-5 md:p-6">
            <h3 className="font-['Fraunces'] text-xl">Vérifier ma clé</h3>
            <p className="text-[12px] opacity-60 mt-1">Si /api/debug-key n'existe pas, on t'explique où regarder.</p>
            <button onClick={checkKey} className="mt-4 w-full h-11 rounded-xl bg-[#C5A46B] text-[#0A2342] font-bold text-sm">Vérifier ma clé → POST /api/debug-key</button>
            {checkKeyResult && (
              <pre className="mt-4 rounded-xl bg-[#0A2342] text-white p-4 text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto">{JSON.stringify(checkKeyResult, null, 2)}</pre>
            )}
            <div className="mt-4 rounded-xl bg-[#0A2342]/5 p-3 text-[11.5px] leading-relaxed">
              <b>Où voir les logs Vercel :</b> Dashboard → ton projet trimemo-api → Deployments → dernier deployment → onglet <b>Runtime Logs</b> → filtre <code>ENV KEY EXISTS</code> ou <code>API ERROR</code>. Si tu vois <code>false</code> ou <code>OPENAI_API_KEY manquante</code>, refais Env Vars.
            </div>
          </div>

          <div className="rounded-[20px] bg-[#0A2342] text-white p-5 md:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-['Fraunces'] text-xl">Checklist Vercel</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${progress===5 ? 'bg-emerald-400 text-[#0A2342]' : 'bg-white/10'}`}>{progress}/5</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "OPENAI_API_KEY présente dans Settings > Env Vars > Production + Preview + Development",
                "Redeploy SANS cache fait après ajout (Deployments > ... > Redeploy > décocher 'Use existing Build Cache')",
                "Runtime Logs ne montrent pas 'OPENAI_API_KEY manquante' ni 'insufficient_quota'",
                "Test curl / fetch retourne sujet exact mot pour mot dans JSON",
                "Dashboard OpenAI platform.openai.com > Usage > pas à 0$ et clé active"
              ].map((t,i)=>(
                <label key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.06] border border-white/10 cursor-pointer hover:bg-white/[0.09]">
                  <input type="checkbox" checked={checklist[i]} onChange={()=>{ const c=[...checklist]; c[i]=!c[i]; setChecklist(c); }} className="mt-0.5 accent-[#C5A46B]" />
                  <span className="text-[12.5px] leading-snug">{t}</span>
                </label>
              ))}
            </div>
            {progress===5 && <div className="mt-4 rounded-xl bg-emerald-400 text-[#0A2342] p-3 text-[13px] font-bold text-center">✅ Tout est coché — ton API doit maintenant renvoyer le bon sujet !</div>}
          </div>
        </div>
      </section>

      {/* 3 FICHIERS CORRIGÉS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-10">
        <div className="rounded-[20px] bg-white border border-[#0A2342]/10 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-wrap items-start justify-between gap-4 border-b border-[#0A2342]/10">
            <div>
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl">3 fichiers API corrigés — copier-coller sur GitHub</h2>
              <p className="text-[13px] opacity-60 mt-2 max-w-2xl">Ces fichiers <b>forcent</b> l'utilisation du sujet. Ils loguent ENV et BODY, throw si clé manquante, et renvoient l'erreur visible au frontend au lieu d'un fallback muet.</p>
            </div>
            <div className="flex gap-2">
              {(Object.keys(FILES) as Array<keyof typeof FILES>).map(k=>(
                <button key={k} onClick={()=>setActiveFile(k)} className={`px-4 py-2 rounded-full text-xs font-bold border ${activeFile===k ? 'bg-[#0A2342] text-white border-[#0A2342]' : 'bg-white border-[#0A2342]/15'}`}>
                  {k === 'problematics' ? 'generate-problematics.js' : k === 'plans' ? 'generate-plans.js' : 'generate-block.js'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-0">
            <div className="bg-[#0A2342] text-[#E8E2D6] p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <span className="text-[11px] tracking-widest uppercase opacity-60">api/{activeFile === 'problematics' ? 'generate-problematics.js' : activeFile === 'plans' ? 'generate-plans.js' : 'generate-block.js'}</span>
                <button onClick={()=>copyFile(activeFile)} className="px-3 py-1.5 rounded-full bg-[#C5A46B] text-[#0A2342] text-xs font-bold">{copied===activeFile ? '✓ Copié' : 'Copier fichier'}</button>
              </div>
              <pre className="p-5 text-[11px] leading-relaxed overflow-auto max-h-[560px] whitespace-pre-wrap break-words">{FILES[activeFile]}</pre>
            </div>
            <div className="p-6 bg-[#FBFAF7]">
              <div className="rounded-xl bg-[#0A2342] text-white p-4 text-[12px] leading-relaxed">
                <div className="font-bold text-[#C5A46B] mb-2">Ce qui change vs ton ancien code :</div>
                <ul className="space-y-2 list-disc pl-4 opacity-90">
                  <li><code className="bg-white/10 px-1 rounded">console.log('ENV KEY EXISTS')</code> + <code>BODY</code> → tu vois tout dans Runtime Logs</li>
                  <li><code>{`const {sujet,...}=req.body`}</code> + validation <code>if(!sujet)</code> → plus de prompt vide</li>
                  <li>Prompt contient <code>{`"Sujet EXACT: \${sujet}"`}</code> + consigne "DOIT inclure sujet exact mot pour mot"</li>
                  <li>System prompt : "tu dois inclure le sujet exact dans chaque sortie"</li>
                  <li>Catch renvoie <code>{`{error, debug:{keyExists, body}, problematiques:[]}`}</code> → frontend voit l'erreur au lieu de fallback silencieux</li>
                </ul>
              </div>
              <div className="mt-4 rounded-xl border border-[#0A2342]/10 p-4">
                <div className="text-[12px] font-bold">Instructions push GitHub :</div>
                <ol className="mt-2 text-[12px] leading-relaxed space-y-1.5 list-decimal pl-4">
                  <li>Va dans ton repo GitHub <code>trimemo-api/api/</code></li>
                  <li>Remplace <b>generate-problematics.js</b>, <b>generate-plans.js</b>, <b>generate-block.js</b> par les versions ci-contre</li>
                  <li>Commit → Vercel redeploie auto</li>
                  <li>Ensuite Vercel → Deployments → dernier → <b>Redeploy → décoche "Use existing Build Cache"</b></li>
                  <li>Reteste avec l'outil en haut — tu dois voir ton sujet exact dans le JSON</li>
                </ol>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={()=>copyFile('problematics')} className="flex-1 h-10 rounded-xl bg-white border border-[#0A2342]/15 text-xs font-bold">Copier problematics</button>
                <button onClick={()=>copyFile('plans')} className="flex-1 h-10 rounded-xl bg-white border border-[#0A2342]/15 text-xs font-bold">Copier plans</button>
                <button onClick={()=>copyFile('block')} className="flex-1 h-10 rounded-xl bg-white border border-[#0A2342]/15 text-xs font-bold">Copier block</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FRONTEND CORRIGÉ PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-10 mb-16">
        <div className="rounded-[24px] border border-[#0A2342]/10 bg-white shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl">Frontend corrigé — 4 étapes épuré + fallback dynamique</h2>
              <p className="text-[13px] opacity-60 mt-1 max-w-2xl">Si l'API renvoie erreur, on ne retombe plus sur "IA générative". On reprend ton sujet exact mot pour mot. Badge vert = API OK, orange = fallback local avec ton sujet.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#0A2342] text-white text-[11px]">#0A2342</span>
              <span className="px-3 py-1 rounded-full bg-[#C5A46B] text-[#0A2342] text-[11px] font-bold">#C5A46B</span>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
            {/* mini form */}
            <div className="rounded-2xl bg-[#F8F6F0] border border-[#0A2342]/10 p-5">
              <div className="flex gap-2 text-[10px] tracking-widest uppercase font-bold">
                {["Sujet","Problématiques","Plan","Rédaction"].map((s,i)=>(
                  <span key={s} className={`px-2.5 py-1 rounded-full border ${i===0 ? 'bg-[#0A2342] text-white border-[#0A2342]' : 'bg-white border-[#0A2342]/10 opacity-60'}`}>{i+1}. {s}</span>
                ))}
              </div>
              <label className="mt-5 block text-[11px] uppercase tracking-widest font-bold opacity-60">Ton sujet exact</label>
              <input value={frontendSubject} onChange={e=>setFrontendSubject(e.target.value)} className="mt-2 w-full rounded-xl border border-[#0A2342]/15 bg-white px-4 py-3 text-[14px]" placeholder="Ex: Manager et management au profit des entreprises africaines" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white border border-[#0A2342]/10 p-3">
                  <div className="text-[10px] uppercase opacity-60">Badge API</div>
                  <div className="mt-1 inline-flex px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold">● API connectée • sujet exact utilisé</div>
                </div>
                <div className="rounded-xl bg-white border border-[#0A2342]/10 p-3">
                  <div className="text-[10px] uppercase opacity-60">Fallback</div>
                  <div className="mt-1 inline-flex px-2.5 py-1 rounded-full bg-amber-400 text-[#0A2342] text-[11px] font-bold">● Mode local • sujet exact conservé</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-[#0A2342] text-white p-4 text-[12px] leading-relaxed">
                <b>Code frontend à ajouter :</b>
                <pre className="mt-2 text-[10px] whitespace-pre-wrap break-words opacity-90">{`if (data.error || !data.problematiques?.length) {
  // FALLBACK DYNAMIQUE = reprend sujet exact mot pour mot
  data.problematiques = [
    { id:'p1', titre: \`En quoi "\${sujet}" ...\`, 
      texte: \`Comment \${sujet} ...\` }
  ];
  setBadge('orange');
} else {
  setBadge('vert');
}`}</pre>
              </div>
            </div>

            {/* preview problematiques */}
            <div className="rounded-2xl bg-white border border-[#0A2342]/10 p-5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-widest font-bold opacity-60">Aperçu génération avec sujet exact</div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">✓ Sujet exact injecté</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#C5A46B]/20 border border-[#C5A46B]/30 text-[#0A2342] text-[11px] font-bold">Fallback dynamique OK</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {fallbackProblematiques.map(p=>(
                  <div key={p.id} className="rounded-xl border border-[#0A2342]/10 p-4 hover:border-[#C5A46B]/40 transition">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-[14px] leading-tight">{p.titre}</h4>
                      <span className="px-2 py-1 rounded-full bg-[#0A2342] text-white text-[10px] font-bold">{p.score}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed opacity-80">{p.texte}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#F8F6F0] border border-[#0A2342]/10 text-[11px]">{p.angle}</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#C5A46B]/20 text-[11px] font-medium">Contient "{frontendSubject.slice(0,28)}..."</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-[#F8F6F0] border border-dashed border-[#0A2342]/20 p-4 text-[12px] leading-relaxed">
                <b>Flow 4 étapes épuré (sans commentaire technique) :</b><br/>
                1. L'utilisateur saisit son sujet exact → 2. On génère 3 problématiques contenant ce sujet mot pour mot → 3. Il choisit une problématique → 4. On génère plan + blocs qui citent encore le sujet exact. Chaque écran affiche seulement le sujet, pas de logs.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] tracking-widest uppercase opacity-40">Trimemo Diagnostic • Fix clé présente • Colors #0A2342 #C5A46B • Prêt à deploy</div>
      </section>
    </div>
  );
}
