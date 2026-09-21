"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, Building2, CalendarDays, CheckCircle2, ChevronDown,
  Clock3, FileText, LayoutDashboard, MapPinned, Menu, Phone, Plus, Search, Settings,
  ShoppingBag, Target, UserPlus, Users, X, Bot, ListChecks, ArrowUpRight, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/client-api";

type AppMode = "demo" | "work";

type Page =
  | "dashboard" | "calendar" | "crm" | "sellers" | "locations" | "map"
  | "sales" | "hours" | "reports" | "ai" | "documents" | "settings";

type Seller = { id:number; name:string; area:string; shift:string; target:number; sales:number; status:"Työssä"|"Varattu"|"Työn alla"|"Poissa" };
type Location = { id:number; name:string; city:string; status:"Vapaa"|"Aktiivinen"|"Neuvottelu"|"Ongelma"; price:number; score:number; contact:string };
type Booking = { id:number; date:string; time:string; seller:string; location:string; status:"Vahvistettu"|"Odottaa"|"Ongelma" };

const NAV:{id:Page;label:string;icon:any}[]=[
  {id:"dashboard",label:"Dashboard",icon:LayoutDashboard},
  {id:"calendar",label:"Kalenteri",icon:CalendarDays},
  {id:"crm",label:"CRM / Buukkaus",icon:Phone},
  {id:"sellers",label:"Myyjät",icon:Users},
  {id:"locations",label:"Kauppapaikat",icon:Building2},
  {id:"map",label:"Kartta",icon:MapPinned},
  {id:"sales",label:"Myynti & tavoitteet",icon:ShoppingBag},
  {id:"hours",label:"Työajat",icon:Clock3},
  {id:"reports",label:"Raportit",icon:BarChart3},
  {id:"ai",label:"AI Action Center",icon:Bot},
  {id:"documents",label:"Dokumentit",icon:FileText},
  {id:"settings",label:"Asetukset",icon:Settings}
];

const initialSellers:Seller[]=[
 {id:1,name:"Matti Meikäläinen",area:"Jyväskylä",shift:"10:00–18:00",target:8,sales:6,status:"Työssä"},
 {id:2,name:"Laura Virtanen",area:"Tampere",shift:"09:00–17:00",target:8,sales:9,status:"Työssä"},
 {id:3,name:"Jussi Korhonen",area:"Helsinki",shift:"12:00–20:00",target:8,sales:5,status:"Työn alla"},
 {id:4,name:"Anna Laine",area:"Turku",shift:"10:00–18:00",target:8,sales:8,status:"Työssä"},
 {id:5,name:"Ville Niemi",area:"Oulu",shift:"10:00–18:00",target:7,sales:7,status:"Varattu"},
 {id:6,name:"Sanna Hämäläinen",area:"Lahti",shift:"11:00–19:00",target:8,sales:4,status:"Poissa"}
];

const initialLocations:Location[]=[
 {id:1,name:"Kauppakeskus Seppä",city:"Jyväskylä",status:"Vapaa",price:250,score:8.4,contact:"Maria Laakso"},
 {id:2,name:"Kauppakeskus Ratina",city:"Tampere",status:"Aktiivinen",price:320,score:9.1,contact:"Antti Salmi"},
 {id:3,name:"Kauppakeskus Sello",city:"Espoo",status:"Neuvottelu",price:350,score:7.8,contact:"Laura Mäkelä"},
 {id:4,name:"Kauppakeskus Skanssi",city:"Turku",status:"Vapaa",price:280,score:8.7,contact:"Jari Nieminen"},
 {id:5,name:"Ideapark",city:"Lempäälä",status:"Aktiivinen",price:300,score:8.9,contact:"Sami Ranta"},
 {id:6,name:"Valkea",city:"Oulu",status:"Ongelma",price:220,score:6.4,contact:"Kaisa Heikkinen"}
];

const initialBookings:Booking[]=[
 {id:1,date:"23.09.2026",time:"10:00–18:00",seller:"Laura Virtanen",location:"Ratina",status:"Vahvistettu"},
 {id:2,date:"23.09.2026",time:"12:00–20:00",seller:"Jussi Korhonen",location:"Seppä",status:"Vahvistettu"},
 {id:3,date:"24.09.2026",time:"10:00–18:00",seller:"Anna Laine",location:"Skanssi",status:"Odottaa"},
 {id:4,date:"24.09.2026",time:"09:00–17:00",seller:"Ville Niemi",location:"Ideapark",status:"Ongelma"}
];

const crmSeed=[
 {id:1,stage:"Soitettava",location:"Kauppakeskus Seppä",contact:"Maria Laakso",next:"Soita 23.9.",note:"Kysy lokakuun viikonlopuista"},
 {id:2,stage:"Neuvottelu",location:"Kauppakeskus Sello",contact:"Laura Mäkelä",next:"Lähetä hinnasto",note:"350 €/päivä alustavasti"},
 {id:3,stage:"Odottaa vastausta",location:"Valkea",contact:"Kaisa Heikkinen",next:"Seuraa 25.9.",note:"Tekninen lupa vielä avoin"},
 {id:4,stage:"Vahvistettu",location:"Ratina",contact:"Antti Salmi",next:"Sopimus 30.9.",note:"Lokakuun päivät alustavasti sovittu"}
];

