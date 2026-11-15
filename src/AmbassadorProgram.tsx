import React, {useEffect,useMemo,useState} from "react";
import {ArrowLeft,CheckCircle2,Copy} from "lucide-react";

type Ambassador={id:string;full_name:string;university:string;city:string;status:"pending"|"active"|"rejected"|"suspended";referral_code:string|null;approved_at:string|null};
type Commission={sale_amount:number;currency:string;commission_amount:number;status:string;created_at:string;paid_at:string|null};
type Profile={ambassador:Ambassador|null;referralCount?:number;commissions?:Commission[]};
const URL="/api/ambassadors";
const format=(amount:number,currency:string)=>Number(amount||0).toLocaleString("fr-FR",{maximumFractionDigits:currency==="XOF"?0:2})+" "+(currency==="XOF"?"FCFA":currency);
function sessionToken():string {
 try{return String(JSON.parse(window.localStorage.getItem("trimemo_client_session")||"null")?.token||"");}catch{return "";}
}

export default function AmbassadorProgram({onBack,onLogin,onSignup,backLabel="Retour à l’accueil"}:{onBack:()=>void;onLogin:()=>void;onSignup:()=>void;backLabel?:string}){
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
   <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"><ArrowLeft size={17}/> {backLabel}</button>
   <div className="rounded-3xl bg-[#1B4D3E] p-8 text-white shadow-sm sm:p-12">
    <span className="text-xs font-bold uppercase tracking-widest text-white/80">Première sélection • 10 places</span>
    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Programme Ambassadeurs Trimémo</h1>
    <p className="mt-4 max-w-2xl leading-7 text-white/90">Faites découvrir Trimémo autour de vous et gagnez 10 % sur chaque achat confirmé grâce à votre lien personnel.</p>
   </div>
   <div className="my-7 grid gap-4 md:grid-cols-3">
    {[
     ["1. Postulez","Présentez-vous et indiquez votre établissement."],
     ["2. Partagez","Une fois accepté, partagez votre lien Trimémo autour de vous."],
     ["3. Gagnez 10 %","Recevez une commission sur les achats confirmés grâce à votre lien."]
    ].map(([title,description])=><article key={title} className="rounded-2xl border border-[#1B4D3E]/15 bg-white p-6"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm leading-6">{description}</p></article>)}
   </div>
   <div className="rounded-3xl border border-[#1B4D3E]/15 bg-white p-6 shadow-sm sm:p-9">
    <h2 className="text-2xl font-bold">Mon espace ambassadeur</h2>
    {!token?<div className="mt-4"><p className="max-w-2xl text-sm leading-7">Vous avez déjà un compte Trimémo ? Utilisez-le pour rejoindre le programme Ambassadeurs. Il n’est pas nécessaire de vous inscrire une deuxième fois.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={onLogin} className="rounded-xl bg-[#1B4D3E] px-6 py-3 font-semibold text-white">Se connecter</button><button onClick={onSignup} className="rounded-xl border border-[#1B4D3E] bg-white px-6 py-3 font-semibold text-[#1B4D3E]">Créer un compte</button></div></div>
    :busy&&!profile?<p className="mt-4 text-sm">Chargement de votre candidature…</p>
    :!me?<form onSubmit={submit} className="mt-5 grid gap-4">
      <p className="text-sm leading-6">Renseignez ces informations pour proposer votre candidature.</p>
      <div className="grid gap-4 sm:grid-cols-2">
       {[["Nom et prénom",fullName,setFullName],["Établissement ou université",university,setUniversity],["Ville",city,setCity],["WhatsApp (avec indicatif)",whatsapp,setWhatsapp]].map(([label,value,update])=><label key={label as string} className="text-sm font-semibold">{label as string}<input required maxLength={label==="Établissement ou université"?180:120} value={value as string} onChange={e=>(update as (v:string)=>void)(e.target.value)} className="mt-2 w-full rounded-xl border border-[#1B4D3E]/20 p-3 font-normal outline-none focus:ring-2 focus:ring-[#1B4D3E]/30" /></label>)}
      </div>
      <label className="text-sm font-semibold">Pourquoi souhaitez-vous représenter Trimémo ? (facultatif)<textarea rows={3} maxLength={1200} value={motivation} onChange={e=>setMotivation(e.target.value)} className="mt-2 w-full rounded-xl border border-[#1B4D3E]/20 p-3 font-normal"/></label>
      <label className="flex items-start gap-3 text-xs leading-6"><input required type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1.5" /><span>J’accepte d’être contacté pour ma candidature et je m’engage à indiquer clairement mes recommandations rémunérées et à respecter les règles de mon établissement.</span></label>
      <button type="submit" disabled={busy||!consent} className="rounded-xl bg-[#1B4D3E] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy?"Envoi…":"Envoyer ma candidature"}</button>
     </form>
    :<div className="mt-5">
      <div className="flex flex-wrap items-center gap-3"><strong>{me.full_name}</strong><span className="rounded-full bg-[#E7F1EC] px-3 py-1 text-xs font-semibold">{me.status==="active"?"Ambassadeur actif":me.status==="pending"?"En attente de réponse":me.status==="rejected"?"Candidature non retenue":"Participation suspendue"}</span></div>
      <p className="mt-2 text-sm">{me.university} • {me.city}</p>
      {me.status==="active"&&<div className="mt-6 space-y-4">
       <div className="rounded-xl border border-[#1B4D3E]/20 bg-[#E7F1EC]/60 p-5"><label className="text-xs font-semibold uppercase">Votre lien personnel</label><div className="mt-3 flex flex-wrap gap-2"><input aria-label="Lien de parrainage" readOnly value={referralLink} className="min-w-0 flex-1 rounded-xl border border-[#1B4D3E]/20 bg-white p-3 text-sm"/><button onClick={()=>void copyLink()} className="inline-flex items-center gap-2 rounded-xl bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white"><Copy size={16}/> Copier</button></div></div>
       <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs">Projets parrainés</p><p className="mt-2 text-2xl font-bold">{profile?.referralCount||0}</p></div><div className="rounded-xl border p-4 sm:col-span-2"><p className="text-xs font-semibold">Mes gains</p>{Object.entries(totals).length?Object.entries(totals).map(([currency,t])=><div key={currency} className="mt-2 text-sm">{format(t.pending,currency)} à recevoir • {format(t.paid,currency)} déjà versés</div>):<p className="mt-2 text-sm">Aucun gain pour le moment.</p>}</div></div>
       {commissions.length>0&&<div><h3 className="font-bold">Historique de mes gains</h3><div className="mt-3 space-y-2">{commissions.slice(0,30).map((c,i)=><div key={i} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm"><span>{new Date(c.created_at).toLocaleDateString("fr-FR")} • {c.status==="pending"?"À recevoir":c.status==="paid"?"Versée":c.status==="void"?"Annulée":"En cours de vérification"}</span><strong>{format(c.commission_amount,c.currency)}</strong></div>)}</div></div>}
      </div>}
      {me.status==="pending"&&<p className="mt-4 rounded-xl bg-[#E7F1EC] p-4 text-sm leading-6">Votre candidature a bien été reçue. Votre lien personnel sera disponible si elle est acceptée.</p>}
      {me.status==="rejected"&&<p className="mt-4 text-sm">Votre candidature n’a pas été retenue.</p>}
      {me.status==="suspended"&&<p className="mt-4 text-sm">Votre participation est actuellement suspendue. Contactez Trimémo pour en savoir plus.</p>}
      <button onClick={()=>void reload()} disabled={busy} className="mt-5 text-sm font-semibold underline disabled:opacity-50">Actualiser</button>
     </div>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-[#B42318]/10 p-3 text-sm text-[#B42318]">{error}</p>}
    {notice&&<p role="status" className="mt-4 rounded-xl bg-[#E7F1EC] p-3 text-sm"><CheckCircle2 size={16} className="mr-2 inline"/>{notice}</p>}
   </div>
   <details className="mt-6 rounded-xl border border-[#1B4D3E]/15 bg-white px-5 py-4">
    <summary className="cursor-pointer text-sm font-semibold">Conditions du programme</summary>
    <p className="mt-3 text-sm leading-6">Vous gagnez 10 % sur les achats confirmés grâce à votre lien. Les inscriptions seules, les achats annulés ou remboursés ne donnent pas lieu à une commission. Les gains sont versés après vérification, au plus tôt 14 jours après l’achat.</p>
    <p className="mt-2 text-sm leading-6">Présentez clairement votre rôle d’ambassadeur et respectez les règles académiques de votre établissement.</p>
   </details>
  </div>
 </main>;
}
