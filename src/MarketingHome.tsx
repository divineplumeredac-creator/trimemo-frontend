import React from 'react';
import { ArrowRight, BookOpen, Check, CheckCircle2, ClipboardList, Eye, FileText, FileUp, GraduationCap, Layers, Mail, ShieldCheck, Users } from 'lucide-react';

const ink = '#173F4D';
const gold = '#C6A477';
const steps = [
  { icon: ClipboardList, title: 'Présentez votre projet', description: 'Décrivez votre sujet, votre niveau d’études, vos consignes et vos documents de référence.' },
  { icon: Layers, title: 'Validez votre problématique et votre plan', description: 'Choisissez votre problématique, ajustez les propositions et validez un plan adapté.' },
  { icon: FileText, title: 'Rédigez progressivement', description: 'Lancez la rédaction selon le plan validé : Trimémo développe votre document étape par étape, jusqu’à l’aperçu.' },
  { icon: Eye, title: 'Découvrez votre aperçu', description: 'Consultez un aperçu adapté à la taille de votre projet, dans la limite de 2 500 mots, avant de payer.' },
  { icon: FileUp, title: 'Finalisez votre document et exportez', description: 'Après paiement, poursuivez la rédaction complète et exportez votre document au format Word.' },
];
const questions = [
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
];

function EditorialTitle({eyebrow,title,description}:{eyebrow:string;title:string;description?:string}) {
  return <div className="mx-auto max-w-3xl text-center">
    <div className="text-[11px] font-semibold uppercase tracking-[0.21em] text-[#927447]">{eyebrow}</div>
    <h2 className="mt-3 font-playfair text-3xl font-bold leading-tight text-[#173F4D] sm:text-4xl lg:text-[42px]">{title}</h2>
    {description && <p className="mt-4 text-sm leading-7 text-[#5E6B73] sm:text-base">{description}</p>}
  </div>;
}

