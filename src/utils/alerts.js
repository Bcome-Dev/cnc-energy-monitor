import {startOfDay} from './format';
export function buildAlerts(samples,st,conn){const out=[];const cut=Date.now()-8.64e7;let f={};let dayStart=null,dayE=0,dayHit=false;
const chk=(key,bad,s,type,param,val,lim,unit,sev)=>{if(bad&&!f[key])out.push({id:key+s.ts,type,param,value:val,limit:lim,unit,ts:s.ts,level:sev});f[key]=bad};
for(const s of samples){const d=startOfDay(s.ts);if(d!==dayStart){dayStart=d;dayE=s.e;dayHit=false}
if(s.ts<cut)continue;
if(!dayHit&&s.e-dayE>st.energyLimit){dayHit=true;out.push({id:'e'+s.ts,type:'Konsumsi energi melewati batas',param:'Energi harian',value:s.e-dayE,limit:st.energyLimit,unit:'kWh',ts:s.ts,level:'Kritis'})}
chk('p',s.p>st.powerLimit,s,'Daya melewati ambang batas','Daya',s.p,st.powerLimit,'W',s.p>st.powerLimit*1.1?'Kritis':'Peringatan');
chk('i',s.i>st.iMax,s,'Arus melewati ambang batas','Arus',s.i,st.iMax,'A',s.i>st.iMax*1.1?'Kritis':'Peringatan');
chk('v',s.v<st.vMin||s.v>st.vMax,s,'Tegangan di luar rentang','Tegangan',s.v,s.v<st.vMin?st.vMin:st.vMax,'V','Peringatan')}
if(!conn.online)out.push({id:'off'+conn.lastSeen,type:'ESP32 terputus dari sistem',param:'Koneksi',value:null,limit:null,unit:'',ts:Date.now(),level:'Kritis'});
return out.sort((a,b)=>b.ts-a.ts).slice(0,200)}
