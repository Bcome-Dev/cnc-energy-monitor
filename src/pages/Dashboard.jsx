import {useState} from 'react';import {Link} from 'react-router-dom';import {Activity,Gauge,Zap,Wallet,Cpu,Factory,Lightbulb,Fan,Plug} from 'lucide-react';
import {LineChart,Line,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer} from 'recharts';
import {useMonitor} from '../hooks/useMonitor';import {Card,Stat,Badge,RangeSelect,Empty,Page,ChartBox} from '../components/ui';import {RANGES} from '../config/defaults';import {fmt,rupiah,tm,dtm,hourLabel,inRange,downsample,bucket} from '../utils/format';
export default function Dashboard(){const{latest:l,conn,settings:st,samples,energyToday,costToday,alerts}=useMonitor();const[rk,setRk]=useState('6h');const ms=RANGES.find(r=>r.k===rk).ms;
const live=samples.slice(-60).map(s=>({t:tm(s.ts),p:+s.p.toFixed(1)}));const eb=bucket(inRange(samples,Math.max(ms,3.6e6*2)),'hour').map(b=>({label:b.label,kwh:+b.kwh.toFixed(3)}));
const off=!conn.online;const rel=conn.relays;const rc=on=>off?'gray':on?'green':'gray';
const Row=({ic:I,l,children})=><div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm"><span className="flex items-center gap-2 text-slate-600"><I size={16} className="text-amber-500"/>{l}</span>{children}</div>;
return<Page title="Dashboard" desc="Ringkasan kondisi energi dan operasional mesin CNC.">
{off&&<div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">ESP32 terputus. Nilai di bawah adalah pembacaan terakhir pada {dtm(conn.lastSeen)}, bukan data saat ini.</div>}
<div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
<Stat icon={Activity} label="Tegangan" value={fmt(l?.v)} unit="V" warn={l&&(l.v<st.vMin||l.v>st.vMax)} sub={`Batas ${st.vMin}-${st.vMax} V`}/>
<Stat icon={Gauge} label="Arus" value={fmt(l?.i,2)} unit="A" warn={l&&l.i>st.iMax} sub={`Batas ${st.iMax} A`}/>
<Stat icon={Zap} label="Daya (estimasi)" value={fmt(l?.p,0)} unit="W" warn={l&&l.p>st.powerLimit} sub={`Ambang ${st.powerLimit} W`}/>
<Stat icon={Plug} label="Energi hari ini" value={fmt(energyToday,2)} unit="kWh" warn={energyToday>st.energyLimit} sub={`Batas ${st.energyLimit} kWh/hari`}/>
<Stat icon={Wallet} label="Biaya hari ini" value={rupiah(costToday)} sub={`Tarif contoh ${rupiah(st.tariff)}/kWh`}/></div>
<div className="grid lg:grid-cols-3 gap-4">
<Card title="Status sistem" className="lg:col-span-1">
<Row ic={Cpu} l="ESP32"><Badge tone={off?'red':'green'}>{off?'Offline':'Online'}</Badge></Row>
<Row ic={Factory} l="Mesin CNC"><Badge tone={off?'gray':l?.run?'green':'gray'}>{off?'Tidak diketahui':l?.run?'Beroperasi':'Idle'}</Badge></Row>
<Row ic={Lightbulb} l="Relay 1 - Lampu dop"><Badge tone={rc(rel[1].on)}>{off?'Tidak tersedia':rel[1].on?'ON':'OFF'}</Badge></Row>
<Row ic={Fan} l="Relay 2 - Kipas 5V"><Badge tone={rc(rel[2].on)}>{off?'Tidak tersedia':rel[2].on?'ON':'OFF'}</Badge></Row>
<p className="text-xs text-slate-500 mt-3">Pembaruan terakhir: {dtm(conn.lastSeen)}. Status mesin berasal dari jadwal simulasi, belum dari sensor.</p></Card>
<Card title="Daya real-time (60 sampel terakhir)" className="lg:col-span-2"><ChartBox h={230}><ResponsiveContainer><LineChart data={live}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="t" tick={{fontSize:11}} minTickGap={30}/><YAxis tick={{fontSize:11}} unit=" W" width={55} domain={['auto','auto']}/><Tooltip formatter={v=>[v+' W','Daya']}/><Line type="monotone" dataKey="p" name="Daya (W)" stroke="#f59e0b" dot={false} strokeWidth={2} isAnimationActive={false}/></LineChart></ResponsiveContainer></ChartBox></Card></div>
<div className="grid lg:grid-cols-3 gap-4">
<Card title="Konsumsi energi per jam" right={<RangeSelect value={rk} onChange={setRk}/>} className="lg:col-span-2">{eb.length?<ChartBox><ResponsiveContainer><BarChart data={eb}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fontSize:11}} minTickGap={20}/><YAxis tick={{fontSize:11}} unit=" kWh" width={65}/><Tooltip formatter={v=>[v+' kWh','Energi']}/><Bar dataKey="kwh" name="Energi (kWh)" fill="#0f1b2d"/></BarChart></ResponsiveContainer></ChartBox>:<Empty/>}</Card>
<Card title="Peringatan terbaru" right={<Link className="text-xs text-amber-600 font-medium" to="/peringatan">Lihat semua</Link>}>{alerts.length?alerts.slice(0,5).map(a=><div key={a.id} className="py-2 border-b border-slate-100 last:border-0 text-sm"><div className="flex justify-between gap-2"><span className="font-medium">{a.type}</span><Badge tone={a.level==='Kritis'?'red':'amber'}>{a.level}</Badge></div><div className="text-xs text-slate-500">{dtm(a.ts)} - {a.status}</div></div>):<Empty text="Tidak ada peringatan."/>}</Card></div>
</Page>}