export default function Page(){
 const [page,setPage]=useState<Page>("dashboard");
 const [mode,setMode]=useState<AppMode>("demo");
 const [drawer,setDrawer]=useState(false);
 const [search,setSearch]=useState("");
 const [modal,setModal]=useState<"booking"|"seller"|"location"|null>(null);
 const [toast,setToast]=useState("");
 const [sellers,setSellers]=useState<Seller[]>([]);
 const [locations,setLocations]=useState<Location[]>([]);
 const [bookings,setBookings]=useState<Booking[]>([]);
 const demoSellers=mode==="demo"?initialSellers:sellers;
 const demoLocations=mode==="demo"?initialLocations:locations;
 const demoBookings=mode==="demo"?initialBookings:bookings;

 useEffect(()=>{
  if(mode!=="work") return;
  let cancelled=false;
  Promise.all([api.sellers(),api.locations(),api.bookings()])
   .then(([sellerRes,locationRes,bookingRes])=>{
    if(cancelled) return;
    setSellers((sellerRes.data as any[]).map(s=>({id:s.id,name:s.name,area:s.area||"Ei määritetty",shift:"—",target:s.targetPerShift||0,sales:0,status:s.active?"Varattu":"Poissa"})));
    setLocations((locationRes.data as any[]).map(l=>({id:l.id,name:l.name,city:l.city,status:l.status==="ACTIVE"?"Aktiivinen":l.status==="NEGOTIATION"?"Neuvottelu":l.status==="PROBLEM"?"Ongelma":"Vapaa",price:l.pricePerDay?Number(l.pricePerDay):0,score:l.score?Number(l.score):0,contact:l.contacts?.[0]?.name||"Ei määritetty"})));
    setBookings((bookingRes.data as any[]).map(b=>({id:b.id,date:new Date(b.startsAt).toLocaleDateString("fi-FI"),time:new Date(b.startsAt).toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"})+"–"+new Date(b.endsAt).toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"}),seller:b.seller?.name||"Ei määritetty",location:b.location?.name||"Ei määritetty",status:b.status==="CONFIRMED"?"Vahvistettu":b.status==="PROBLEM"?"Ongelma":"Odottaa"})));
   })
   .catch(error=>notify("Työtilan tietoja ei voitu ladata: "+error.message));
  return()=>{cancelled=true};
 },[mode]);


 const title=NAV.find(x=>x.id===page)?.label??"Dashboard";
 const filteredSellers=useMemo(()=>demoSellers.filter(s=>`${s.name} ${s.area}`.toLowerCase().includes(search.toLowerCase())),[demoSellers,search]);
 const filteredLocations=useMemo(()=>demoLocations.filter(l=>`${l.name} ${l.city} ${l.contact}`.toLowerCase().includes(search.toLowerCase())),[demoLocations,search]);

 function switchMode(next:AppMode){
  setMode(next);
  setPage("dashboard");
  setSearch("");
  if(next==="demo"){
   setSellers([]);setLocations([]);setBookings([]);
   notify("Demo-tila käytössä: esimerkkidata ladattu");
  } else {
   setSellers([]);setLocations([]);setBookings([]);
   notify("Työtila käytössä: aloita omien tietojen syöttäminen");
  }
 }
 function notify(message:string){setToast(message);setTimeout(()=>setToast(""),2800);}

 function go(id:Page){setPage(id);setDrawer(false);window.scrollTo({top:0,behavior:"smooth"});}
 return <div className="min-h-screen bg-[#06101d]">
  {drawer&&<button aria-label="Sulje valikko" onClick={()=>setDrawer(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden"/>}
  <aside className={`fixed inset-y-0 left-0 z-50 w-[292px] border-r border-[#203451] bg-[#091625] p-4 transition-transform lg:translate-x-0 ${drawer?"translate-x-0":"-translate-x-full"}`}>
   <div className="mb-6 flex items-center justify-between px-2">
    <div><div className="text-xl font-black">AVAINPELAAJA</div><div className="text-xs text-slate-500">StandSales OS</div></div>
    <button onClick={()=>setDrawer(false)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden"><X size={20}/></button>
   </div>
   <nav className="space-y-1">
    {NAV.map(n=>{const I=n.icon;return <button key={n.id} onClick={()=>go(n.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${page===n.id?"bg-[#2f6df6] text-white shadow-lg":"text-slate-300 hover:bg-white/5 hover:text-white"}`}><I size={19}/><span>{n.label}</span>{n.id==="ai"&&<span className="ml-auto rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">AI</span>}</button>})}
   </nav>
   <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-[#203451] bg-white/[.03] p-4"><div className="text-xs text-slate-500">Organisaatio</div><div className="font-semibold">Avainpelaaja Oy</div><div className="mt-1 text-xs text-emerald-400">● Järjestelmä toimii</div></div>
  </aside>

  <main className="lg:pl-[292px]">
   <header className="sticky top-0 z-30 border-b border-[#203451] bg-[#06101d]/95 backdrop-blur">
    <div className="flex items-center gap-3 px-4 py-3">
     <button aria-label="Avaa päävalikko" aria-expanded={drawer} onClick={()=>setDrawer(v=>!v)} className="rounded-xl border border-[#203451] bg-[#0d1a2c] p-3 hover:bg-white/10"><Menu size={21}/></button>
     <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3 top-3.5 text-slate-500" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={mode==="demo"?"Hae demo-myytäjää, paikkaa tai kontaktia...":"Hae omista tiedoista..."} className="w-full rounded-xl border border-[#203451] bg-[#0d1a2c] py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"/></div>
     <div className="hidden rounded-xl border border-[#203451] bg-[#0d1a2c] p-1 sm:flex">
      <button onClick={()=>switchMode("demo")} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode==="demo"?"bg-violet-600 text-white":"text-slate-400"}`}>🎬 DEMO</button>
      <button onClick={()=>switchMode("work")} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode==="work"?"bg-emerald-600 text-white":"text-slate-400"}`}>🛠 TYÖ</button>
     </div>
     <button onClick={()=>mode==="work"&&setModal("booking")} className={`rounded-xl p-3 ${mode==="work"?"bg-[#2f6df6] hover:brightness-110":"bg-white/10 text-slate-400"}`} title={mode==="work"?"Uusi varaus":"Demo-tila"}><Plus size={21}/></button>
     <button onClick={()=>go("ai")} className="relative hidden rounded-xl border border-[#203451] bg-[#0d1a2c] p-3 sm:block" title="AI Action Center"><Bot size={20}/><span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px]">7</span></button>
     <button onClick={()=>go("settings")} className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 font-bold" title="Asetukset">T</button>
    </div>
   </header>

   <div className="mx-auto max-w-[1500px] p-4 md:p-7">
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
     <div><div className="mb-1 text-sm text-blue-400">Avainpelaaja OS / {mode==="demo"?"DEMO – esimerkkidata":"TYÖ – oma työtila"}</div><h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1><p className="mt-1 text-slate-400">Ständimyynnin kaikki tärkeät tiedot yhdessä paikassa.</p></div>
     <button onClick={()=>mode==="work"&&setModal("booking")} className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold ${mode==="work"?"bg-[#2f6df6]":"bg-violet-600"}`}>{mode==="work"?<><Plus size={18}/> Uusi varaus</>:<>🎬 Demo käynnissä</>}</button>
    </div>

    {page==="dashboard"&&<Dashboard go={go} open={setModal} sellers={demoSellers} bookings={demoBookings} mode={mode} notify={notify}/>}

    {page==="calendar"&&<Calendar bookings={demoBookings} open={setModal} notify={notify}/>}
    {page==="crm"&&<CRM notify={notify} mode={mode}/>}
    {page==="sellers"&&<Sellers data={filteredSellers} open={setModal}/>}
    {page==="locations"&&<Locations data={filteredLocations} open={setModal}/>}
    {page==="map"&&<MapView locations={demoLocations} go={go}/>}
    {page==="sales"&&<Sales sellers={demoSellers}/>}
    {page==="hours"&&<Hours sellers={demoSellers} mode={mode} notify={notify}/>} 
    {page==="reports"&&<Reports go={go}/>}
    {page==="ai"&&<AI go={go} notify={notify}/>}
    {page==="documents"&&<Documents notify={notify}/>}
    {page==="settings"&&<SettingsView notify={notify}/>}
   </div>
  </main>

  {modal&&<Modal type={modal} close={()=>setModal(null)} onSave={async(data)=>{try{if(mode==="work"){if(modal==="seller"){const res:any=await api.createSeller({name:data.name,area:data.area,targetPerShift:8});setSellers(v=>[...v,{id:res.data.id,name:res.data.name,area:res.data.area||"Ei määritetty",shift:"—",target:res.data.targetPerShift||0,sales:0,status:"Varattu"}]);}if(modal==="location"){const res:any=await api.createLocation({name:data.name,city:data.city,pricePerDay:Number(data.price)||0});setLocations(v=>[...v,{id:res.data.id,name:res.data.name,city:res.data.city,status:"Vapaa",price:Number(res.data.pricePerDay)||0,score:0,contact:"Ei määritetty"}]);}if(modal==="booking"){const parts=String(data.date||"").split(".");const isoDate=parts.length===3?parts[2]+"-"+parts[1]+"-"+parts[0]:data.date;const res:any=await api.createBooking({startsAt:isoDate+"T"+(data.start||"10:00")+":00",endsAt:isoDate+"T"+(data.end||"18:00")+":00",seller:data.seller,location:data.location});const b=res.data;setBookings(v=>[...v,{id:b.id,date:new Date(b.startsAt).toLocaleDateString("fi-FI"),time:new Date(b.startsAt).toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"})+"–"+new Date(b.endsAt).toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"}),seller:b.seller?.name||data.seller||"Ei määritetty",location:b.location?.name||data.location||"Ei määritetty",status:"Odottaa"}]);}}else{if(modal==="seller")setSellers(v=>[...v,{id:Date.now(),name:data.name||"Uusi myyjä",area:data.area||"Ei määritetty",shift:"10:00–18:00",target:8,sales:0,status:"Varattu"}]);if(modal==="location")setLocations(v=>[...v,{id:Date.now(),name:data.name||"Uusi kauppapaikka",city:data.city||"Ei määritetty",status:"Vapaa",price:Number(data.price)||0,score:0,contact:data.contact||"Ei määritetty"}]);if(modal==="booking")setBookings(v=>[...v,{id:Date.now(),date:data.date||"Ei päivä",time:(data.start||"--:--")+"–"+(data.end||"--:--"),seller:data.seller||"Ei määritetty",location:data.location||"Ei määritetty",status:"Odottaa"}]);}setModal(null);notify("Tallennettu onnistuneesti");}catch(error){notify(error instanceof Error?error.message:"Tallennus epäonnistui");}}/>}
  {toast&&<div className="fixed bottom-5 right-5 z-[120] rounded-xl border border-emerald-500/30 bg-[#0d201b] px-4 py-3 text-sm text-emerald-300 shadow-2xl">✓ {toast}</div>}
 </div>
}

function Dashboard({go,open,sellers,bookings,mode,notify}:{go:(p:Page)=>void;open:any;sellers:Seller[];bookings:Booking[];mode:AppMode;notify:(x:string)=>void}){
 const [summary,setSummary]=useState<any>(null);
 useEffect(()=>{if(mode!=="work"){setSummary(null);return;} api.dashboardSummary().then(r=>setSummary(r.data)).catch(()=>setSummary(null));},[mode]);
 const totalSales=mode==="work"&&summary?summary.sales:sellers.reduce((a,s)=>a+s.sales,0);
 const sellerCount=mode==="work"&&summary?summary.sellers:sellers.length;
 const activeCount=mode==="work"&&summary?summary.activeSellers:sellers.filter(s=>s.status==="Työssä").length;
 const bookingCount=mode==="work"&&summary?summary.bookings:bookings.length;
 const openCrm=mode==="work"&&summary?summary.openCrm:0;
 return <div className="space-y-6">
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
   <Kpi icon="👥" label="Myyjiä yhteensä" value={mode==="demo"?"40":String(sellerCount)} sub={mode==="demo"?"aktiiviset myyjät":String(summary?.activeSellers??activeCount)+" aktiivista"} onClick={()=>go("sellers")}/>
   <Kpi icon="🟢" label="Työssä" value={mode==="demo"?String(sellers.filter(s=>s.status==="Työssä").length):String(activeCount)} sub="aktiiviset myyjät" onClick={()=>go("hours")}/>
   <Kpi icon="🔵" label="Varaukset" value={String(bookingCount)} sub={mode==="demo"?"vahvistettua / aktiivista":String(summary?.confirmedBookings??0)+" vahvistettua"} onClick={()=>go("calendar")}/>
   <Kpi icon="📱" label="Kaupat" value={mode==="demo"?String(totalSales+160):String(totalSales)} sub="nykyinen raportointijakso" onClick={()=>go("sales")} trend={mode==="demo"?"↑ 12 %":undefined}/>
   <Kpi icon="⚠️" label="Avoimet CRM:t" value={mode==="demo"?"7":String(openCrm)} sub={mode==="demo"?"2 kiireellistä":"seurattavat kohteet"} onClick={()=>go("crm")}/>
  </div>
  <div className="grid gap-5 xl:grid-cols-3">
   <section className="xl:col-span-2 panel p-5"><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Tämän päivän työvuorot</h2><button onClick={()=>go("calendar")} className="text-sm text-blue-400">Avaa kalenteri →</button></div><div className="space-y-2">{sellers.length===0?<EmptyState text={mode==="work"?"Ei vielä myyjiä. Lisää ensimmäinen myyjä työtilassa.":"Ei demo-myöjiä."}/>:sellers.slice(0,5).map(s=><div key={s.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-[#203451] bg-white/[.02] p-3"><div><b>{s.name}</b><div className="text-xs text-slate-500">{s.area} · {s.shift}</div></div><div className="text-sm">{statusBadge(s.status)}</div><div className="text-right"><b>{s.sales}</b><div className="text-xs text-slate-500">/ {s.target} kauppaa</div></div></div>)}</div></section>
   <section className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5"><div className="mb-4 flex items-center gap-2 text-violet-200"><Bot size={19}/><h2 className="font-bold">AI Action Center</h2></div><div className="space-y-3">{(mode==="demo"?["2 kiireellistä CRM-tehtävää","Jyväskylässä 2 täyttämätöntä tarvetta","1 sopimus päättyy 7 päivän sisällä"]:[openCrm+" avointa CRM-toimenpidettä","Dashboardin luvut tulevat PostgreSQL-datasta","AI-ehdotukset rakennetaan hyväksyttäväksi ennen muutoksia"]).map(x=><div key={x} className="rounded-xl border border-violet-500/20 p-3 text-sm">🟣 {x}</div>)}</div><button onClick={()=>go("ai")} className="mt-5 w-full rounded-xl border border-violet-500/30 py-3 text-violet-200">Avaa AI-keskus</button></section>
  </div>
  <section className="panel p-5"><h2 className="section-title mb-4">Nopeat toiminnot</h2><div className="grid gap-3 sm:grid-cols-3"><Quick icon={<Plus/>} text="Uusi varaus" onClick={()=>open("booking")}/><Quick icon={<UserPlus/>} text="Uusi myyjä" onClick={()=>open("seller")}/><Quick icon={<Building2/>} text="Uusi kauppapaikka" onClick={()=>open("location")}/></div></section>
 </div>
}
function Calendar({bookings,open,notify}:{bookings:Booking[];open:any;notify:(x:string)=>void}){
 return <div className="space-y-5"><div className="flex flex-wrap gap-2"><button onClick={()=>open("booking")} className="btn-primary"><Plus size={17}/> Uusi varaus</button><button onClick={()=>notify("Viikkonäkymä valittu")} className="btn-secondary">Viikko</button><button onClick={()=>notify("Päivänäkymä valittu")} className="btn-secondary">Päivä</button><button onClick={()=>notify("Kuukausinäkymä valittu")} className="btn-secondary">Kuukausi</button></div><div className="grid gap-3 md:grid-cols-7">{["Ma 21.9.","Ti 22.9.","Ke 23.9.","To 24.9.","Pe 25.9.","La 26.9.","Su 27.9."].map((d,i)=><div key={d} className="min-h-52 rounded-2xl border border-[#203451] bg-[#0d1a2c] p-3"><div className="mb-3 font-semibold">{d}</div><div className="space-y-2">{bookings.slice(i%2,i%2+2).map(b=><button onClick={()=>notify(`Varaus: ${b.seller} / ${b.location}`)} key={b.id} className={`w-full rounded-xl border p-2 text-left text-xs ${b.status==="Ongelma"?"border-red-500/30 bg-red-500/10":b.status==="Odottaa"?"border-yellow-500/30 bg-yellow-500/10":"border-blue-500/30 bg-blue-500/10"}`}><b>{b.time}</b><br/>{b.seller}<br/><span className="text-slate-400">{b.location}</span></button>)}</div></div>)}</div></div>
}

function CRM({notify,mode}:{notify:(x:string)=>void;mode:AppMode}){
 const stageDefs=[
  ["NEW","Uusi"],["CALL","Soitettava"],["NEGOTIATION","Neuvottelu"],["OFFER_SENT","Tarjous"],
  ["WAITING","Odottaa vastausta"],["AGREED","Vahvistettu"]
 ] as const;
 const [items,setItems]=useState<any[]>([]);
 const [loading,setLoading]=useState(false);
 const [newOpen,setNewOpen]=useState(false);
 const [activityOpen,setActivityOpen]=useState<string|null>(null);
 const [form,setForm]=useState({name:"",city:"",nextAction:"Soita",stage:"NEW",notes:""});
 const [activity,setActivity]=useState({type:"CALL",subject:"Puhelu",notes:""});
 const load=async()=>{
  if(mode==="demo"){setItems([]);return;}
  setLoading(true);
  try{const res:any=await api.crmOpportunities();setItems(res.data||[]);}
  catch(error){notify(error instanceof Error?error.message:"CRM-tietoja ei voitu ladata");}
  finally{setLoading(false);}
 };
 useEffect(()=>{load();},[mode]);
 const create=async()=>{
  try{
   if(!form.name.trim()||!form.nextAction.trim()){notify("Nimi ja seuraava toimenpide ovat pakollisia");return;}
   const res:any=await api.createCrmOpportunity(form);
   setItems(v=>[res.data,...v]);setNewOpen(false);
   setForm({name:"",city:"",nextAction:"Soita",stage:"NEW",notes:""});
   notify("CRM-kohde tallennettu");
  }catch(error){notify(error instanceof Error?error.message:"CRM-kohteen tallennus epäonnistui");}
 };
 const move=async(id:string,stage:string)=>{
  try{const res:any=await api.updateCrmOpportunity(id,{stage});setItems(v=>v.map(x=>x.id===id?res.data:x));notify("CRM-vaihe päivitetty");}
  catch(error){notify(error instanceof Error?error.message:"Vaiheen päivitys epäonnistui");}
 };
 const addActivity=async(id:string,stage:string)=>{
  try{
   if(!activity.subject.trim()){notify("Aktiviteetin aihe puuttuu");return;}
   await api.createCrmActivity({opportunityId:id,stage,type:activity.type,subject:activity.subject,notes:activity.notes});
   setActivityOpen(null);setActivity({type:"CALL",subject:"Puhelu",notes:""});notify("CRM-aktiviteetti tallennettu");
  }catch(error){notify(error instanceof Error?error.message:"Aktiviteetin tallennus epäonnistui");}
 };
 const demoCards=crmSeed.map(x=>({id:String(x.id),name:x.location,contact:x.contact,nextAction:x.next,notes:x.note,stage:stageDefs.find(s=>s[1]===x.stage)?.[0]||"NEW"}));
 const cards=mode==="demo"?demoCards:items;
 return <div className="space-y-4">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
   <div className="text-sm text-slate-400">{mode==="demo"?"Demo näyttää CRM-putken rakenteen.":"Työtilan CRM tallentuu PostgreSQL-tietokantaan API:n kautta."}</div>
   {mode==="work"&&<button onClick={()=>setNewOpen(v=>!v)} className="btn-primary"><Plus size={17}/> Uusi CRM-kohde</button>}
  </div>
  {mode==="work"&&loading?<EmptyState text="Ladataan CRM-tietoja..."/>:
   <div className="grid gap-3 overflow-x-auto xl:grid-cols-6">{stageDefs.map(([stage,label])=><div key={stage} className="min-w-[245px] rounded-2xl border border-[#203451] bg-[#0d1a2c] p-3">
    <div className="mb-3 flex items-center justify-between"><div className="font-bold text-sm">{label}</div><span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{cards.filter(x=>x.stage===stage).length}</span></div>
    <div className="space-y-2">{cards.filter(x=>x.stage===stage).map(x=><div key={x.id} className="rounded-xl border border-[#203451] bg-white/[.02] p-3 text-sm">
     <b>{x.name}</b><div className="text-xs text-slate-500">{x.city||x.contact||"Ei lisätietoa"}</div>
     <div className="mt-2 text-xs text-blue-300">→ {x.nextAction}</div>
     {x.notes&&<p className="mt-2 text-xs text-slate-400">{x.notes}</p>}
     {mode==="work"&&<div className="mt-3 flex flex-wrap gap-2">
      <button onClick={()=>setActivityOpen(activityOpen===x.id?null:x.id)} className="rounded-lg border border-[#304968] px-2 py-1 text-xs">📞 Aktiviteetti</button>
      {stage!=="AGREED"&&<button onClick={()=>move(x.id,stageDefs[Math.min(stageDefs.findIndex(s=>s[0]===stage)+1,stageDefs.length-1)][0])} className="rounded-lg bg-blue-600/20 px-2 py-1 text-xs text-blue-200">Seuraava →</button>}
     </div>}
     {activityOpen===x.id&&<div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-950/10 p-3">
      <select value={activity.type} onChange={e=>setActivity({...activity,type:e.target.value})} className="w-full rounded-lg border border-[#304968] bg-[#0d1a2c] p-2 text-xs"><option value="CALL">Puhelu</option><option value="EMAIL">Sähköposti</option><option value="NOTE">Muistiinpano</option><option value="MEETING">Tapaaminen</option><option value="OFFER">Tarjous</option></select>
      <input value={activity.subject} onChange={e=>setActivity({...activity,subject:e.target.value})} className="mt-2 w-full rounded-lg border border-[#304968] bg-[#0d1a2c] p-2 text-xs" placeholder="Aihe"/>
      <textarea value={activity.notes} onChange={e=>setActivity({...activity,notes:e.target.value})} className="mt-2 w-full rounded-lg border border-[#304968] bg-[#0d1a2c] p-2 text-xs" placeholder="Muistiinpanot"/>
      <button onClick={()=>addActivity(x.id,stage)} className="btn-primary mt-2 w-full justify-center">Tallenna aktiviteetti</button>
     </div>}
    </div>)}</div>
   </div>)}</div>
  {mode==="work"&&newOpen&&<div className="panel p-4">
   <div className="mb-3 font-bold">Uusi CRM-kohde</div>
   <div className="grid gap-3 md:grid-cols-2">
    <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Kauppapaikka / yritys" className="input"/>
    <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Kaupunki" className="input"/>
    <select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})} className="input">{stageDefs.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
    <input value={form.nextAction} onChange={e=>setForm({...form,nextAction:e.target.value})} placeholder="Seuraava toimenpide" className="input"/>
    <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Muistiinpanot" className="input md:col-span-2"/>
   </div>
   <div className="mt-3 flex gap-2"><button onClick={create} className="btn-primary">Tallenna CRM</button><button onClick={()=>setNewOpen(false)} className="btn-secondary">Peruuta</button></div>
  </div>}
 </div>;
}
function Sellers({data,open}:{data:Seller[];open:any}){return <Module title="Myyjät" desc="Myyjät, tiimit, työvuorot, työajat ja tulokset." action={<button onClick={()=>open("seller")} className="btn-primary"><Plus size={17}/> Uusi myyjä</button>}><Table headers={["Myyjä","Alue","Vuoro","Tavoite","Kaupat","Status"]} rows={data.map(s=>[s.name,s.area,s.shift,String(s.target),String(s.sales),statusBadge(s.status)])}/></Module>}
function Locations({data,open}:{data:Location[];open:any}){return <Module title="Kauppapaikat" desc="Kauppapaikkarekisteri, hinnat, kontaktit, sopimukset ja historia." action={<button onClick={()=>open("location")} className="btn-primary"><Plus size={17}/> Uusi kauppapaikka</button>}><Table headers={["Kauppapaikka","Kaupunki","Status","Hinta/pv","Hist. profiili","Yhteyshenkilö"]} rows={data.map(l=>[l.name,l.city,statusBadge(l.status),l.price+" €",l.score?l.score.toFixed(1):"—",l.contact])}/></Module>}
function MapView({locations,go}:{locations:Location[];go:(p:Page)=>void}){return <Module title="Kartta" desc="Suomen ständipaikat ja niiden operatiivinen tila."><div className="relative h-[540px] overflow-hidden rounded-2xl border border-[#203451] bg-[#10243a]"><div className="absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(#8aa4c4 1px,transparent 1px),linear-gradient(90deg,#8aa4c4 1px,transparent 1px)",backgroundSize:"44px 44px"}}/><div className="absolute left-[42%] top-[42%] h-[180px] w-[100px] rounded-[50%] border-2 border-slate-400/30 rotate-12"/>{locations.map((l,i)=><button key={l.id} onClick={()=>go("locations")} className={`absolute rounded-full px-3 py-2 text-xs font-bold text-black shadow-lg ${l.status==="Vapaa"?"bg-emerald-400":l.status==="Aktiivinen"?"bg-blue-400":l.status==="Neuvottelu"?"bg-yellow-300":"bg-red-400"}`} style={{left:`${12+(i*13)%72}%`,top:`${18+(i*17)%60}%`}}>{l.status==="Vapaa"?"🟢":l.status==="Aktiivinen"?"🔵":l.status==="Neuvottelu"?"🟡":"🔴"} {l.city}</button>)}<div className="absolute bottom-4 left-4 rounded-xl border border-[#203451] bg-[#07111f]/95 p-3 text-xs">🟢 Vapaa · 🔵 Aktiivinen · 🟡 Neuvottelu · 🔴 Ongelma</div></div></Module>}
function Sales({sellers,mode,notify}:{sellers:Seller[];mode:AppMode;notify:(x:string)=>void}){
 const [sales,setSales]=useState<any[]>([]);
 const [loading,setLoading]=useState(false);
 const [sellerId,setSellerId]=useState("");
 const [quantity,setQuantity]=useState("1");
 const [locationName,setLocationName]=useState("");
 const load=async()=>{
  if(mode==="demo"){setSales([]);return;}
  setLoading(true);
  try{const r=await api.sales();setSales(r.data||[]);}
  catch(e){notify(e instanceof Error?e.message:"Myyntitietoja ei voitu ladata");}
  finally{setLoading(false);}
 };
 useEffect(()=>{load();},[mode]);
 const total=mode==="demo"?sellers.reduce((a,s)=>a+s.sales,0)+160:sales.reduce((a,s)=>a+Number(s.quantity||0),0);
 const target=mode==="demo"?sellers.reduce((a,s)=>a+s.target,0)+190:sellers.reduce((a,s)=>a+s.target,0);
 const addSale=async()=>{
  if(mode!=="work") return;
  if(!sellerId){notify("Valitse myyjä");return;}
  try{
   await api.createSale({sellerId,quantity:Number(quantity),locationName});
   setQuantity("1");setLocationName("");await load();notify("Myynti tallennettu");
  }catch(e){notify(e instanceof Error?e.message:"Myynnin tallennus epäonnistui");}
 };
 const sellerTotals=sellers.map(s=>({...s,sales:mode==="demo"?s.sales:(sales.filter(x=>String(x.sellerId)===String(s.id)).reduce((a,x)=>a+Number(x.quantity||0),0))}));
 return <Module title="Myynti & tavoitteet" desc={mode==="demo"?"Demo näyttää myyntinäkymän rakenteen.":"Myynnit tallennetaan PostgreSQL-tietokantaan ja audit-logiin."}>
  {mode==="work"&&<div className="mb-5 panel p-4">
   <div className="mb-3 font-bold">➕ Kirjaa myynti</div>
   <div className="grid gap-3 md:grid-cols-4">
    <select value={sellerId} onChange={e=>setSellerId(e.target.value)} className="input"><option value="">Valitse myyjä</option>{sellers.map(s=><option key={s.id} value={String(s.id)}>{s.name}</option>)}</select>
    <input type="number" min="1" max="100" value={quantity} onChange={e=>setQuantity(e.target.value)} className="input" placeholder="Kauppojen määrä"/>
    <input value={locationName} onChange={e=>setLocationName(e.target.value)} className="input" placeholder="Kauppapaikka (valinnainen)"/>
    <button onClick={addSale} disabled={loading} className="btn-primary justify-center">{loading?"Tallennetaan...":"Tallenna myynti"}</button>
   </div>
  </div>}
  <div className="grid gap-4 md:grid-cols-3"><Stat label="Kaupat" value={String(total)}/><Stat label="Tavoite" value={String(target)}/><Stat label="Toteuma" value={target>0?((total/target)*100).toFixed(1).replace(".",",")+" %":"—"}/></div>
  <div className="mt-5 panel p-5"><h3 className="font-bold">Myyjät suhteessa tavoitteeseen</h3><div className="mt-4 space-y-3">{sellerTotals.length===0?<EmptyState text="Ei vielä myyjiä."/>:sellerTotals.map(s=><div key={s.id}><div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><span>{s.sales}/{s.target}</span></div><div className="h-2 rounded-full bg-slate-800"><div className={`h-2 rounded-full ${s.sales>=s.target?"bg-emerald-500":"bg-blue-500"}`} style={{width:`${s.target>0?Math.min(100,s.sales/s.target*100):0}%`}}/></div></div>)}</div></div>
  {mode==="work"&&sales.length>0&&<div className="mt-5"><Table headers={["Myyjä","Määrä","Kauppapaikka","Aika"]} rows={sales.slice(0,20).map(s=>[s.seller?.name||sellers.find(x=>String(x.id)===String(s.sellerId))?.name||"Myyjä",String(s.quantity),s.locationName||"—",new Date(s.soldAt).toLocaleString("fi-FI")])}/></div>}
 </Module>;
}
function Hours({sellers,mode,notify}:{sellers:Seller[];mode:AppMode;notify:(x:string)=>void}){
 const [entries,setEntries]=useState<any[]>([]);
 const [loading,setLoading]=useState(false);
 const load=async()=>{if(mode==="demo"){setEntries([]);return;}setLoading(true);try{const r=await api.timeEntries();setEntries(r.data);}catch(e){notify(e instanceof Error?e.message:"Työaikoja ei voitu ladata");}finally{setLoading(false);}};
 useEffect(()=>{load();},[mode]);
 const active=entries.find(e=>!e.endedAt);
 const start=async(sellerId:string)=>{try{await api.startShift(sellerId);await load();notify("Vuoro aloitettu");}catch(e){notify(e instanceof Error?e.message:"Vuoron aloitus epäonnistui");}};
 const end=async()=>{if(!active)return;try{await api.endShift(active.id);await load();notify("Vuoro lopetettu");}catch(e){notify(e instanceof Error?e.message:"Vuoron lopetus epäonnistui");}};
 if(mode==="work") return <Module title="Työajat" desc="Oikeat aloitukset ja lopetukset tallennetaan PostgreSQL-tietokantaan." action={active?<button onClick={end} className="btn-secondary">⏹ Lopeta aktiivinen vuoro</button>:sellers[0]?<button onClick={()=>start(String(sellers[0].id))} className="btn-primary">▶ Aloita vuoro: {sellers[0].name}</button>:undefined}><div className="mb-4 text-sm text-slate-400">{loading?"Ladataan...":active?"🟢 Aktiivinen vuoro":"⚪ Ei aktiivista vuoroa"}</div><Table headers={["Myyjä","Aloitus","Lopetus","Tauko","Tila"]} rows={entries.map(e=>[sellers.find(s=>String(s.id)===String(e.sellerId))?.name||"Myyjä",new Date(e.startedAt).toLocaleString("fi-FI"),e.endedAt?new Date(e.endedAt).toLocaleString("fi-FI"):"—",String(e.breakMin)+" min",e.endedAt?"Päättynyt":"🟢 Käynnissä"])}/></Module>;
 return <Module title="Työajat" desc="Vuorot, aloitukset, tauot, lopetukset ja poikkeamat."><Table headers={["Myyjä","Vuoro","Aloitus","Lopetus","Tunnit","Tila"]} rows={sellers.map(s=>[s.name,s.shift,"09:58","18:02","8,1 h",statusBadge(s.status)])}/></Module>;
}
function Reports({go}:{go:(p:Page)=>void}){return <Module title="Raportit" desc="Myyjä-, paikka-, alue-, kampanja- ja työaikaraportit."><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{["Myyjäraportti","Kauppapaikat","Kampanjat","Työajat"].map(x=><button key={x} onClick={()=>go(x==="Myyjäraportti"?"sellers":x==="Kauppapaikat"?"locations":"reports")} className="panel p-5 text-left hover:border-blue-500"><BarChart3 className="mb-3 text-blue-400"/><b>{x}</b><div className="mt-1 text-xs text-slate-500">Avaa raportti →</div></button>)}</div></Module>}
function AI({go,notify}:{go:(p:Page)=>void;notify:(x:string)=>void}){const actions=["Vahvista 2 ensi viikon ständipaikkaa","Soita 3 vastausta odottavalle kontaktille","Täytä Jyväskylän 2 puuttuvaa ständitarvetta","Tarkista 1 päättyvä sopimus"];return <Module title="AI Action Center" desc="AI-avustus ehdottaa toimenpiteitä järjestelmän datan perusteella. Muutokset hyväksyy käyttäjä."><div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5"><div className="flex items-center gap-2 text-violet-200"><Bot/><b>Mitä minun pitää hoitaa tänään?</b></div><div className="mt-5 space-y-3">{actions.map(x=><button key={x} onClick={()=>notify("Tehtävä merkitty käsittelyyn")} className="flex w-full items-center gap-3 rounded-xl border border-[#203451] bg-[#0d1a2c] p-4 text-left hover:border-violet-500/50">🟣 <span>{x}</span><ArrowUpRight className="ml-auto" size={17}/></button>)}</div></div></Module>}
function Documents({notify}:{notify:(x:string)=>void}){return <Module title="Dokumentit" desc="Sopimukset, hinnastot, pohjapiirrokset, kuvat ja ohjeet."><div className="panel p-8 text-center"><FileText className="mx-auto mb-3 text-blue-400" size={38}/><h3 className="font-bold">Dokumenttikirjasto</h3><p className="mt-1 text-sm text-slate-500">Tuotannossa tähän liitetään objektitallennus ja käyttöoikeudet.</p><button onClick={()=>notify("Latausikkuna avataan tuotantoversion storage-integraatiolla")} className="btn-primary mt-5"><Plus size={17}/> Lisää dokumentti</button></div></Module>}
function SettingsView({notify}:{notify:(x:string)=>void}){return <Module title="Asetukset" desc="Organisaatio, käyttäjät, roolit, ilmoitukset ja järjestelmäasetukset."><div className="grid gap-4 md:grid-cols-2"><Setting title="Organisaatio" text="Avainpelaaja Oy" /><Setting title="Käyttäjät & roolit" text="Admin · Buukkaaja · Esihenkilö · Myyjä · Raportointi" /><Setting title="Ilmoitukset" text="Sähköposti · sovellus · kriittiset hälytykset" /><Setting title="Turvallisuus" text="RBAC · audit log · 2FA tuotantovaiheessa" /></div><button onClick={()=>notify("Asetukset tallennettu")} className="btn-primary mt-5">Tallenna asetukset</button></Module>}

function Modal({type,close,onSave}:{type:"booking"|"seller"|"location";close:()=>void;onSave:(d:any)=>void}){
 const [data,setData]=useState<any>({});
 const title=type==="booking"?"Uusi varaus":type==="seller"?"Uusi myyjä":"Uusi kauppapaikka";
 const field=(key:string,label:string,placeholder?:string)=><label className="text-sm text-slate-400">{label}<input value={data[key]||""} onChange={e=>setData({...data,[key]:e.target.value})} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-[#203451] bg-[#0d1a2c] p-3 text-white outline-none focus:border-blue-500"/></label>;
 return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="w-full max-w-xl rounded-2xl border border-[#203451] bg-[#0b1829] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={close} className="rounded-lg p-2 hover:bg-white/10"><X/></button></div><div className="grid gap-4 md:grid-cols-2">{type==="booking"?<>{field("seller","Myyjä","Matti Meikäläinen")}{field("location","Kauppapaikka","Kauppakeskus")}{field("date","Päivämäärä","23.09.2026")}{field("start","Alkuaika","10:00")}{field("end","Loppuaika","18:00")}</>:type==="seller"?<>{field("name","Nimi")}{field("area","Alue")}</>:<>{field("name","Kauppapaikan nimi")}{field("city","Kaupunki")}{field("price","Hinta / päivä")}{field("contact","Yhteyshenkilö")}</>}</div><div className="mt-6 flex justify-end gap-2"><button onClick={close} className="btn-secondary">Peruuta</button><button onClick={()=>onSave(data)} className="btn-primary">Tallenna</button></div></div></div>
}

function EmptyState({text}:{text:string}){return <div className="rounded-xl border border-dashed border-[#304968] p-8 text-center text-sm text-slate-500">📭 {text}</div>}\n\nfunction Module({title,desc,action,children}:{title:string;desc:string;action?:React.ReactNode;children:React.ReactNode}){return <section><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="text-2xl font-bold">{title}</h2><p className="text-sm text-slate-500">{desc}</p></div>{action}</div>{children}</section>}
function Table({headers,rows}:{headers:string[];rows:(string|React.ReactNode)[][]}){return <div className="panel overflow-hidden"><div className="scrollbar overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b border-[#203451] text-left text-slate-500">{headers.map(h=><th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-b border-[#203451]/60 hover:bg-white/[.025]">{r.map((c,j)=><td key={j} className="px-4 py-3">{j===0&&typeof c==="string"?<b>{c}</b>:c}</td>)}</tr>)}</tbody></table></div></div>}
function Kpi({icon,label,value,sub,onClick,trend}:{icon:string;label:string;value:string;sub:string;onClick:()=>void;trend?:string}){return <button onClick={onClick} className="panel p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-500/50"><div className="text-xl">{icon}</div><div className="mt-2 text-sm text-slate-400">{label}</div><div className="mt-1 flex items-end gap-3"><div className="text-4xl font-black">{value}</div>{trend&&<span className="pb-1 text-sm text-emerald-400">{trend}</span>}</div><div className="mt-1 text-xs text-slate-500">{sub}</div></button>}
function Quick({icon,text,onClick}:{icon:React.ReactNode;text:string;onClick:()=>void}){return <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-[#203451] p-4 text-left font-semibold hover:border-blue-500">{icon}{text}</button>}
function Stat({label,value}:{label:string;value:string}){return <div className="panel p-5"><div className="text-sm text-slate-400">{label}</div><div className="mt-2 text-4xl font-black">{value}</div></div>}
function Setting({title,text}:{title:string;text:string}){return <div className="panel p-5"><b>{title}</b><p className="mt-2 text-sm text-slate-400">{text}</p></div>}
function statusBadge(status:string){const map:any={Työssä:"🟢",Varattu:"🔵","Työn alla":"🟡",Poissa:"⚪",Vapaa:"🟢",Aktiivinen:"🔵",Neuvottelu:"🟡",Ongelma:"🔴",Vahvistettu:"🟢",Odottaa:"🟡"};return <span>{map[status]||"⚪"} {status}</span>}
