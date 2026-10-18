import {useState} from 'react';import {NavLink,Outlet} from 'react-router-dom';import {LayoutDashboard,Zap,ToggleRight,BarChart3,Bell,Settings,Menu,X,Factory,Wifi,WifiOff} from 'lucide-react';
import {useMonitor} from '../hooks/useMonitor';import {Badge} from '../components/ui';import {tm} from '../utils/format';
const nav=[['/','Dashboard',LayoutDashboard],['/energi','Monitoring Energi',Zap],['/kontrol','Kontrol Beban',ToggleRight],['/analitik','Riwayat & Analitik',BarChart3],['/peringatan','Peringatan',Bell],['/pengaturan','Pengaturan',Settings]];
export default function Layout(){const[open,setOpen]=useState(false);const{conn,latest,alerts,simulated,loading}=useMonitor();const act=alerts.filter(a=>a.status==='Aktif').length;
return<div className="min-h-screen flex">
{open&&<div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={()=>setOpen(false)}/>}
<aside className={`fixed lg:sticky top-0 h-screen w-64 bg-navy-800 text-slate-300 z-40 flex flex-col transition-transform ${open?'':'-translate-x-full'} lg:translate-x-0`}>
<div className="flex items-center gap-2 px-5 h-16 border-b border-white/10"><div className="bg-amber-400 text-navy-900 p-1.5 rounded"><Factory size={20}/></div><div className="leading-tight"><div className="font-bold text-white">CNC Energy Monitor</div><div className="text-[11px] text-slate-400">Industrial IoT</div></div><button className="lg:hidden ml-auto" onClick={()=>setOpen(false)}><X size={20}/></button></div>
<nav className="p-3 space-y-1 flex-1">{nav.map(([to,l,I])=><NavLink key={to} to={to} end={to==='/'} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${isActive?'bg-amber-400 text-navy-900 font-semibold':'hover:bg-white/10'}`}><I size={18}/>{l}{to==='/peringatan'&&act>0&&<span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5">{act}</span>}</NavLink>)}</nav>
<div className="p-4 text-[11px] text-slate-500 border-t border-white/10">Tugas Akhir - Frontend v0.1</div></aside>
<div className="flex-1 min-w-0 flex flex-col">
<header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 px-4 flex items-center gap-3"><button className="lg:hidden" onClick={()=>setOpen(true)}><Menu size={22}/></button><div className="flex-1"/>
{simulated&&<Badge tone="amber">Mode simulasi</Badge>}{conn.online?<Badge tone="green"><Wifi size={12}/>ESP32 online</Badge>:<Badge tone="red"><WifiOff size={12}/>ESP32 offline</Badge>}
<span className="hidden sm:block text-xs text-slate-500">Data terakhir: {loading?'...':tm(latest?.ts)}</span></header>
<main className="p-4 lg:p-6 max-w-[1500px] w-full mx-auto"><Outlet/></main></div></div>}
