import React, { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, CircleDollarSign, Cpu, CreditCard,
  FileText, FolderOpen, LayoutDashboard, LogOut, RefreshCcw, ShieldCheck, SlidersHorizontal,
  Users, Wallet,
} from "lucide-react";

type Tab = "overview" | "clients" | "projects" | "orders" | "revisions" | "pricing" | "usage" | "logs";
type Props = { token: string; email: string; onLogout: () => void; onOpenWriter: () => void };

const API = "/api/admin-console";
const tabs: Array<{id:Tab;label:string;icon:React.ComponentType<any>}> = [
  { id: "overview", label: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "clients", label: "Comptes clients", icon: Users },
  { id: "projects", label: "Projets", icon: FolderOpen },
  { id: "orders", label: "Commandes et paiements", icon: CreditCard },
  { id: "revisions", label: "Révisions humaines", icon: FileText },
  { id: "pricing", label: "Tarifs et quotas", icon: SlidersHorizontal },
  { id: "usage", label: "Consommation OpenAI", icon: Cpu },
  { id: "logs", label: "Erreurs et journaux", icon: Activity },
];
const DOC_TYPES = [
  ["devoir", "Devoir"], ["rapport", "Rapport"], ["memoire", "Mémoire"], ["article", "Article"], ["these", "Thèse"],
];
const MARKET_LABELS: Record<string,string> = {
  africa: "Afrique francophone", europe: "Europe", northAmerica: "Canada / États-Unis", international: "Marché international",
};
const fmtNumber = (value: unknown) => Number(value || 0).toLocaleString("fr-FR");
const fmtMoney = (value: unknown, currency = "EUR") => {
  const number = Number(value || 0);
  const suffix = currency === "XOF" ? " FCFA" : currency === "EUR" ? " €" : currency === "USD" ? " $" : " " + currency;
  return number.toLocaleString("fr-FR", { maximumFractionDigits: currency === "XOF" ? 0 : 2, minimumFractionDigits: currency === "XOF" ? 0 : 2 }) + suffix;
};
const fmtDate = (value: unknown) => value ? new Date(String(value)).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";
const shortId = (value: unknown) => { const s=String(value||""); return s.length > 18 ? s.slice(0,8)+"…"+s.slice(-6) : s || "—"; };

