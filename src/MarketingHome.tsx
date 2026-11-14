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
        <h2 id="difference-trimemo" className="text-center font-inter text-3xl font-bold text-[#0b1321] sm:text-4xl">Pourquoi choisir Trimémo plutôt qu’une IA généraliste ?</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center font-inter text-base leading-relaxed text-[#23334d]">Une IA généraliste peut vous aider à rédiger, mais obtenir un mémoire bien structuré demande souvent de maîtriser les prompts. <strong>Trimémo intègre déjà des prompts spécialisés, élaborés par un expert en méthodologie académique à partir de son expérience réelle de la rédaction.</strong></p>
        <div className="mx-auto mt-7 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-inter text-lg font-bold text-[#0b1321]">Avec une IA généraliste</h3>
            <p className="mt-2 font-inter text-sm leading-relaxed text-[#23334d]">Pour cadrer une rédaction académique, vous devez souvent imaginer des prompts précis, les ajuster et organiser vous-même les étapes de travail.</p>
          </article>
          <article className="rounded-xl border border-[#b9d7cb] bg-white p-6">
            <h3 className="font-inter text-lg font-bold text-[#006443]">Avec Trimémo, les prompts sont déjà intégrés</h3>
            <p className="mt-2 font-inter text-sm leading-relaxed text-[#23334d]">Décrivez votre projet et vos consignes. Trimémo vous guide avec une méthode spécialisée : problématique, plan, aperçu, rédaction et export Word. <strong>Pas besoin de savoir prompter.</strong></p>
          </article>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center font-inter text-xs leading-relaxed text-[#526174]">Trimémo assiste la rédaction : les sources, les analyses et la conformité académique restent à vérifier.</p>
      </div>
    </section>
    <section id="fonctionnement" className="px-5 py-12 sm:px-8"><div className="mx-auto max-w-[1420px]"><h2 className="text-center font-inter text-3xl font-bold text-[#0b1321] sm:text-4xl">Un parcours clair, du début à la fin</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({icon:Icon,title,description},i)=><article key={title} className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between text-[#006443]"><Icon size={34}/><span className="rounded-full bg-[#e8f4ef] px-3 py-1 text-sm font-bold">{i+1}</span></div><h3 className="mt-4 font-inter text-lg font-bold text-[#0b1321]">{i+1}. {title}</h3><p className="mt-2 font-inter text-sm leading-relaxed text-[#23334d]">{description}</p></article>)}</div>
      <div id="revision-humaine" className="mt-7 flex flex-wrap items-center gap-5 rounded-2xl bg-[#e8f4ef] p-6"><Users className="text-[#006443]" size={38}/><div className="flex-1"><h3 className="font-inter text-xl font-bold text-[#0b1321]">Besoin d’un regard humain ?</h3><p className="mt-1 font-inter text-sm text-[#23334d]">Faites relire votre document par un professionnel : révision humaine facultative et payante.</p></div><button onClick={onRevision} className="rounded-xl bg-[#005b3f] px-6 py-3 font-inter text-sm font-semibold text-white hover:bg-[#004832]">Découvrir la révision</button></div>
    </div></section>
    <section aria-labelledby="faq-trimemo" className="bg-[#f3f7f8] px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-[920px]">
        <h2 id="faq-trimemo" className="text-center font-inter text-3xl font-bold text-[#0b1321] sm:text-4xl">Questions fréquentes</h2>
        <p className="mt-3 text-center font-inter text-sm text-[#23334d]">Les réponses essentielles avant de commencer votre projet.</p>
        <div className="mt-7 space-y-3">
          {[
            {
              question: 'Faut-il savoir écrire des prompts pour utiliser Trimémo ?',
              answer: 'Non. Les prompts méthodologiques sont déjà intégrés. Vous décrivez votre sujet, votre niveau et vos consignes ; Trimémo vous guide à chaque étape.'
            },
            {
              question: 'Puis-je voir un aperçu avant de payer ?',
              answer: 'Oui. Vous consultez un aperçu adapté à la taille de votre projet, sans dépasser 2 500 mots. Le paiement intervient avant la rédaction complète.'
            },
            {
              question: 'Puis-je bénéficier d’une révision humaine de mon document ?',
              answer: 'Oui. Trimémo propose une révision humaine en option, après rédaction. Cette prestation est payante : son tarif dépend du document et du niveau de révision demandé.'
            },
            {
              question: 'Puis-je fournir mon guide méthodologique et mes consignes ?',
              answer: 'Oui. Vous pouvez transmettre vos consignes et vos documents de référence pour orienter la problématique, le plan et la rédaction.'
            },
            {
              question: 'Puis-je télécharger mon travail en Word ?',
              answer: 'Oui. Après le paiement et la rédaction complète, vous pouvez exporter votre document au format Word pour le relire et le corriger.'
            },
            {
              question: 'Trimémo garantit-il la validation de mon mémoire ?',
              answer: 'Non. Trimémo est un assistant de rédaction. Il est important de vérifier les sources, les analyses et la conformité du document aux exigences de votre établissement.'
            }
          ].map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-slate-200 bg-white px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-inter text-sm font-semibold text-[#0b1321] sm:text-base">
                <span>{question}</span>
                <span aria-hidden="true" className="shrink-0 text-2xl font-normal text-[#006443] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 pr-6 font-inter text-sm leading-relaxed text-[#23334d]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>


    <section id="contact" aria-labelledby="contact-trimemo" className="bg-white px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-[920px] rounded-2xl border border-[#d9e8e0] bg-[#f3f8f5] px-6 py-10 text-center shadow-sm sm:px-10">
        <h2 id="contact-trimemo" className="font-inter text-3xl font-bold text-[#0b1321]">Une question ? Contactez-nous</h2>
        <p className="mx-auto mt-3 max-w-xl font-inter text-sm leading-relaxed text-[#23334d] sm:text-base">Besoin d’une information sur Trimémo, votre projet ou nos services ? Notre équipe est à votre écoute.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="https://wa.me/447418359309" target="_blank" rel="noopener noreferrer" aria-label="Contacter Trimémo sur WhatsApp (nouvel onglet)" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#006443] px-6 py-3 font-inter text-sm font-semibold text-white transition hover:bg-[#004b32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006443] sm:w-auto">Contacter sur WhatsApp</a>
          <a href="mailto:redacmemo78@gmail.com?subject=Contact%20Trim%C3%A9mo" aria-label="Envoyer un e-mail à Trimémo" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#006443] bg-white px-6 py-3 font-inter text-sm font-semibold text-[#006443] transition hover:bg-[#e8f4ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006443] sm:w-auto">Envoyer un e-mail</a>
        </div>
      </div>
    </section>
  </>;
}
