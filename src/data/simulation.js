import {LOADS} from '../config/defaults';
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const running=ts=>{const h=new Date(ts).getHours();return h>=7&&h<16&&h!==12}; // jadwal simulasi, bukan data mesin nyata
export function makeSample(ts,prev,relays,rand){const dtH=prev?(ts-prev.ts)/3.6e6:0;const run=running(ts);
const w=LOADS.controller+(run?LOADS.machine[0]+rand()*(LOADS.machine[1]-LOADS.machine[0]):0)+(relays[1].on?LOADS.lamp:0)+(relays[2].on?LOADS.fan:0);
const v=220+(rand()-.5)*10;const i=w/(v*LOADS.pf);const p=v*i*LOADS.pf; // estimasi, PF diasumsikan
return{ts,v,i,p,e:(prev?prev.e:0)+p*dtH/1000,run,r1:relays[1].on,r2:relays[2].on}}
export function buildHistory(){const r=mulberry(42),rel={1:{on:true},2:{on:true}};const now=Date.now(),step=3e5;const a=[];let prev=null;
for(let t=now-2.592e8;t<now;t+=step){prev=makeSample(t,prev,rel,r);a.push(prev)}return a}
