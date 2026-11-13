import React from 'react';
import { Check, CheckCircle2, ClipboardList, Eye, FileText, FileUp, Users } from 'lucide-react';

export default function MarketingHome({ onStart, onRevision }: { onStart: () => void; onRevision: () => void }) {
  const steps = [
    { icon: FileText, title: 'Présentez votre projet', description: 'Sujet, niveau d’études, consignes et documents de référence.' },
    { icon: ClipboardList, title: 'Validez votre direction', description: 'Choisissez votre problématique et validez votre plan.' },
    { icon: Eye, title: 'Découvrez votre aperçu', description: 'Consultez un aperçu adapté à la taille de votre projet, dans la limite de 2 500 mots.' },
    { icon: FileUp, title: 'Finalisez votre document', description: 'Payez votre projet, poursuivez la rédaction et exportez en Word.' },
  ];
  return <>
    <section className="bg-gradient-to-b from-white to-[#f3f7f8] px-5 pb-8 pt-12 sm:px-8 lg:pt-16">
      <div className="mx-auto grid max-w-[1420px] items-center gap-12 lg:grid-cols-2">
        <div className="font-inter">
          <p className="text-lg font-bold text-[#006443] sm:text-xl">Votre assistant IA prompté pour la rédaction académique</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-[#0b1321] sm:text-5xl xl:text-6xl">De votre sujet à un <span className="text-[#006443]">mémoire structuré.</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#23334d] sm:text-xl">Préparez votre mémoire, rapport ou thèse avec Trimémo : problématique, plan personnalisé, rédaction assistée par IA et export Word.</p>
          <button onClick={onStart} className="mt-8 rounded-xl bg-[#005b3f] px-8 py-4 text-base font-bold text-white shadow-sm hover:bg-[#004832] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005b3f]">Commencer mon projet</button>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#23334d] sm:text-base">Décrivez votre projet, transmettez vos consignes et vos documents de référence.</p>
        </div>
        <div aria-label="Illustration de l’espace de rédaction" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 font-inter"><span className="text-xl font-bold text-[#006443]">Trimémo</span><span className="text-sm font-semibold text-[#172554]">Mon mémoire</span><span className="rounded-lg bg-[#e8f4ef] px-3 py-2 text-xs font-semibold text-[#006443]">✓ Enregistré</span></div>
          <div className="grid min-h-[280px] grid-cols-[130px_1fr] sm:grid-cols-[180px_1fr]">
            <div className="space-y-5 border-r border-slate-200 bg-slate-50/50 p-4 font-inter text-xs font-semibold text-[#102030]">{['Problématique validée','Plan validé','Rédaction en cours'].map((label,i)=><div key={label} className="flex items-center gap-2"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${i===2?'border-2 border-[#006443]':'bg-[#006443] text-white'}`}>{i<2&&<Check size={13}/>}</span>{label}</div>)}</div>
            <div className="p-4 sm:p-6"><div className="mb-5 border-b border-slate-200 pb-3 font-inter text-xs text-slate-500">Paragraphe　　B　 I　 U　 ☷</div><h2 className="font-serif text-lg font-bold text-[#101827] sm:text-xl">INTRODUCTION GÉNÉRALE</h2><p className="mt-4 font-serif text-sm leading-relaxed text-slate-800">Ce travail s’inscrit dans une réflexion sur la place de la digitalisation dans le fonctionnement des organisations. Il vise à analyser ses effets sur les pratiques et la coordination.</p><p className="mt-3 font-serif text-sm leading-relaxed text-slate-800">Après avoir présenté le contexte et l’intérêt du sujet, nous formulerons la problématique qui guide cette étude.</p><div className="mt-5 text-right font-inter text-xs font-bold text-[#006443]">▣　Export Word</div></div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 text-center font-inter text-sm text-[#23334d] sm:text-base">Licence　·　Master　·　Doctorat　　|　　Mémoire　·　Rapport　·　Article　·　Thèse</p>
    </section>
    <section aria-labelledby="difference-trimemo" className="bg-[#f3f7f8] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[1420px]">
        <h2 id="difference-trimemo" className="text-center font-inter text-3xl font-bold text-[#0b1321] sm:text-4xl">Pourquoi Trimémo est différent d’une IA généraliste</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center font-inter text-base leading-relaxed text-[#23334d]">Trimémo utilise l’intelligence artificielle avec un parcours et des prompts conçus à partir de l’expérience réelle de son promoteur dans la rédaction académique.</p>
        <div className="mx-auto mt-7 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-inter text-lg font-bold text-[#0b1321]">Avec une IA généraliste</h3>
            <p className="mt-2 font-inter text-sm leading-relaxed text-[#23334d]">Vous dialoguez librement avec l’IA et organisez vous-même les consignes, les étapes et la structure de votre travail.</p>
          </article>
          <article className="rounded-xl border border-[#b9d7cb] bg-white p-6">
            <h3 className="font-inter text-lg font-bold text-[#006443]">Avec Trimémo</h3>
            <p className="mt-2 font-inter text-sm leading-relaxed text-[#23334d]">Vous suivez une méthode guidée : problématique, plan, aperçu avant paiement, rédaction et export Word, selon votre sujet et vos consignes.</p>
          </article>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center font-inter text-xs leading-relaxed text-[#526174]">Le contenu produit avec l’IA doit toujours être relu, vérifié et adapté aux exigences de votre établissement.</p>
      </div>
    </section>
    <section id="fonctionnement" className="px-5 py-12 sm:px-8"><div className="mx-auto max-w-[1420px]"><h2 className="text-center font-inter text-3xl font-bold text-[#0b1321] sm:text-4xl">Un parcours clair, du début à la fin</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({icon:Icon,title,description},i)=><article key={title} className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between text-[#006443]"><Icon size={34}/><span className="rounded-full bg-[#e8f4ef] px-3 py-1 text-sm font-bold">{i+1}</span></div><h3 className="mt-4 font-inter text-lg font-bold text-[#0b1321]">{i+1}. {title}</h3><p className="mt-2 font-inter text-sm leading-relaxed text-[#23334d]">{description}</p></article>)}</div>
      <div id="revision-humaine" className="mt-7 flex flex-wrap items-center gap-5 rounded-2xl bg-[#e8f4ef] p-6"><Users className="text-[#006443]" size={38}/><div className="flex-1"><h3 className="font-inter text-xl font-bold text-[#0b1321]">Besoin d’un regard humain ?</h3><p className="mt-1 font-inter text-sm text-[#23334d]">Demandez une révision adaptée à votre document.</p></div><button onClick={onRevision} className="rounded-xl bg-[#005b3f] px-6 py-3 font-inter text-sm font-semibold text-white hover:bg-[#004832]">Découvrir la révision</button></div>
    </div></section>

  </>;
}
