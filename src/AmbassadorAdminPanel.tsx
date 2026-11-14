import React,{useCallback,useEffect,useState} from "react";
import {CheckCircle2,RefreshCcw,ShieldCheck,Users} from "lucide-react";

type Ambassador={id:string;full_name:string;university:string;city:string;whatsapp:string;status:string;referral_code:string;created_at:string;approved_at:string|null};
type Commission={order_id:string;ambassador_id:string;sale_amount:number;currency:string;commission_amount:number;status:string;created_at:string;paid_at:string|null;payout_reference:string|null};
type Data={ambassadors:Ambassador[];referrals:Array<{ambassador_id:string;project_id:string}>;commissions:Commission[];limit:number};
const format=(amount:number,currency:string)=>Number(amount||0).toLocaleString("fr-FR",{maximumFractionDigits:currency==="XOF"?0:2})+" "+(currency==="XOF"?"FCFA":currency);
export default function AmbassadorAdminPanel({token}:{token:string}){
 const [data,setData]=useState<Data|null>(null),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [payouts,setPayouts]=useState<Record<string,string>>({});
 const request=useCallback(async(action:string,body:Record<string,unknown>={})=>{
  const res=await fetch("/api/ambassadors",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({action,...body})});
  const payload=await res.json().catch(()=>({}));
  if(!res.ok||!payload.ok)throw new Error(payload.error||"Une opération a échoué.");
  return payload;
 },[token]);
 const refresh=useCallback(async()=>{
  setBusy(true);setError("");
  try{setData(await request("admin-list"));}
  catch(e){setError(e instanceof Error?e.message:"Impossible de charger les ambassadeurs.");}
  finally{setBusy(false);}
 },[request]);
 useEffect(()=>{void refresh();},[refresh]);
 const decide=async(row:Ambassador,status:string)=>{
  if(!window.confirm(status==="active"?"Approuver cette candidature pour le pilote ?":status==="suspended"?"Suspendre cet ambassadeur ?":"Ne pas retenir cette candidature ?"))return;
  setBusy(true);setError("");setNotice("");
  try{await request("admin-decision",{id:row.id,status});setNotice("Statut mis à jour.");await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Décision indisponible.");}
  finally{setBusy(false);}
 };
 const payout=async(c:Commission)=>{
  const reference=String(payouts[c.order_id]||"").trim();
  if(reference.length<6){setError("Saisissez la référence du virement réellement effectué (au moins 6 caractères).");return;}
  if(!window.confirm("Avez-vous déjà envoyé ce paiement à l’ambassadeur ? Cette action ne déclenche aucun virement."))return;
  setBusy(true);setError("");setNotice("");
  try{await request("admin-payout",{orderId:c.order_id,reference});setNotice("Commission marquée comme versée.");await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Validation du paiement impossible.");}
  finally{setBusy(false);}
 };
 const ambassadors=data?.ambassadors||[],commissions=data?.commissions||[],referrals=data?.referrals||[];
 const active=ambassadors.filter(a=>a.status==="active").length;
 const pending=ambassadors.filter(a=>a.status==="pending").length;
 const map=new Map(ambassadors.map(a=>[a.id,a]));
 return <section className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1B4D3E]/20 bg-white p-5">
   <div><h2 className="text-xl font-bold">Programme Ambassadeurs Trimémo</h2><p className="mt-2 text-sm">Pilote : 10 places • commission fixe 10 % • paiement manuel après 14 jours et contrôle des remboursements.</p></div>
   <button disabled={busy} onClick={()=>void refresh()} className="inline-flex items-center gap-2 rounded-xl bg-[#1B4D3E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><RefreshCcw size={16}/> Actualiser</button>
  </div>
  <div className="grid gap-3 sm:grid-cols-3">
   {[{name:"Ambassadeurs actifs",value:active+" / "+(data?.limit||10),icon:ShieldCheck},{name:"Candidatures à examiner",value:String(pending),icon:Users},{name:"Projets parrainés",value:String(referrals.length),icon:CheckCircle2}].map(({name,value,icon:Icon})=><div key={name} className="rounded-2xl border border-[#1B4D3E]/20 bg-white p-5"><Icon size={22}/><div className="mt-2 text-2xl font-bold">{value}</div><p className="text-xs">{name}</p></div>)}
  </div>
  {error&&<p role="alert" className="rounded-xl bg-[#B42318]/10 p-3 text-sm text-[#B42318]">{error}</p>}
  {notice&&<p role="status" className="rounded-xl bg-[#E7F1EC] p-3 text-sm">{notice}</p>}
  <div className="rounded-2xl border border-[#1B4D3E]/20 bg-white p-5">
   <h3 className="text-lg font-bold">Candidatures</h3>
   <div className="mt-4 space-y-3">
    {!ambassadors.length?<p className="text-sm">Aucune candidature pour le moment.</p>:ambassadors.map(a=><article key={a.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#1B4D3E]/15 p-4">
     <div><h4 className="font-bold">{a.full_name}</h4><p className="mt-1 text-sm">{a.university} • {a.city}</p><p className="mt-1 text-xs">{a.whatsapp} • {new Date(a.created_at).toLocaleDateString("fr-FR")}</p><p className="mt-1 text-xs font-semibold">Statut : {a.status==="pending"?"À examiner":a.status==="active"?"Actif":a.status==="rejected"?"Non retenu":"Suspendu"}</p>{a.status==="active"&&<p className="mt-1 text-xs">Code : {a.referral_code}</p>}<p className="mt-1 text-xs">Projets parrainés : {referrals.filter(r=>r.ambassador_id===a.id).length}</p></div>
     <div className="flex flex-wrap gap-2">
      {a.status!=="active"&&<button disabled={busy||active>=(data?.limit||10)} onClick={()=>void decide(a,"active")} className="rounded-lg bg-[#1B4D3E] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Approuver</button>}
      {a.status==="pending"&&<button disabled={busy} onClick={()=>void decide(a,"rejected")} className="rounded-lg border px-4 py-2 text-xs font-bold">Non retenu</button>}
      {a.status==="active"&&<button disabled={busy} onClick={()=>void decide(a,"suspended")} className="rounded-lg border border-[#B42318]/30 px-4 py-2 text-xs font-bold text-[#B42318]">Suspendre</button>}
     </div>
    </article>)}
   </div>
  </div>
  <div className="rounded-2xl border border-[#1B4D3E]/20 bg-white p-5">
   <h3 className="text-lg font-bold">Commissions enregistrées</h3>
   <p className="mt-2 text-xs leading-5">Les commissions naissent uniquement des paiements confirmés. Vous effectuez les versements en dehors de Trimémo, puis vous enregistrez leur référence ici. Aucun transfert automatique n’est effectué.</p>
   <div className="mt-4 space-y-3">{commissions.length?commissions.map(c=><article key={c.order_id} className="rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{map.get(c.ambassador_id)?.full_name||"Ambassadeur"}</p><p className="mt-1 text-xs">{c.order_id} • {new Date(c.created_at).toLocaleDateString("fr-FR")}</p></div><div className="text-right"><strong>{format(c.commission_amount,c.currency)}</strong><p className="text-xs">Vente : {format(c.sale_amount,c.currency)} • {c.status==="pending"?"À vérifier":c.status==="paid"?"Payée":c.status==="void"?"Annulée":"À régulariser"}</p></div></div>
    {c.status==="pending"&&<div className="mt-3 flex flex-wrap gap-2"><input aria-label={"Référence de virement "+c.order_id} placeholder="Référence du virement déjà effectué" value={payouts[c.order_id]||""} onChange={e=>setPayouts(cur=>({...cur,[c.order_id]:e.target.value}))} className="min-w-[220px] flex-1 rounded-lg border border-[#1B4D3E]/20 p-2 text-xs"/><button disabled={busy} onClick={()=>void payout(c)} className="rounded-lg bg-[#1B4D3E] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Marquer comme versée</button></div>}
    {c.status==="paid"&&<p className="mt-2 text-xs">Référence : {c.payout_reference||"Non disponible"}</p>}
   </article>):<p className="text-sm">Aucune commission pour le moment.</p>}</div>
  </div>
 </section>;
}