function WritingWorkspacePreview(){
  const nav = ['Projet','Problématique','Plan','Rédaction','Export Word'];
  return <div data-nosnippet="true" className="studio-product-preview relative mx-auto w-full max-w-[675px]" aria-label="Exemple illustratif de l’espace de rédaction Trimémo">
    <div className="absolute -left-4 -top-5 -z-10 h-44 w-44 rounded-full bg-[#C6A477]/20 blur-3xl"/>
    <div className="absolute -bottom-7 -right-4 -z-10 h-56 w-56 rounded-full bg-[#173F4D]/15 blur-3xl"/>
    <div className="overflow-hidden rounded-[22px] border border-[#C9D5D4] bg-white shadow-[0_28px_70px_-30px_rgba(23,63,77,0.45)]">
      <div className="flex items-center justify-between border-b border-[#E6E1D8] bg-[#FBFAF7] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2"><img src="/trimemo-tm.svg" alt="" className="h-7 w-8 object-contain"/><span className="font-playfair text-lg font-bold text-[#173F4D]">Trimémo</span></div>
        <span className="hidden text-xs font-medium text-[#5E6B73] sm:block">Mon projet de mémoire</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F2ED] px-2.5 py-1 text-[10px] font-semibold text-[#2B7058]"><CheckCircle2 size={13}/> Enregistré</span>
      </div>
      <div className="grid min-h-[360px] grid-cols-[122px_minmax(0,1fr)] sm:grid-cols-[164px_minmax(0,1fr)]">
        <aside className="bg-[#173F4D] px-2 py-6 text-white sm:px-3">
          <div className="mb-6 px-2 text-[9px] font-bold uppercase tracking-[0.17em] text-white/60 sm:text-[10px]">Parcours</div>
          <nav aria-label="Exemple de navigation du projet" className="space-y-1.5">{nav.map((label,index)=><div key={label} className={'flex items-center gap-2 rounded-lg px-2 py-2.5 text-[10px] sm:text-xs '+(index===3?'bg-[#F7F5EF] font-bold text-[#173F4D]':'text-white/85')}><span className={'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border '+(index<3?'border-[#C6A477] bg-[#C6A477] text-[#173F4D]':index===3?'border-[#173F4D]':'border-white/40')}>{index<3?<Check size={12}/>:index===3?'4':''}</span><span>{label}</span></div>)}</nav>
          <div className="mt-8 h-[1px] bg-white/15"/><div className="mt-3 px-2 text-[10px] text-white/60">Avancement du projet</div>
          <div className="mx-2 mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-3/5 rounded-full bg-[#C6A477]"/></div>
        </aside>
        <div className="min-w-0 bg-[#F2F3F1] p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5E6B73]">Rédaction · Introduction</span>
            <span className="rounded-md border border-[#C6A477]/60 bg-[#F8F0E2] px-2 py-1 text-[10px] font-semibold text-[#173F4D]">Exporter Word</span>
          </div>
          <div className="mx-auto min-h-[290px] max-w-[380px] border border-[#E6E1D8] bg-white px-4 py-6 shadow-[0_10px_30px_-18px_rgba(23,63,77,0.32)] sm:px-7">
            <div className="font-serif text-center text-[13px] font-bold uppercase text-[#27323A] sm:text-sm">Introduction générale</div>
            <p className="mt-5 font-serif text-[11px] leading-[1.75] text-[#27323A] sm:text-xs">Dans un contexte de transformations économiques et sociales, la digitalisation occupe une place croissante dans le fonctionnement des organisations.</p>
            <div className="mt-4 font-serif text-xs font-bold text-[#27323A]">1. Contexte et intérêt du sujet</div>
            <p className="mt-3 font-serif text-[11px] leading-[1.75] text-[#27323A] sm:text-xs">Ce travail examine les changements induits par les outils numériques dans les pratiques de gestion, la coordination et la création de valeur.</p>
            <p className="mt-3 font-serif text-[11px] leading-[1.75] text-[#27323A] sm:text-xs">L’analyse vise à éclairer les enjeux méthodologiques et organisationnels associés à cette évolution.</p>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-3 text-center text-[11px] text-[#5E6B73]">Aperçu illustratif de l’environnement de travail</div>
  </div>;
}

export default function MarketingHome({ onStart, onRevision, onAmbassadors }: { onStart: () => void; onRevision: () => void; onAmbassadors: () => void }) {
  return <div className="studio-home font-inter text-[#173F4D]">
    <section className="relative overflow-hidden bg-[#F7F5EF] px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:pb-24">
      <div className="pointer-events-none absolute -right-20 top-4 h-[500px] w-[500px] rounded-full bg-[#E5D6BB]/40 blur-[100px]"/>
      <div className="relative mx-auto grid max-w-[1340px] items-center gap-14 lg:grid-cols-[0.90fr_1.10fr] lg:gap-12">
        <div className="max-w-[600px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C6A477]/45 bg-white/65 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#927447]"><GraduationCap size={16}/> Votre studio académique</div>
          <h1 className="mt-7 font-playfair text-[clamp(2.7rem,5vw,4.65rem)] font-bold leading-[1.10] tracking-[-0.035em] text-[#173F4D]">Rédigez votre mémoire <span className="relative whitespace-nowrap">avec méthode<span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-[#C6A477]"/></span>.</h1>
          <p className="mt-7 max-w-[570px] text-base leading-[1.85] text-[#5E6B73] sm:text-lg">Mémoire, rapport de stage ou thèse : Trimémo vous accompagne de la problématique au plan, de l’aperçu à la rédaction assistée, jusqu’à l’export Word de votre document académique.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={onStart} className="inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-[#173F4D] px-7 py-4 text-sm font-semibold text-white shadow-[0_10px_25px_-13px_rgba(23,63,77,0.75)] transition hover:-translate-y-0.5 hover:bg-[#245B6D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173F4D]">Commencer mon projet <ArrowRight size={17}/></button>
            <a href="#fonctionnement" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-[#C6A477] bg-transparent px-6 py-4 text-sm font-semibold text-[#173F4D] transition hover:bg-[#EEE3D2]">Découvrir le parcours</a>
          </div>
          <p className="mt-4 max-w-lg text-xs leading-6 text-[#67747A]">Décrivez votre projet, transmettez vos consignes et vos documents de référence.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-[#DED8CD] pt-5 text-xs font-medium text-[#55666E]">
            <span className="inline-flex items-center gap-2"><GraduationCap size={17} color={gold}/> Licence · Master · Doctorat</span>
            <span className="hidden h-4 w-px bg-[#C6A477]/70 sm:block"/>
            <span className="inline-flex items-center gap-2"><BookOpen size={17} color={gold}/> Mémoire · Rapport · Article · Thèse</span>
          </div>
        </div>
        <WritingWorkspacePreview/>
      </div>
    </section>

    <section aria-labelledby="difference-trimemo" className="bg-white px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1190px]">
        <EditorialTitle eyebrow="Une méthode avant tout" title="Pourquoi choisir Trimémo ?" description="Un accompagnement conçu pour les exigences de la rédaction académique, sans avoir à construire seul une suite de prompts." />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[24px] border border-[#C6A477]/60 bg-[#FDFBF7] p-7 shadow-[0_15px_40px_-32px_rgba(23,63,77,0.35)] sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><BookOpen size={28} color={gold}/><h3 className="font-playfair text-2xl font-bold text-[#173F4D]">Avec Trimémo</h3></div><span className="rounded-full bg-[#F4E7D0] px-3 py-1.5 text-[11px] font-semibold text-[#856638]">Pensé pour les études</span></div>
            <ul className="mt-8 space-y-5">{[
              'Des prompts méthodologiques déjà structurés pour guider le travail.',
              'Un parcours complet : problématique, plan, aperçu, rédaction.',
              'Un aperçu du document avant le paiement.',
              'Un export Word à relire et à adapter aux consignes de l’établissement.'
            ].map(item=><li key={item} className="flex items-start gap-3 text-sm leading-7 text-[#485C65]"><span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C6A477] text-white"><Check size={14}/></span>{item}</li>)}</ul>
          </article>
          <article className="rounded-[24px] border border-[#E3E6E7] bg-[#F5F7F7] p-7 sm:p-9">
            <div className="flex items-center gap-3"><Layers size={28} color={ink}/><h3 className="font-playfair text-2xl font-bold text-[#173F4D]">Avec une IA généraliste</h3></div>
            <p className="mt-8 text-sm leading-8 text-[#5E6B73]">Pour obtenir un mémoire bien organisé, vous devez généralement définir vous-même les instructions, construire un déroulement méthodologique et relier les différentes étapes.</p>
            <div className="mt-6 border-l-[3px] border-[#C6A477] pl-5 text-sm leading-8 text-[#5E6B73]">Trimémo intègre ces étapes dans un parcours académique guidé, élaboré à partir d’une expérience pratique de la rédaction.</div>
          </article>
        </div>
        <p className="mt-6 text-center text-xs leading-6 text-[#788187]">Trimémo assiste la rédaction : les sources, les analyses et la conformité académique restent à vérifier.</p>
      </div>
    </section>

    <section id="fonctionnement" className="scroll-mt-24 bg-[#F7F5EF] px-5 py-20 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-[1320px]">
        <EditorialTitle eyebrow="De l'idée au document" title="Un parcours clair, du début à la fin" description="Avancez étape par étape dans votre travail académique, à votre rythme." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{steps.map(({icon:Icon,title,description},index)=><article key={title} className="group relative flex h-full flex-col rounded-[22px] border border-[#E6E1D8] bg-white p-7 transition hover:-translate-y-1 hover:border-[#C6A477] hover:shadow-[0_12px_40px_-27px_rgba(23,63,77,0.4)]">
          <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1E8D8] text-[#173F4D]"><Icon size={22}/></span><span className="font-playfair text-3xl font-bold text-[#C6A477]">0{index+1}</span></div>
          <h3 className="mt-7 font-playfair text-xl font-bold leading-snug text-[#173F4D]">{title}</h3>
          <p className="mt-4 text-sm leading-7 text-[#5E6B73]">{description}</p>
        </article>)}</div>
        <div className="mt-10 flex justify-center"><button onClick={onStart} className="inline-flex items-center gap-2 rounded-xl bg-[#173F4D] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#245B6D]">Commencer mon projet <ArrowRight size={17}/></button></div>
      </div>
    </section>

    <section id="revision-humaine" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-20">
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[28px] bg-[#173F4D] px-7 py-10 text-white sm:px-12 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-36 h-[420px] w-[420px] rounded-full border-[75px] border-[#C6A477]/12"/>
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#C6A477]/10 to-transparent"/>
        <div className="relative grid items-center gap-7 md:grid-cols-[100px_minmax(0,1fr)_auto]">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#C6A477]/50 bg-white/5"><Users size={36} color={gold}/></div>
          <div><span className="text-xs font-semibold uppercase tracking-[0.17em] text-[#E7CF9E]">Un regard complémentaire</span><h2 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">Révision humaine</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/85">Besoin d’un regard expert ? Faites relire votre document par un professionnel. La révision humaine est facultative et fait l’objet d’un devis distinct.</p></div>
          <button onClick={onRevision} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E8D3AC] px-6 py-4 text-sm font-bold text-[#173F4D] transition hover:bg-[#F3E2C5]">Découvrir la révision <ArrowRight size={17}/></button>
        </div>
      </div>
    </section>

    <section id="ambassadeurs" className="scroll-mt-24 bg-white px-5 pb-20 pt-2 sm:px-8">
      <div className="mx-auto grid max-w-[1320px] items-center gap-8 overflow-hidden rounded-[28px] border border-[#E6E1D8] bg-[#F7F5EF] p-7 sm:p-10 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:gap-10">
        <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-[#C6A477]/35 bg-[#EEE4D4] lg:h-44"><GraduationCap size={70} color="#9A7846" strokeWidth={1.3}/></div>
        <div><span className="inline-flex rounded-full bg-[#EDE0C9] px-3 py-1.5 text-xs font-semibold text-[#886A3D]">Phase pilote · 10 places</span><h2 className="mt-4 font-playfair text-3xl font-bold text-[#173F4D]">Devenez ambassadeur Trimémo</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#5E6B73]">Vous êtes étudiant ? Faites connaître Trimémo dans votre université et bénéficiez de 10 % de commission sur les achats confirmés attribués à votre lien.</p></div>
        <button onClick={onAmbassadors} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173F4D] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#245B6D]">Découvrir le programme <ArrowRight size={17}/></button>
      </div>
    </section>

    <section id="guides-methodologiques" className="scroll-mt-24 bg-[#FBFAF7] px-5 py-20 sm:px-8" aria-labelledby="guides-methodologiques-titre">
      <div className="mx-auto max-w-[1200px]">
        <EditorialTitle eyebrow="Ressources gratuites" title="Guides pour rédiger un mémoire avec méthode" description="Des conseils concrets pour définir votre sujet, construire votre plan et préparer votre document académique avant d’utiliser Trimémo."/>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            {url:'/guides/rediger-un-memoire.html',title:'Comment rédiger un mémoire ?',description:'Du choix du sujet à la relecture finale : les étapes pour conduire un travail structuré.'},
            {url:'/guides/problematique-de-memoire.html',title:'Formuler une problématique de mémoire',description:'Transformer un thème général en question de recherche précise et exploitable.'},
            {url:'/guides/plan-de-memoire.html',title:'Construire un plan de mémoire',description:'Organiser parties, chapitres et sections autour d’une progression argumentative.'},
            {url:'/guides/rapport-de-stage.html',title:'Rédiger un rapport de stage',description:'Présenter son entreprise, ses missions, ses analyses et son bilan professionnel.'}
          ].map(item => <a key={item.url} href={item.url} className="group block rounded-[22px] border border-[#E3E6E7] bg-white p-7 shadow-sm transition hover:border-[#C6A477] hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#927447]"><BookOpen size={17}/> Guide académique</div>
            <h3 className="mt-4 font-playfair text-xl font-bold text-[#173F4D]">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#5E6B73]">{item.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#173F4D]">Lire le guide <ArrowRight size={16} className="transition group-hover:translate-x-1"/></span>
          </a>)}
        </div>
        <p className="mt-8 text-center text-sm leading-7 text-[#5E6B73]">Trimémo est un outil d’assistance. La vérification des sources, les choix méthodologiques et la conformité aux consignes de votre établissement restent essentiels.</p>
      </div>
    </section>

    <section aria-labelledby="faq-trimemo" className="bg-[#F7F5EF] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-[980px]">
        <EditorialTitle eyebrow="Des réponses transparentes" title="Questions fréquentes" description="Les informations essentielles pour commencer votre travail en toute clarté."/>
        <div className="mt-10 space-y-3">{questions.map(({question,answer})=><details key={question} className="group rounded-xl border border-[#E6E1D8] bg-white px-5 py-5 shadow-sm sm:px-7">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold leading-6 text-[#173F4D] sm:text-base"><span>{question}</span><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F5EF] text-xl font-normal text-[#9B7B46] transition-transform group-open:rotate-45">+</span></summary>
          <p className="mt-4 max-w-[780px] border-t border-[#E6E1D8] pt-4 text-sm leading-7 text-[#5E6B73]">{answer}</p>
        </details>)}</div>
      </div>
    </section>

    <section id="contact" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8" aria-labelledby="contact-trimemo">
      <div className="mx-auto max-w-[1080px] rounded-[26px] border border-[#E6E1D8] bg-[#FBF9F5] px-6 py-12 text-center sm:px-12">
        <Mail size={32} color={gold} className="mx-auto"/>
        <h2 id="contact-trimemo" className="mt-5 font-playfair text-3xl font-bold text-[#173F4D]">Une question ? Contactez-nous</h2>
        <p className="mx-auto mt-4 max-w-[580px] text-sm leading-7 text-[#5E6B73]">Besoin d’une information sur Trimémo, votre projet ou nos services ? Notre équipe est à votre écoute.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="https://wa.me/447418359309" target="_blank" rel="noopener noreferrer" aria-label="Contacter Trimémo sur WhatsApp (nouvel onglet)" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#173F4D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245B6D] sm:w-auto">Contacter sur WhatsApp</a>
          <a href="mailto:redacmemo78@gmail.com?subject=Contact%20Trim%C3%A9mo" aria-label="Envoyer un e-mail à Trimémo" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#C6A477] bg-white px-6 py-3 text-sm font-semibold text-[#173F4D] transition hover:bg-[#F7F5EF] sm:w-auto">Envoyer un e-mail</a>
        </div>
      </div>
    </section>
  </div>;
}
