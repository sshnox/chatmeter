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

 const snapshot=state.official;
 const used=snapshot?100-snapshot.remaining:0,visual=clamp(used,0,100);
 $('#usedValue').textContent=snapshot?snapshot.remaining+'%':'—';
 $('#snapshotCaption').textContent=snapshot?snapshot.source:'No official information recorded';
 $('#snapshotAge').textContent=snapshot?'Copied '+relative(snapshot.capturedAt):'Not synced';
 $('#percentValue').textContent=snapshot?used+'%':'—';
 $('#ringValue').textContent=snapshot?used+'%':'—';
 $('#planValue').textContent=snapshot?'User-entered':'Not verified';
 $('#modelValue').textContent=snapshot?snapshot.label:'Not recorded';
 $('#resetCountdown').textContent=snapshot&&snapshot.resetAt?countdown(snapshot.resetAt):'Not provided';
 $('#resetDate').textContent=snapshot&&snapshot.resetAt?resetDate(snapshot.resetAt):'No verified reset';
 $('#updatedAt').textContent=snapshot?relative(snapshot.capturedAt):'not yet';
 const fill=$('#progressFill');fill.style.width=(snapshot?visual:0)+'%';fill.style.background='var(--lime)';
 fill.style.boxShadow='0 0 15px color-mix(in srgb, var(--lime) 35%, transparent)';
 const ring=$('#usageRing');ring.style.setProperty('--ring',(snapshot?visual:0)*3.6+'deg');ring.style.setProperty('--ring-color','var(--lime)');
 ring.setAttribute('aria-label',snapshot?used+' percent used as manually copied from ChatGPT':'No official usage snapshot available');
 const badge=$('#statusBadge');badge.textContent='LOCAL ONLY';badge.className='status-badge';
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
 $('#insightText').textContent=past?'Previous 6-day average: '+(past/6).toFixed(1)+' browser-observed prompts/day (not allowance).':'No browser-observed prompts recorded yet. This does not indicate your account usage.';
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
 if(open){const o=state.official;$('#categoryInput').value=o?.label||'';$('#remainingInput').value=o?String(o.remaining):'';$('#officialResetInput').value=o?.resetAt?new Date(o.resetAt).toLocaleDateString('sv-SE')+'T'+new Date(o.resetAt).toTimeString().slice(0,5):'';$('#remainingInput').focus();}else focusBefore?.focus();
}
function wire(){
 $$('.segment').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.tab)));
 $('#logUsageButton').addEventListener('click',()=>setDrawer(true));
 $('#settingsButton').addEventListener('click',()=>setDrawer(true));
 $('#footerSettingsButton').addEventListener('click',()=>setDrawer(true));
 $('#closeSettingsButton').addEventListener('click',()=>setDrawer(false));
 $('#drawerScrim').addEventListener('click',()=>setDrawer(false));
 $('#openUsageButton').addEventListener('click',()=>chrome?.tabs?.create?chrome.tabs.create({url:'https://chatgpt.com/'}):window.open('https://chatgpt.com/','_blank','noopener'));
 $('#saveSnapshotButton').addEventListener('click',async()=>{
   const input=$('#remainingInput'),value=Number(input.value);
   if(input.value.trim()===''||!Number.isInteger(value)||value<0||value>100){window.alert('Enter the whole-number percentage shown in ChatGPT (0–100).');input.focus();return;}
   const resetText=$('#officialResetInput').value;
   const resetAt=resetText?new Date(resetText).toISOString():null;
   if(await act('CHATMETER_UPDATE',{official:{remaining:value,label:$('#categoryInput').value,resetAt}}))setDrawer(false);
 });
 $('#clearSnapshotButton').addEventListener('click',async()=>{if(await act('CHATMETER_UPDATE',{official:null}))setDrawer(false);});
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
