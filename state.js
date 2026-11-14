(function(root){
'use strict';
const KEY='chatmeter_state_v2';
const numeric=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.trunc(Number(v)))):f;
const validDate=v=>v&&!Number.isNaN(Date.parse(v))?new Date(v).toISOString():null;
function initialState(){return {version:3,official:null,plan:'Not configured',model:'Not detected',used:0,limit:80,cycleHours:3,resetAt:null,updatedAt:null,events:[],totalsByDate:{},prefs:{showPrivacy:true}};}
function clean(value){
const s=value&&typeof value==='object'?value:{};
const o=s.official&&typeof s.official==='object'?s.official:null;
const official=o&&Number.isInteger(o.remaining)&&o.remaining>=0&&o.remaining<=100&&validDate(o.capturedAt)?
 {remaining:o.remaining,capturedAt:validDate(o.capturedAt),resetAt:validDate(o.resetAt),label:typeof o.label==='string'?o.label.slice(0,64):'Account allowance',source:'manually copied from ChatGPT'}:null;
return {...initialState(),official,used:numeric(s.used,0,0,100000000),limit:numeric(s.limit,80,1,9999),cycleHours:numeric(s.cycleHours,3,1,168),resetAt:validDate(s.resetAt),updatedAt:validDate(s.updatedAt),events:Array.isArray(s.events)?s.events.filter(e=>e&&validDate(e.at)).slice(0,200).map(e=>({id:String(e.id||''),title:String(e.title||'Prompt counted'),detail:String(e.detail||'Observed prompt'),at:validDate(e.at)})):[],totalsByDate:s.totalsByDate&&typeof s.totalsByDate==='object'?Object.fromEntries(Object.entries(s.totalsByDate).filter(([k])=>/^\d{4}-\d{2}-\d{2}$/.test(k)).map(([k,v])=>[k,numeric(v,0,0,100000000)])):{},prefs:{showPrivacy:s.prefs?.showPrivacy!==false}};
}
function dayKey(value){const d=new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function advance(value,at){const s=clean(value),now=Date.parse(at)||Date.now();if(s.resetAt&&now>=Date.parse(s.resetAt)){s.used=0;s.resetAt=new Date(now+s.cycleHours*3600000).toISOString();}return s;}
function count(value,at,id){const now=validDate(at)||new Date().toISOString();const s=advance(value,now);if(!s.resetAt)s.resetAt=new Date(Date.parse(now)+s.cycleHours*3600000).toISOString();s.used++;s.updatedAt=now;const k=dayKey(now);s.totalsByDate[k]=(s.totalsByDate[k]||0)+1;s.events.unshift({id:id||String(Date.now()),title:'Prompt counted',detail:'Observed on ChatGPT · 1 message',at:now});s.events=s.events.slice(0,200);return s;}
function settings(value,patch){const s=clean(value);if('official' in patch){
 const o=patch.official;
 if(o===null)s.official=null;
 else if(o&&Number.isInteger(o.remaining)&&o.remaining>=0&&o.remaining<=100){
   s.official={remaining:o.remaining,capturedAt:new Date().toISOString(),resetAt:validDate(o.resetAt),
     label:typeof o.label==='string'&&o.label.trim()?o.label.trim().slice(0,64):'Account allowance',source:'manually copied from ChatGPT'};
 }else throw Error('Enter a whole-number allowance between 0 and 100');
}
if('limit'in patch)s.limit=numeric(patch.limit,s.limit,1,9999);if('cycleHours'in patch){const hours=numeric(patch.cycleHours,s.cycleHours,1,168);if(hours!==s.cycleHours){s.cycleHours=hours;s.resetAt=s.updatedAt?new Date(Date.parse(s.updatedAt)+hours*3600000).toISOString():null;}}if('showPrivacy'in patch)s.prefs.showPrivacy=patch.showPrivacy!==false;return s;}
function days(value,at){const s=clean(value),today=new Date(at||Date.now()),out=[];today.setHours(12,0,0,0);for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);out.push({label:i===0?'Today':d.toLocaleDateString(undefined,{weekday:'short'}),count:s.totalsByDate[dayKey(d)]||0});}return out;}
root.ChatMeterCore={KEY,initialState,clean,advance,count,settings,days};
})(globalThis);
