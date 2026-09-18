import React, { useState } from 'react';

export default function App(){
  const [sujet, setSujet] = useState("Manager et management au profit des entreprises africaines");
  const [problematiques, setProblematiques] = useState<any[]>([]);
  const [badge, setBadge] = useState<'vert'|'orange'|null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try{
      const res = await fetch('https://trimemo-api.vercel.app/api/generate-problematics',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({sujet, domaine:'Gestion', niveau:'Master 2', type:'Mémoire', pages:60})
      });
      const data = await res.json();

      // FIX: bug problématique vide + fallback dynamique sujet
      if(data.error || !data.problematiques?.length){
        setProblematiques([
          {id:'p1', titre: `En quoi "${sujet}" constitue-t-il un levier de performance durable ?`, texte: `Comment ${sujet} peut-il être opérationnalisé pour améliorer durablement la compétitivité des entreprises africaines ?`, score:9.2},
          {id:'p2', titre: `Quels modèles de ${sujet} adaptés au contexte africain ?`, texte: `Dans quelle mesure ${sujet} nécessite-t-il une adaptation culturelle et structurelle propre aux entreprises africaines ?`, score:8.9},
          {id:'p3', titre: `Le ${sujet} : frein ou accélérateur ?`, texte: `Comment mesurer l'impact concret de ${sujet} sur la croissance des entreprises africaines ?`, score:8.6},
        ]);
        setBadge('orange');
      } else {
        setProblematiques(data.problematiques);
        setBadge('vert');
      }
    }catch(e){
      // Fallback ultime
      setProblematiques([
        {id:'p1', titre: `En quoi "${sujet}" est stratégique ?`, texte: `Question centrale avec sujet exact "${sujet}"`, score:9.2}
      ]);
      setBadge('orange');
    }finally{ setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-8">
      <div className="flex gap-2">
        {badge==='vert' && <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs">● API connectée • sujet exact utilisé</span>}
        {badge==='orange' && <span className="px-3 py-1 rounded-full bg-amber-400 text-[#0A2342] text-xs">● Mode local • sujet exact conservé</span>}
      </div>
      <input value={sujet} onChange={e=>setSujet(e.target.value)} className="mt-4 border p-3 rounded-xl w-full" />
      <button onClick={generate} className="mt-3 bg-[#0A2342] text-white px-6 py-3 rounded-xl">{loading?'Génération...':'Générer 3 problématiques avec sujet exact'}</button>
      <div className="mt-6 grid gap-3">
        {problematiques.map(p=><div key={p.id} className="bg-white p-4 rounded-xl border"><b>{p.titre}</b><p className="text-sm opacity-70">{p.texte}</p></div>)}
      </div>
    </div>
  )
}
