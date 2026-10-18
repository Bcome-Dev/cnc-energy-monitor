export const fmt=(n,d=1)=>n==null||isNaN(n)?'-':Number(n).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
export const rupiah=n=>n==null||isNaN(n)?'-':'Rp '+Math.round(n).toLocaleString('id-ID');
export const tm=ts=>ts?new Date(ts).toLocaleTimeString('id-ID',{hour12:false}):'-';
export const dtm=ts=>ts?new Date(ts).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}):'-';
export const dayLabel=ts=>new Date(ts).toLocaleDateString('id-ID',{day:'2-digit',month:'short'});
export const hourLabel=ts=>new Date(ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false});
export const startOfDay=ts=>new Date(ts).setHours(0,0,0,0);
export const inRange=(s,ms,now=Date.now())=>s.filter(x=>x.ts>=now-ms);
export function downsample(a,n=150){if(a.length<=n)return a;const k=Math.ceil(a.length/n);return a.filter((_,i)=>i%k===0)}
export function bucket(samples,mode){const m=new Map();let prev=null;for(const s of samples){if(prev){const k=mode==='day'?startOfDay(s.ts):Math.floor(s.ts/3.6e6)*3.6e6;const b=m.get(k)||{t:k,kwh:0,pmax:0,psum:0,n:0};b.kwh+=s.e-prev.e;b.pmax=Math.max(b.pmax,s.p);b.psum+=s.p;b.n++;m.set(k,b)}prev=s}
return [...m.values()].map(b=>({...b,label:mode==='day'?dayLabel(b.t):hourLabel(b.t),pavg:b.psum/b.n}))}
export function energyBetween(samples,from,to){let kwh=0;for(let i=1;i<samples.length;i++){const s=samples[i];if(s.ts>=from&&s.ts<=to)kwh+=s.e-samples[i-1].e}return kwh}
