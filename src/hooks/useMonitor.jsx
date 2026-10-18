import {createContext,useContext,useEffect,useMemo,useState,useCallback} from 'react';
import * as api from '../services/api';import {DEFAULT_SETTINGS} from '../config/defaults';import {buildAlerts} from '../utils/alerts';import {startOfDay} from '../utils/format';
const Ctx=createContext(null);export const useMonitor=()=>useContext(Ctx);
export function MonitorProvider({children}){
const[samples,setSamples]=useState([]);const[settings,setSettings]=useState(DEFAULT_SETTINGS);const[conn,setConn]=useState({online:true,lastSeen:Date.now(),relays:{1:{on:false},2:{on:false}}});
const[loading,setLoading]=useState(true);const[error,setError]=useState(null);const[cmd,setCmd]=useState({});const[handled,setHandled]=useState({});
useEffect(()=>{(async()=>{try{const[h,s,c]=await Promise.all([api.getHistory(),api.getSettings(),api.getConnection()]);setSamples(h);setSettings(s);setConn(c)}catch(e){setError(e.message)}setLoading(false)})()},[]);
useEffect(()=>{if(loading)return;const t=setInterval(async()=>{try{await api.getMonitoring()}catch{}const[h,c]=await Promise.all([api.getHistory(),api.getConnection()]);setSamples(h);setConn(c)},settings.interval*1000);return()=>clearInterval(t)},[loading,settings.interval]);
const sendRelay=useCallback(async(ch,on)=>{setCmd(m=>({...m,[ch]:{state:'pending'}}));try{await api.sendRelayCommand(ch,on);setConn(await api.getConnection());setCmd(m=>({...m,[ch]:{state:'ok',at:Date.now()}}))}catch(e){setCmd(m=>({...m,[ch]:{state:'fail',msg:e.message}}))}},[]);
const save=useCallback(async s=>{await api.saveSettings(s);setSettings(s)},[]);
const latest=samples.at(-1);
const energyToday=useMemo(()=>{if(!latest)return 0;const d=startOfDay(Date.now());const f=samples.find(s=>s.ts>=d);return f?latest.e-f.e:0},[samples,latest]);
const alerts=useMemo(()=>buildAlerts(samples,settings,conn).map(a=>({...a,status:handled[a.id]?'Ditangani':'Aktif'})),[samples,settings,conn,handled]);
const v={samples,latest,settings,conn,loading,error,cmd,sendRelay,save,energyToday,costToday:energyToday*settings.tariff,alerts,handle:id=>setHandled(h=>({...h,[id]:true})),simulated:true};
return<Ctx.Provider value={v}>{children}</Ctx.Provider>}
