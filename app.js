const core=globalThis.ChatMeterCore,KEY=core.KEY;
const hasStorage=typeof chrome!=='undefined'&&Boolean(chrome.storage?.local&&chrome.runtime?.sendMessage);
let state=core.initialState();
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function relative(iso){if(!iso)return 'not yet';const min=Math.max(0,Math.round((Date.now()-Date.parse(iso))/60000));return min<1?'just now':min<60?min+'m ago':min<1440?Math.floor(min/60)+'h ago':Math.floor(min/1440)+'d ago';}
function countdown(iso){if(!iso)return 'Not started';const ms=Date.parse(iso)-Date.now();return ms<=0?'Window ended':Math.floor(ms/3600000)+'h '+String(Math.floor(ms%3600000/60000)).padStart(2,'0')+'m';}
function resetDate(iso){return iso?new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Starts with first prompt';}
function status(r){return r>=.85?{label:'WATCH LIMIT',css:'danger',color:'var(--red)'}:r>=.65?{label:'WATCH',css:'warning',color:'var(--orange)'}:{label:'NORMAL',css:'',color:'var(--lime)'};}
function renderActivity(){
 const list=$('#activityList');list.replaceChildren();
 $('#activityCount').textContent=state.events.length;
 $('#activityTotal').textContent=state.events.length+' recent events';
 if(!state.events.length){const item=document.createElement('p');item.textContent='No prompts tracked yet.';list.append(item);return;}
 for(const event of state.events.slice(0,30)){
  const row=document.createElement('div');row.className='activity-item';
  const icon=document.createElement('span');icon.className='activity-icon';icon.textContent='↗';
  const copy=document.createElement('div');copy.className='activity-copy';
  const title=document.createElement('strong');title.textContent=event.title;
  const detail=document.createElement('span');detail.textContent=event.detail;copy.append(title,detail);
  const at=document.createElement('span');at.className='activity-time';at.textContent=relative(event.at);
  row.append(icon,copy,at);list.append(row);
 }
}
function render(){
 state=core.advance(state,new Date().toISOString());
 const ratio=state.used/state.limit,percent=Math.round(ratio*100),visual=clamp(percent,0,100),s=status(ratio);
 $('#usedValue').textContent=state.used;$('#limitValue').textContent=state.limit;
 $('#remainingValue').textContent=Math.max(0,state.limit-state.used);
 $('#percentValue').textContent=percent+'%';$('#ringValue').textContent=percent+'%';
 $('#planValue').textContent=state.plan;$('#modelValue').textContent=state.model;
 $('#resetCountdown').textContent=countdown(state.resetAt);
 $('#resetDate').textContent=resetDate(state.resetAt);
 $('#updatedAt').textContent=relative(state.updatedAt);
 const fill=$('#progressFill');fill.style.width=visual+'%';fill.style.background=s.color;
 fill.style.boxShadow='0 0 15px color-mix(in srgb, '+s.color+' 35%, transparent)';
 const ring=$('#usageRing');ring.style.setProperty('--ring',visual*3.6+'deg');ring.style.setProperty('--ring-color',s.color);
 ring.setAttribute('aria-label',percent+' percent of configured estimate');
 const badge=$('#statusBadge');badge.textContent=s.label;badge.className='status-badge '+s.css;
 $('#limitInput').value=state.limit;$('#cycleHoursInput').value=state.cycleHours;
 $('#privacyToggle').checked=state.prefs.showPrivacy;$('#privacyCard').hidden=!state.prefs.showPrivacy;
 const rows=core.days(state),container=$('#dailyBars');container.replaceChildren();
 const max=Math.max(1,...rows.map(item=>item.count));
 for(const item of rows){
  const row=document.createElement('div');row.className='bar-row'+(item.label==='Today'?' today':'');
  const name=document.createElement('span');name.textContent=item.label;
  const track=document.createElement('div');track.className='day-track';
  const bar=document.createElement('i');bar.style.width=item.count/max*100+'%';track.append(bar);
  const value=document.createElement('strong');value.textContent=item.count;
  row.append(name,track,value);container.append(row);
 }
 const past=rows.slice(0,6).reduce((sum,item)=>sum+item.count,0);
 $('#insightText').textContent=past?'Previous 6-day average: '+(past/6).toFixed(1)+' observed prompts/day.':'Tracking begins with your first observed prompt.';
 renderActivity();
}
async function send(type,patch){
 if(hasStorage){
  const response=await chrome.runtime.sendMessage({type,patch});
  if(!response?.ok)throw new Error(response?.error||'Storage operation failed');
  state=core.clean(response.state);
 }else{
  if(type==='CHATMETER_RESET')state=core.initialState();
  else if(type==='CHATMETER_PROMPT')state=core.count(state,new Date().toISOString());
  else if(type==='CHATMETER_UPDATE')state=core.settings(state,patch);
  localStorage.setItem(KEY,JSON.stringify(state));
 }
 render();
}
async function act(type,patch){try{await send(type,patch);return true;}catch(error){console.error(error);window.alert('ChatMeter could not save. Please try again.');return false;}}
function setTab(tab){
 const overview=tab==='overview';
 $('#overviewPanel').classList.toggle('is-visible',overview);
 $('#overviewPanel').setAttribute('aria-hidden',String(!overview));
 $('#activityPanel').classList.toggle('is-visible',!overview);
 $('#activityPanel').setAttribute('aria-hidden',String(overview));
 $$('.segment').forEach(btn=>{const active=btn.dataset.tab===tab;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',String(active));});
}
let focusBefore=null;
function setDrawer(open){
 if(open)focusBefore=document.activeElement;
 const drawer=$('#settingsDrawer');drawer.classList.toggle('is-open',open);drawer.setAttribute('aria-hidden',String(!open));
 $('#drawerScrim').hidden=!open;
 if(open)$('#limitInput').focus();else focusBefore?.focus();
}
function wire(){
 $$('.segment').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.tab)));
 $('#logUsageButton').addEventListener('click',()=>act('CHATMETER_PROMPT'));
 $('#settingsButton').addEventListener('click',()=>setDrawer(true));
 $('#footerSettingsButton').addEventListener('click',()=>setDrawer(true));
 $('#closeSettingsButton').addEventListener('click',()=>setDrawer(false));
 $('#drawerScrim').addEventListener('click',()=>setDrawer(false));
 $('#limitInput').addEventListener('change',()=>act('CHATMETER_UPDATE',{limit:Number($('#limitInput').value)}));
 $('#cycleHoursInput').addEventListener('change',()=>act('CHATMETER_UPDATE',{cycleHours:Number($('#cycleHoursInput').value)}));
 $('#privacyToggle').addEventListener('change',()=>act('CHATMETER_UPDATE',{showPrivacy:$('#privacyToggle').checked}));
 $('#resetDataButton').addEventListener('click',async()=>{if(window.confirm('Reset all locally tracked ChatMeter data?')&&await act('CHATMETER_RESET'))setDrawer(false);});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape')setDrawer(false);
  if(event.key==='Tab'&&$('#settingsDrawer').classList.contains('is-open')){
   const controls=$$('#settingsDrawer button, #settingsDrawer input').filter(el=>!el.disabled),first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 });
 if(hasStorage)chrome.storage.onChanged.addListener(changes=>{if(changes[KEY]?.newValue){state=core.clean(changes[KEY].newValue);render();}});
}
async function boot(){
 if(hasStorage){try{const response=await chrome.runtime.sendMessage({type:'CHATMETER_GET'});if(!response?.ok)throw Error(response?.error);state=core.clean(response.state);}catch(error){console.error('ChatMeter startup failed',error);}}
 else{try{state=core.clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{state=core.initialState();}}
 wire();render();setInterval(render,30000);
}
boot();