function Button({children,onClick,disabled=false,variant="primary",type="button"}:any) {
  const common="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants:any={primary:"bg-[#1D78C1] text-white hover:bg-[#1768a9]",secondary:"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",danger:"bg-red-50 text-red-700 hover:bg-red-100",gold:"bg-[#D4A23A] text-[#172554] hover:bg-[#e3b34a]"};
  return <button type={type} onClick={onClick} disabled={disabled} className={common+" "+variants[variant]}>{children}</button>;
}
function Status({children,tone="neutral"}:any) {
  const style:any={neutral:"bg-slate-100 text-slate-600",green:"bg-emerald-50 text-emerald-700",red:"bg-red-50 text-red-700",amber:"bg-amber-50 text-amber-800",blue:"bg-blue-50 text-blue-700"};
  return <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold "+style[tone]}>{children}</span>;
}
function Card({title,value,sub,icon:Icon,tone="blue"}:any) {
  const backgrounds:any={blue:"bg-blue-50 text-blue-700",gold:"bg-amber-50 text-amber-700",green:"bg-emerald-50 text-emerald-700",red:"bg-red-50 text-red-700"};
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="text-sm font-medium text-slate-500">{title}</div><span className={"rounded-xl p-2 "+backgrounds[tone]}><Icon size={19}/></span></div>
    <div className="mt-3 break-words text-2xl font-bold tracking-tight text-[#172554]">{value ?? "—"}</div>
    {sub && <div className="mt-2 text-xs leading-5 text-slate-500">{sub}</div>}
  </div>;
}
function Empty({children="Aucune donnée à afficher."}:any) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">{children}</div>; }
function TableWrap({children}:any) { return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] border-collapse text-left text-sm">{children}</table></div>; }
function Th({children}:any) { return <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Td({children,className=""}:any) { return <td className={"border-b border-slate-100 px-4 py-3 align-top text-slate-700 "+className}>{children}</td>; }
function Progress({value}: {value:number}) { const percent=Math.max(0,Math.min(100,Number(value)||0)); return <div className="min-w-[130px]"><div className="mb-1 flex justify-between gap-2 text-xs text-slate-500"><span>Progression</span><strong className="text-slate-700">{percent}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1D78C1]" style={{width:percent+"%"}}/></div></div>; }

export default function AdminDashboard({ token, email, onLogout, onOpenWriter }: Props) {
  const [tab,setTab]=useState<Tab>("overview");
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [overview,setOverview]=useState<any>(null);
  const [clients,setClients]=useState<any[]>([]);
  const [projects,setProjects]=useState<any[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  const [revisions,setRevisions]=useState<any[]>([]);
  const [revisionNotes,setRevisionNotes]=useState<Record<string,string>>({});
  const [revisionFiles,setRevisionFiles]=useState<Record<string,File|null>>({});
  const [revenue,setRevenue]=useState<any>({by_currency:[],by_month:[]});
  const [settings,setSettings]=useState<any>(null);
  const [usage,setUsage]=useState<any>(null);
  const [logs,setLogs]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [logSeverity,setLogSeverity]=useState("all");

  const api = useCallback(async (action:string, body:Record<string,unknown>={}) => {
    const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({action,...body})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok || data?.ok===false) throw new Error(data?.error||"La requête administrateur a échoué.");
    return data;
  },[token]);

  const revisionApi = useCallback(async (action:string, body:Record<string,unknown>={}) => {
    const response=await fetch("/api/human-revisions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({action,...body})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok===false) throw new Error(data?.error||"Opération de révision impossible.");
    return data;
  },[token]);

  const refresh = useCallback(async (target:Tab=tab, quiet=false) => {
    if(!quiet) setLoading(true);
    setError("");
    try {
      if(target==="overview") setOverview(await api("overview"));
      if(target==="clients") setClients((await api("clients")).clients||[]);
      if(target==="projects") setProjects((await api("projects")).projects||[]);
      if(target==="orders") { const data=await api("orders"); setOrders(data.orders||[]); setRevenue(data.revenue||{by_currency:[],by_month:[]}); }
      if(target==="revisions") { const data=await revisionApi("list"); setRevisions(data.requests||[]); }
      if(target==="pricing") setSettings((await api("pricing")).settings);
      if(target==="usage") setUsage(await api("usage"));
      if(target==="logs") setLogs((await api("logs")).logs||[]);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally { if(!quiet) setLoading(false); }
  },[api,revisionApi,tab]);

  useEffect(()=>{void refresh("overview");},[api]);

  function selectTab(next:Tab) { setTab(next); setSearch(""); setNotice(""); void refresh(next); }
  async function updateClient(client:any) {
    const next=client.access==="suspended"?"active":"suspended";
    const question=next==="suspended"?"Suspendre ce compte client ?":"Rétablir l’accès de ce client ?";
    if(!window.confirm(question)) return;
    setError("");setNotice("");
    try { await api("update-client",{clientId:client.id,access:next}); setNotice(next==="suspended"?"Compte suspendu.":"Accès client rétabli."); await refresh("clients",true); }
    catch(e){setError(e instanceof Error?e.message:"La modification du compte a échoué.");}
  }
  async function doRefund(order:any) {
    const pending=order.refund_status==="processing";
    const question=pending?"Vérifier l’état de ce remboursement auprès de PayPal ?":"Confirmer le remboursement complet de cette commande via PayPal ?";
    if(!window.confirm(question)) return;
    setError("");setNotice("");
    try {
      const data=await api("refund-order",{orderId:order.order_id});
      setNotice(data.order?.refund_status==="refunded"?"Remboursement confirmé par PayPal.":"La demande est en cours de traitement par PayPal.");
      await Promise.all([refresh("orders",true),refresh("overview",true)]);
    } catch(e){setError(e instanceof Error?e.message:"Le remboursement a échoué.");}
  }
  async function downloadRevisionFile(row:any, delivery=false) {
    try {
      const data=await revisionApi("file",{id:row.id,delivery});
      const binary=atob(data.base64); const bytes=new Uint8Array(binary.length); for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
      const blob=new Blob([bytes],{type:data.type||"application/octet-stream"}); const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;link.download=data.name||"document-revision";link.click();URL.revokeObjectURL(url);
    } catch(e){setError(e instanceof Error?e.message:"Téléchargement impossible.");}
  }
  async function updateRevision(row:any,status:string) {
    setError("");setNotice("");
    try {
      let file:any=undefined; const selected=revisionFiles[String(row.id)];
      if(status==="completed"){
        if(!selected){setError("Joignez le document corrigé avant de terminer la demande.");return;}
        if(selected.size>3*1024*1024){setError("Le document livré doit faire moins de 3 Mo.");return;}
        const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||"").split(",")[1]||"");reader.onerror=()=>reject(new Error("Lecture du fichier impossible."));reader.readAsDataURL(selected);});
        file={name:selected.name,type:selected.type,base64};
      }
      await revisionApi("update",{id:row.id,status,adminNotes:revisionNotes[String(row.id)]||row.admin_notes||"",file});
      setNotice(status==="completed"?"Document livré et demande clôturée.":"Statut de la demande mis à jour.");
      await refresh("revisions",true);
    } catch(e){setError(e instanceof Error?e.message:"Mise à jour impossible.");}
  }

  function updateRate(market:string,type:string,value:string) {
    setSettings((current:any)=>({...current,pricing_config:{...current.pricing_config,markets:{...current.pricing_config.markets,[market]:{...current.pricing_config.markets[market],rates:{...current.pricing_config.markets[market].rates,[type]:value}}}}}));
  }
  function updateQuota(key:string,value:string) { setSettings((current:any)=>({...current,quotas:{...current.quotas,[key]:value}})); }
  function updateCost(key:string,value:string) { setSettings((current:any)=>({...current,usage_costs:{...current.usage_costs,[key]:value===""?null:value}})); }
  async function saveSettings(event:any) {
    event.preventDefault(); if(!settings) return;
    setSaving(true);setError("");setNotice("");
    try { const data=await api("save-settings",{pricing_config:settings.pricing_config,quotas:settings.quotas,usage_costs:settings.usage_costs}); setSettings(data.settings);setNotice("Paramètres enregistrés. Les nouveaux tarifs et quotas sont appliqués côté serveur."); }
    catch(e){setError(e instanceof Error?e.message:"L’enregistrement a échoué.");}
    finally{setSaving(false);}
  }

  const summary=overview?.summary||{};
  const filterRows=(rows:any[], keys:string[])=>rows.filter(row=>keys.some(key=>String(row?.[key]??"").toLowerCase().includes(search.toLowerCase())));
  const filteredClients=filterRows(clients,["email","display_name","id"]);
  const filteredProjects=filterRows(projects,["subject","email","domain","project_id"]);
  const filteredOrders=filterRows(orders,["order_id","subject","customer_email","status","currency"]);
  const filteredLogs=logs.filter(row=>(logSeverity==="all"||row.severity===logSeverity)&&filterRows([row],["message","action","category","request_path","actor"] ).length);

  return <div className="min-h-screen bg-[#F4F7FB] font-inter text-[#172554]">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#172554] text-white shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><ShieldCheck size={22} className="text-[#D4A23A]"/></div>
          <div className="min-w-0"><div className="truncate text-lg font-bold">Trimémo <span className="font-medium text-[#D4A23A]">Admin</span></div><div className="truncate text-xs text-white/60">Console de gestion sécurisée</div></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[240px] truncate text-xs text-white/70 md:block">{email}</span>
          <Button variant="secondary" onClick={onOpenWriter}><FileText size={16}/> Atelier de rédaction</Button>
          <button onClick={onLogout} title="Déconnexion" className="rounded-xl p-2.5 text-white/80 hover:bg-white/10 hover:text-white"><LogOut size={18}/></button>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-5 px-3 py-5 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-[88px]">
        <div className="hidden px-3 pb-3 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 lg:block">Administration</div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>selectTab(item.id)} className={"flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition "+(tab===item.id?"bg-[#172554] text-white shadow-sm":"text-slate-600 hover:bg-slate-50 hover:text-[#172554]")}><Icon size={17}/><span className="whitespace-nowrap">{item.label}</span></button>;})}
        </nav>
        <div className="mt-4 hidden rounded-xl bg-[#F6F8FC] p-3 text-xs leading-5 text-slate-500 lg:block">
          Les données clients, paiements et journaux sont chargés depuis le serveur sécurisé. Les secrets PayPal et OpenAI ne sont jamais transmis à l’interface.
        </div>
      </aside>

      <main className="min-w-0 space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><div className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A23A]">Centre de contrôle</div><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{tabs.find(item=>item.id===tab)?.label}</h1><p className="mt-2 text-sm text-slate-500">Données issues du backend Trimémo et de Supabase.</p></div>
          <Button variant="secondary" disabled={loading} onClick={()=>void refresh(tab)}><RefreshCcw size={16} className={loading?"animate-spin":""}/> Actualiser</Button>
        </div>

        {error&&<div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle size={18} className="mt-0.5 shrink-0"/><div>{error}</div></div>}
        {notice&&<div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><div>{notice}</div></div>}
        {loading&&!overview&&tab==="overview"&&<Empty>Chargement des indicateurs…</Empty>}

        {tab==="overview"&&overview&&<div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Comptes clients" value={fmtNumber(summary.clients)} sub="Comptes enregistrés dans Supabase Auth" icon={Users}/>
            <Card title="Projets" value={fmtNumber(summary.projects)} sub={fmtNumber(summary.activeProjects)+" projet(s) encore incomplet(s)"} icon={FolderOpen} tone="gold"/>
            <Card title="Commandes payées" value={fmtNumber(summary.paidOrders)} sub={fmtNumber(summary.pendingOrders)+" en attente de paiement"} icon={CreditCard} tone="green"/>
            <Card title="Erreurs journalisées" value={fmtNumber(summary.errorLogs)} sub={fmtNumber(summary.usage?.errors)+" échec(s) d’appel OpenAI dans le journal d’usage"} icon={AlertTriangle} tone="red"/>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><CircleDollarSign className="text-[#D4A23A]" size={20}/><h2 className="text-lg font-bold">Revenus de la plateforme</h2></div>
            <p className="mt-1 text-sm text-slate-500">Montants séparés par devise pour éviter d’additionner des monnaies différentes. Le revenu net affiché tient compte des remboursements enregistrés, avant déduction des commissions du prestataire de paiement.</p>
            {summary.revenue?.by_currency?.length?<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{summary.revenue.by_currency.map((row:any)=><div key={row.currency} className="rounded-xl border border-slate-200 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.currency}</div><div className="mt-2 text-2xl font-bold">{fmtMoney(row.net,row.currency)}</div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><div className="text-slate-500">Encaissements bruts</div><strong>{fmtMoney(row.gross,row.currency)}</strong></div><div><div className="text-slate-500">Remboursements</div><strong>{fmtMoney(row.refunds,row.currency)}</strong></div></div><div className="mt-3 text-xs text-slate-500">{row.paid_orders} commande(s) payée(s) • {row.refunded_orders} remboursée(s)</div></div>)}</div>:<Empty>Aucun revenu enregistré pour le moment.</Empty>}
          </section>
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Consommation OpenAI</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-4"><div className="text-xs text-blue-700">Total tokens</div><div className="mt-2 text-xl font-bold">{fmtNumber(summary.usage?.total_tokens)}</div></div><div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-amber-800">Appels enregistrés</div><div className="mt-2 text-xl font-bold">{fmtNumber(summary.usage?.requests)}</div></div></div><p className="mt-3 text-xs leading-5 text-slate-500">{summary.usage?.cost_coverage ? fmtNumber(summary.usage.cost_coverage)+" appel(s) avec coût estimé renseigné." : "Le coût en dollars apparaîtra après configuration du coût par million de tokens dans « Tarifs et quotas »."}</p></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Dernières commandes</h2>{summary.recentOrders?.length?<div className="mt-3 divide-y divide-slate-100">{summary.recentOrders.slice(0,6).map((o:any)=><div key={o.order_id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{o.subject||shortId(o.order_id)}</div><div className="mt-1 text-xs text-slate-500">{fmtDate(o.paid_at||o.created_at)}</div></div><div className="shrink-0 text-right"><div className="font-semibold">{fmtMoney(o.amount,o.currency)}</div><Status tone={o.status==="refunded"?"red":o.status==="pending"?"amber":"green"}>{o.status}</Status></div></div>)}</div>:<Empty>Aucune commande récente.</Empty>}</section>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Projets récemment mis à jour</h2>{summary.recentProjects?.length?<TableWrap><thead><tr><Th>Projet</Th><Th>Client</Th><Th>Progression</Th><Th>Mis à jour</Th></tr></thead><tbody>{summary.recentProjects.map((p:any)=><tr key={p.project_id}><Td><div className="max-w-[300px] font-semibold">{p.subject}</div><div className="mt-1 text-xs text-slate-500">{p.domain||"Domaine non renseigné"}</div></Td><Td>{p.email||"—"}</Td><Td><Progress value={p.progress_percent}/></Td><Td>{fmtDate(p.updated_at||p.created_at)}</Td></tr>)}</tbody></TableWrap>:<Empty>Aucun projet trouvé.</Empty>}</section>
        </div>}

        {tab==="clients"&&<section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Comptes et droits d’accès</h2><p className="mt-1 text-xs text-slate-500">La suspension bloque l’authentification et l’accès aux opérations du compte.</p></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client…" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#1D78C1] sm:w-72"/></div>
          {filteredClients.length?<TableWrap><thead><tr><Th>Client</Th><Th>Inscription</Th><Th>Dernière connexion</Th><Th>Projets</Th><Th>Accès</Th><Th>Action</Th></tr></thead><tbody>{filteredClients.map(client=><tr key={client.id}><Td><div className="font-semibold">{client.email||"E-mail non renseigné"}</div><div className="mt-1 text-xs text-slate-500">{client.display_name||shortId(client.id)}</div></Td><Td>{fmtDate(client.created_at)}</Td><Td>{fmtDate(client.last_sign_in_at)}</Td><Td>{fmtNumber(client.project_count)}</Td><Td><Status tone={client.access==="suspended"?"red":"green"}>{client.access==="suspended"?"Suspendu":"Actif"}</Status></Td><Td><Button variant={client.access==="suspended"?"primary":"danger"} onClick={()=>void updateClient(client)}>{client.access==="suspended"?"Rétablir":"Suspendre"}</Button></Td></tr>)}</tbody></TableWrap>:<Empty>{loading?"Chargement des comptes…":"Aucun compte client ne correspond à la recherche."}</Empty>}
        </section>}

        {tab==="projects"&&<section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">{projects.length} projet(s) rattaché(s) à un compte ou retrouvé(s) dans l’état sauvegardé.</p><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sujet, client, domaine…" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-80"/></div>
          {filteredProjects.length?<TableWrap><thead><tr><Th>Sujet</Th><Th>Client</Th><Th>Niveau / type</Th><Th>État</Th><Th>Progression</Th><Th>Volume</Th><Th>Mise à jour</Th></tr></thead><tbody>{filteredProjects.map(p=><tr key={p.project_id}><Td><div className="max-w-[260px] font-semibold">{p.subject}</div><div className="mt-1 text-xs text-slate-500">{p.domain||"Domaine non renseigné"}</div></Td><Td>{p.email||"Compte non lié"}</Td><Td>{p.level||"—"}<div className="mt-1 text-xs text-slate-500">{p.document_type||"—"}</div></Td><Td><Status tone={p.status==="paid"?"green":p.status==="pending"?"amber":"neutral"}>{p.status||"draft"}</Status></Td><Td><Progress value={p.progress_percent}/><div className="mt-2 text-xs text-slate-500">{p.blocks_done}/{p.blocks_total} blocs</div></Td><Td>{fmtNumber(p.words_written)} mots</Td><Td>{fmtDate(p.updated_at||p.created_at)}</Td></tr>)}</tbody></TableWrap>:<Empty>{loading?"Chargement des projets…":"Aucun projet ne correspond à la recherche."}</Empty>}
        </section>}

        {tab==="orders"&&<section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{revenue.by_currency?.map((r:any)=><Card key={r.currency} title={"Revenu net • "+r.currency} value={fmtMoney(r.net,r.currency)} sub={fmtMoney(r.gross,r.currency)+" encaissés • "+fmtMoney(r.refunds,r.currency)+" remboursés"} icon={Wallet} tone="green"/> )}</div>
          {revenue.by_month?.length>0&&<section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Historique mensuel des revenus</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[580px] text-sm"><thead><tr><Th>Mois</Th><Th>Devise</Th><Th>Brut</Th><Th>Remboursements</Th><Th>Net</Th></tr></thead><tbody>{revenue.by_month.slice().reverse().map((r:any)=><tr key={r.month+r.currency}><Td>{r.month}</Td><Td>{r.currency}</Td><Td>{fmtMoney(r.gross,r.currency)}</Td><Td>{fmtMoney(r.refunds,r.currency)}</Td><Td className="font-semibold">{fmtMoney(r.net,r.currency)}</Td></tr>)}</tbody></table></div></section>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Registre des commandes</h2><p className="mt-1 text-xs text-slate-500">Les remboursements automatiques sont disponibles pour les commandes PayPal avec identifiant de capture.</p></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Référence, sujet, client…" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-80"/></div>
          {filteredOrders.length?<TableWrap><thead><tr><Th>Commande</Th><Th>Client / projet</Th><Th>Montant</Th><Th>Statut</Th><Th>Date paiement</Th><Th>Remboursement</Th><Th>Action</Th></tr></thead><tbody>{filteredOrders.map(o=><tr key={o.order_id}><Td><div className="font-semibold">{shortId(o.order_id)}</div><div className="mt-1 text-xs text-slate-500">{shortId(o.project_id)}</div></Td><Td><div className="max-w-[230px] font-semibold">{o.subject}</div><div className="mt-1 text-xs text-slate-500">{o.customer_email||"Client non identifié"}</div></Td><Td><div className="font-semibold">{fmtMoney(o.amount,o.currency)}</div><div className="mt-1 text-xs text-slate-500">{o.currency}</div></Td><Td><Status tone={o.status==="refunded"?"red":o.status==="pending"?"amber":"green"}>{o.status}</Status></Td><Td>{fmtDate(o.paid_at||o.created_at)}</Td><Td><Status tone={o.refund_status==="refunded"?"red":o.refund_status==="processing"?"amber":"neutral"}>{o.refund_status||"none"}</Status>{o.refund_id&&<div className="mt-1 text-xs text-slate-500">{shortId(o.refund_id)}</div>}</Td><Td>{o.refund_status==="refunded"||o.status==="refunded"?<span className="text-xs text-slate-400">Terminé</span>:((o.has_capture&&(o.status==="paid"||o.status==="consumed"||o.refund_status==="processing"))?<Button variant={o.refund_status==="processing"?"secondary":"danger"} onClick={()=>void doRefund(o)}>{o.refund_status==="processing"?"Vérifier":"Rembourser"}</Button>:<span className="text-xs text-slate-400">Indisponible</span>)}</Td></tr>)}</tbody></TableWrap>:<Empty>{loading?"Chargement des commandes…":"Aucune commande ne correspond à la recherche."}</Empty>}
        </section>}

        {tab==="pricing"&&settings&&<form onSubmit={saveSettings} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Grilles tarifaires</h2><p className="mt-1 text-sm text-slate-500">Les taux servent au calcul des devis. Les prix restent exprimés dans la devise définie pour chaque marché.</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">{Object.keys(settings.pricing_config.markets).map(market=><div key={market} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">{MARKET_LABELS[market]||market}</h3><select value={settings.pricing_config.markets[market].currency} onChange={e=>setSettings((s:any)=>({...s,pricing_config:{...s.pricing_config,markets:{...s.pricing_config.markets,[market]:{...s.pricing_config.markets[market],currency:e.target.value}}}}))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="XOF">XOF / FCFA</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="CAD">CAD</option></select></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{DOC_TYPES.map(([type,label])=><label key={type} className="text-xs font-medium text-slate-500">{label}<input type="number" min="0" step="0.01" required value={settings.pricing_config.markets[market].rates[type]} onChange={e=>updateRate(market,type,e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-semibold text-[#172554]"/></label>)}</div></div>)}</div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Quotas et limites</h2><p className="mt-1 text-sm text-slate-500">Ces paramètres sont vérifiés par le serveur. Les plafonds de sécurité restent actifs indépendamment de la valeur choisie.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[["maxProblematicGenerations","Générations de problématique / projet",1,10],["maxPlanGenerations","Générations de plan / projet",1,10],["freePreviewWords","Mots de l’aperçu gratuit",0,2500],["maxPages","Pages maximales par projet",1,300]].map(([key,label,min,max]:any)=><label key={key} className="text-xs font-semibold text-slate-500">{label}<input type="number" min={min} max={max} required value={settings.quotas[key]} onChange={e=>updateQuota(key,e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#172554]"/></label>)}
          </div><p className="mt-3 text-xs leading-5 text-slate-500">Le nombre de mots par page académique reste fixé à 320 dans les règles actuelles du moteur.</p></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Estimation des coûts OpenAI</h2><p className="mt-1 text-sm text-slate-500">Entrez les tarifs du modèle configuré, en USD par million de tokens. Laissez vide pour suivre les tokens sans estimer le coût.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-500">Entrée (USD / 1 M tokens)<input type="number" min="0" step="0.0001" value={settings.usage_costs.inputUsdPerMillion??""} onChange={e=>updateCost("inputUsdPerMillion",e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#172554]"/></label><label className="text-xs font-semibold text-slate-500">Sortie (USD / 1 M tokens)<input type="number" min="0" step="0.0001" value={settings.usage_costs.outputUsdPerMillion??""} onChange={e=>updateCost("outputUsdPerMillion",e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-[#172554]"/></label></div></section>
          <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={saving}>{saving?"Enregistrement…":"Enregistrer les tarifs et quotas"}</Button><span className="text-xs text-slate-500">Dernière mise à jour : {fmtDate(settings.updated_at)}</span></div>
        </form>}

        {tab==="usage"&&usage&&<div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title="Requêtes OpenAI" value={fmtNumber(usage.summary?.requests)} icon={Cpu}/><Card title="Tokens en entrée" value={fmtNumber(usage.summary?.input_tokens)} icon={FileText}/><Card title="Tokens en sortie" value={fmtNumber(usage.summary?.output_tokens)} icon={BarChart3} tone="gold"/><Card title="Coût estimé USD" value={usage.summary?.cost_coverage?fmtMoney(usage.summary.estimated_cost_usd,"USD"):"Non configuré"} sub={fmtNumber(usage.summary?.cost_coverage)+" appel(s) chiffré(s)"} icon={CircleDollarSign} tone="green"/></div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Usage par fonctionnalité</h2>{usage.by_endpoint?.length?<TableWrap><thead><tr><Th>API</Th><Th>Appels</Th><Th>Entrée</Th><Th>Sortie</Th><Th>Total tokens</Th><Th>Erreurs</Th><Th>Coût USD</Th></tr></thead><tbody>{usage.by_endpoint.map((r:any)=><tr key={r.endpoint}><Td className="font-semibold">{r.endpoint}</Td><Td>{fmtNumber(r.calls)}</Td><Td>{fmtNumber(r.input_tokens)}</Td><Td>{fmtNumber(r.output_tokens)}</Td><Td>{fmtNumber(r.total_tokens)}</Td><Td>{r.errors}</Td><Td>{r.priced_calls?fmtMoney(r.estimated_cost_usd,"USD"):"—"}</Td></tr>)}</tbody></TableWrap>:<Empty>Aucune consommation OpenAI n’est encore journalisée.</Empty>}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Dernières requêtes</h2>{usage.records?.length?<TableWrap><thead><tr><Th>Date</Th><Th>API / modèle</Th><Th>Entrée</Th><Th>Sortie</Th><Th>Statut</Th><Th>Durée</Th><Th>Coût estimé</Th></tr></thead><tbody>{usage.records.map((r:any)=><tr key={r.id}><Td>{fmtDate(r.created_at)}</Td><Td><div className="font-semibold">{r.endpoint}</div><div className="mt-1 text-xs text-slate-500">{r.model}</div></Td><Td>{fmtNumber(r.input_tokens)}</Td><Td>{fmtNumber(r.output_tokens)}</Td><Td><Status tone={r.status==="error"?"red":r.status==="incomplete"?"amber":"green"}>{r.status}</Status>{r.error_code&&<div className="mt-1 text-xs text-slate-500">{r.error_code}</div>}</Td><Td>{fmtNumber(r.duration_ms)} ms</Td><Td>{r.estimated_cost_usd==null?"—":fmtMoney(r.estimated_cost_usd,"USD")}</Td></tr>)}</tbody></TableWrap>:<Empty>Aucune requête enregistrée.</Empty>}</section>
        </div>}

        {tab==="revisions"&&<section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card title="En attente" value={revisions.filter(r=>r.status==="pending").length} icon={AlertTriangle} tone="gold"/>
            <Card title="En cours" value={revisions.filter(r=>r.status==="in_progress").length} icon={Activity} tone="blue"/>
            <Card title="Terminées" value={revisions.filter(r=>r.status==="completed").length} icon={CheckCircle2} tone="green"/>
          </div>
          {revisions.length?revisions.map(row=><article key={row.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs text-slate-500">Demande #{row.id} · {fmtDate(row.created_at)}</div><h2 className="mt-1 text-lg font-bold">{row.document_title}</h2><div className="mt-1 text-sm text-slate-500">{row.client_email} · Projet {shortId(row.project_id)}</div></div><Status tone={row.status==="completed"?"green":row.status==="in_progress"?"blue":"amber"}>{row.status==="completed"?"Terminée":row.status==="in_progress"?"En cours":"En attente"}</Status></div>
            <div className="rounded-xl bg-slate-50 p-4"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Consignes du client</div><p className="whitespace-pre-wrap text-sm leading-6">{row.instructions}</p></div>
            <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>void downloadRevisionFile(row,false)}><FileText size={15}/> Télécharger le document reçu</Button>{row.status==="completed"&&<Button variant="secondary" onClick={()=>void downloadRevisionFile(row,true)}>Télécharger le document livré</Button>}</div>
            <label className="block text-sm font-semibold">Notes internes<textarea value={revisionNotes[String(row.id)]??row.admin_notes??""} onChange={e=>setRevisionNotes(cur=>({...cur,[String(row.id)]:e.target.value}))} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label>
            {row.status!=="completed"&&<label className="block text-sm font-semibold">Document corrigé à livrer (PDF, Word, TXT ou RTF, 3 Mo max)<input type="file" accept=".pdf,.doc,.docx,.txt,.rtf" onChange={e=>setRevisionFiles(cur=>({...cur,[String(row.id)]:e.target.files?.[0]||null}))} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 font-normal"/></label>}
            <div className="flex flex-wrap gap-2">{row.status!=="in_progress"&&row.status!=="completed"&&<Button onClick={()=>void updateRevision(row,"in_progress")}>Prendre en charge</Button>}{row.status==="in_progress"&&<Button onClick={()=>void updateRevision(row,"pending")} variant="secondary">Remettre en attente</Button>}{row.status!=="completed"&&<Button variant="gold" onClick={()=>void updateRevision(row,"completed")}>Livrer et terminer</Button>}</div>
          </article>):<Empty>{loading?"Chargement des demandes…":"Aucune demande de révision humaine pour le moment."}</Empty>}
        </section>}

        {tab==="logs"&&<section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Journaux applicatifs centralisés</h2><p className="mt-1 text-xs text-slate-500">Erreurs, avertissements et opérations administrateur journalisés par le backend.</p></div><div className="flex gap-2"><select value={logSeverity} onChange={e=>setLogSeverity(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="all">Tous les niveaux</option><option value="critical">Critique</option><option value="error">Erreur</option><option value="warning">Avertissement</option><option value="info">Information</option><option value="debug">Debug</option></select><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher dans les journaux…" className="h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-sm sm:w-64"/></div></div>
          {filteredLogs.length?<TableWrap><thead><tr><Th>Date</Th><Th>Niveau</Th><Th>Catégorie / action</Th><Th>Message</Th><Th>Route</Th><Th>Code</Th><Th>Acteur</Th></tr></thead><tbody>{filteredLogs.map(row=><tr key={row.id}><Td>{fmtDate(row.created_at)}</Td><Td><Status tone={["critical","error"].includes(row.severity)?"red":row.severity==="warning"?"amber":"neutral"}>{row.severity}</Status></Td><Td><div className="font-semibold">{row.category}</div><div className="mt-1 text-xs text-slate-500">{row.action}</div></Td><Td className="max-w-[300px] break-words">{row.message}</Td><Td>{row.request_path||"—"}</Td><Td>{row.status_code||"—"}</Td><Td>{row.actor||"system"}</Td></tr>)}</tbody></TableWrap>:<Empty>{loading?"Chargement des journaux…":"Aucun journal ne correspond aux filtres."}</Empty>}
        </section>}

        <footer className="flex flex-col gap-2 border-t border-slate-200 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Trimémo • Console administrateur</span><span>Les revenus sont calculés à partir des commandes enregistrées, après remboursements connus et avant frais de paiement. Les paiements en attente ne sont pas comptabilisés comme encaissés.</span></footer>
      </main>
    </div>
  </div>;
}
