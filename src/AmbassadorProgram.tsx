import React, {useEffect,useMemo,useState} from "react";
import {ArrowLeft,CheckCircle2,Copy,ExternalLink,Users} from "lucide-react";

type Ambassador={id:string;full_name:string;university:string;city:string;status:"pending"|"active"|"rejected"|"suspended";referral_code:string|null;approved_at:string|null};
type Commission={sale_amount:number;currency:string;commission_amount:number;status:string;created_at:string;paid_at:string|null};
type Profile={ambassador:Ambassador|null;referralCount?:number;commissions?:Commission[]};
const URL="/api/ambassadors";
const format=(amount:number,currency:string)=>Number(amount||0).toLocaleString("fr-FR",{maximumFractionDigits:currency==="XOF"?0:2})+" "+(currency==="XOF"?"FCFA":currency);
function sessionToken():string {
 try{return String(JSON.parse(window.localStorage.getItem("trimemo_client_session")||"null")?.token||"");}catch{return "";}
}

export default function AmbassadorProgram({onBack,onLogin}:{onBack:()=>void;onLogin:()=>void}){
 const [token,setToken]=useState(sessionToken);
 const [profile,setProfile]=useState<Profile|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [fullName,setFullName]=useState("");
 const [university,setUniversity]=useState("");
 const [city,setCity]=useState("");
 const [whatsapp,setWhatsapp]=useState("");
 const [motivation,setMotivation]=useState("");
 const [consent,setConsent]=useState(false);
 const endpoint=async(action:string,body:Record<string,unknown>={})=>{
  const response=await fetch(URL,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({action,...body})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok)throw new Error(data?.error||"La demande n'a pas pu être traitée.");
  return data;
 };
 const reload=async()=>{
  if(!token){setProfile({ambassador:null});return;}
  setBusy(true);setError("");
  try{setProfile(await endpoint("me"));}
  catch(e){setError(e instanceof Error?e.message:"Votre statut est indisponible.");}
  finally{setBusy(false);}
 };
 useEffect(()=>{const fresh=sessionToken();setToken(fresh);},[]);
 useEffect(()=>{void reload();},[token]);
 const commissions=profile?.commissions||[];
 const totals=useMemo(()=>{
  const byCurrency:Record<string,{pending:number;paid:number}>={};
  for(const c of commissions){
   if(!["pending","paid"].includes(c.status))continue;
   const currency=String(c.currency||"");
   const current=byCurrency[currency]||{pending:0,paid:0};
   current[c.status as "pending"|"paid"]+=Number(c.commission_amount||0);
   byCurrency[currency]=current;
  }
  return byCurrency;
 },[commissions]);
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();setError("");setNotice("");setBusy(true);
  try{
   const data=await endpoint("apply",{fullName,university,city,whatsapp,motivation,consent});
   setProfile({ambassador:data.ambassador});setNotice(data.message||"Candidature envoyée.");
  }catch(e){setError(e instanceof Error?e.message:"Envoi impossible.");}
  finally{setBusy(false);}
 };
 const me=profile?.ambassador;
 const referralLink=me?.status==="active"&&me.referral_code?"https://trimemo-redac.company/?ref="+encodeURIComponent(me.referral_code):"";
 const copyLink=async()=>{
  if(!referralLink)return;
  try{await navigator.clipboard.writeText(referralLink);setNotice("Lien copié.");}
  catch{setNotice("Sélectionnez et copiez le lien affiché.");}
 };
 return <main className="min-h-[76vh] bg-[#E7F1EC]/50 px-4 py-12 font-inter text-[#1B4D3E] sm:px-6">
  <div className="mx-auto max-w-[1050px]">
   <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"><ArrowLeft size={17}/> Retour à l’accueil</button>
   <div className="rounded-3xl bg-[#1B4D3E] p-8 text-white shadow-sm sm:p-12">
    <span className="text-xs font-bold uppercase tracking-widest text-white/80">Recrutement pilote • 10 places</span>
    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Programme Ambassadeurs Trimémo</h1>
    <p className="mt-4 max-w-2xl leading-7 text-white/90">Présentez Trimémo à votre communauté universitaire et recevez une commission de 10 % sur les commandes admissibles réellement payées grâce à votre lien.</p>
    <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold"><Users size={20}/> 10 ambassadeurs retenus pour la phase pilote</div>
   </div>
   <div className="my-7 grid gap-4 md:grid-cols-3">
    {[
     ["1. Candidatez","Inscrivez-vous à Trimémo et envoyez votre candidature avec votre établissement."],
     ["2. Partagez votre lien","Après validation, recevez un lien personnel vers le site et présentez-le de façon transparente."],
     ["3. Recevez 10 %","Vos ventes confirmées sont suivies. Les versements sont validés manuellement après vérification."]
    ].map(([title,description])=><article key={title} className="rounded-2xl border border-[#1B4D3E]/15 bg-white p-6"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm leading-6">{description}</p></article>)}
   </div>
   <div className="rounded-3xl border border-[#1B4D3E]/15 bg-white p-6 shadow-sm sm:p-9">
    <h2 className="text-2xl font-bold">Mon espace ambassadeur</h2>
    {!token?<div className="mt-4"><p className="max-w-2xl text-sm leading-7">Pour postuler et consulter vos commissions, connectez-vous ou créez gratuitement votre compte Trimémo. Ce programme ne demande pas d’abonnement.</p><button onClick={onLogin} className="mt-5 rounded-xl bg-[#1B4D3E] px-6 py-3 font-semibold text-white">Se connecter ou créer un compte</button></div>
    :busy&&!profile?<p className="mt-4 text-sm">Chargement de votre candidature…</p>
    :!me?<form onSubmit={submit} className="mt-5 grid gap-4">
      <p className="text-sm leading-6">Les candidatures sont examinées individuellement. L’inscription ne garantit pas une place parmi les dix ambassadeurs du pilote.</p>
      <div className="grid gap-4 sm:grid-cols-2">
       {[["Nom et prénom",fullName,setFullName],["Établissement ou université",university,setUniversity],["Ville",city,setCity],["WhatsApp (avec indicatif)",whatsapp,setWhatsapp]].map(([label,value,update])=><label key={label as string} className="text-sm font-semibold">{label as string}<input required maxLength={label==="Établissement ou université"?180:120} value={value as string} onChange={e=>(update as (v:string)=>void)(e.target.value)} className="mt-2 w-full rounded-xl border border-[#1B4D3E]/20 p-3 font-normal outline-none focus:ring-2 focus:ring-[#1B4D3E]/30" /></label>)}
      </div>
      <label className="text-sm font-semibold">Pourquoi souhaitez-vous représenter Trimémo ? (facultatif)<textarea rows={3} maxLength={1200} value={motivation} onChange={e=>setMotivation(e.target.value)} className="mt-2 w-full rounded-xl border border-[#1B4D3E]/20 p-3 font-normal"/></label>
      <label className="flex items-start gap-3 text-xs leading-6"><input required type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1.5" /><span>J’accepte d’être contacté au sujet de ma candidature et que ces informations soient utilisées pour gérer le programme. Je m’engage à signaler clairement mes liens rémunérés, à respecter les groupes universitaires et les règles d’intégrité académique.</span></label>
      <button type="submit" disabled={busy||!consent} className="rounded-xl bg-[#1B4D3E] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy?"Envoi…":"Envoyer ma candidature"}</button>
     </form>
    :<div className="mt-5">
      <div className="flex flex-wrap items-center gap-3"><strong>{me.full_name}</strong><span className="rounded-full bg-[#E7F1EC] px-3 py-1 text-xs font-semibold">{me.status==="active"?"Ambassadeur actif":me.status==="pending"?"Candidature à l’étude":me.status==="rejected"?"Candidature non retenue":"Compte ambassadeur suspendu"}</span></div>
      <p className="mt-2 text-sm">{me.university} • {me.city}</p>
      {me.status==="active"&&<div className="mt-6 space-y-4">
       <div className="rounded-xl border border-[#1B4D3E]/20 bg-[#E7F1EC]/60 p-5"><label className="text-xs font-semibold uppercase">Votre lien personnel</label><div className="mt-3 flex flex-wrap gap-2"><input aria-label="Lien de parrainage" readOnly value={referralLink} className="min-w-0 flex-1 rounded-xl border border-[#1B4D3E]/20 bg-white p-3 text-sm"/><button onClick={()=>void copyLink()} className="inline-flex items-center gap-2 rounded-xl bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white"><Copy size={16}/> Copier</button></div><a href={referralLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline"><ExternalLink size={13}/> Tester mon lien</a></div>
       <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs">Projets attribués</p><p className="mt-2 text-2xl font-bold">{profile?.referralCount||0}</p></div><div className="rounded-xl border p-4 sm:col-span-2"><p className="text-xs font-semibold">Commissions par devise</p>{Object.entries(totals).length?Object.entries(totals).map(([currency,t])=><div key={currency} className="mt-2 text-sm">{currency} : {format(t.pending,currency)} en attente • {format(t.paid,currency)} versés</div>):<p className="mt-2 text-sm">Aucune vente rémunérée pour le moment.</p>}</div></div>
       {commissions.length>0&&<div><h3 className="font-bold">Mes ventes attribuées</h3><div className="mt-3 space-y-2">{commissions.slice(0,30).map((c,i)=><div key={i} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm"><span>{new Date(c.created_at).toLocaleDateString("fr-FR")} • {c.status==="pending"?"En validation":c.status==="paid"?"Versée":c.status==="void"?"Annulée":"À régulariser"}</span><strong>{format(c.commission_amount,c.currency)}</strong></div>)}</div></div>}
      </div>}
      {me.status==="pending"&&<p className="mt-4 rounded-xl bg-[#E7F1EC] p-4 text-sm leading-6">Votre candidature est enregistrée. Vous recevrez votre lien personnel après approbation par l’administrateur.</p>}
      {me.status==="rejected"&&<p className="mt-4 text-sm">Votre candidature n’a pas été retenue pour ce pilote.</p>}
      <button onClick={()=>void reload()} disabled={busy} className="mt-5 text-sm font-semibold underline disabled:opacity-50">Actualiser mon statut</button>
     </div>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-[#B42318]/10 p-3 text-sm text-[#B42318]">{error}</p>}
    {notice&&<p role="status" className="mt-4 rounded-xl bg-[#E7F1EC] p-3 text-sm"><CheckCircle2 size={16} className="mr-2 inline"/>{notice}</p>}
   </div>
   <p className="mt-6 text-xs leading-6 text-[#1B4D3E]/80">Conditions du pilote : commission fixe de 10 % sur les paiements définitivement confirmés, aucune commission sur les inscriptions, commandes annulées ou remboursées ; versement manuel après contrôle et un délai minimum de 14 jours. Aucun revenu n’est garanti. Les ambassadeurs indiquent leur intérêt commercial dans leurs publications et ne présentent pas les travaux générés comme dispensant de respecter les consignes des établissements.</p>
  </div>
 </main>;
}
