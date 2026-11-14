/* Detect a newly rendered user message following a user send action. No prompt text leaves the page. */
(()=>{
 const selector='[data-message-author-role="user"]',seen=new WeakSet();
 let armedUntil=0,lastCount=0;
 const scan=()=>document.querySelectorAll(selector).forEach(node=>seen.add(node));
 scan();
 function hasPrompt(){
  const el=document.querySelector('#prompt-textarea, textarea, [contenteditable="true"][data-testid*="composer"]');
  return Boolean(el&&(el.value||el.innerText||el.textContent||'').trim());
 }
 function arm(){if(hasPrompt())armedUntil=Date.now()+10000;}
 function detect(){
  let added=false;
  document.querySelectorAll(selector).forEach(node=>{
   if(seen.has(node))return;
   if((node.innerText||node.textContent||'').trim()){seen.add(node);added=true;}
  });
  if(!added||Date.now()>armedUntil||Date.now()-lastCount<1000)return;
  armedUntil=0;lastCount=Date.now();
  chrome.runtime.sendMessage({type:'CHATMETER_PROMPT'}).catch(()=>{});
 }
 document.addEventListener('keydown',event=>{
  if(!event.isTrusted||event.isComposing||event.key!=='Enter'||event.shiftKey||event.ctrlKey||event.altKey||event.metaKey)return;
  const target=event.target;
  if(target instanceof HTMLElement&&(target.matches('textarea,#prompt-textarea')||target.isContentEditable))arm();
 },true);
 document.addEventListener('click',event=>{
  if(!event.isTrusted)return;
  const button=event.target instanceof Element&&event.target.closest('button[aria-label*="Send" i],button[data-testid*="send" i]');
  if(button&&!button.disabled)arm();
 },true);
 new MutationObserver(detect).observe(document.documentElement,{childList:true,subtree:true});
})();
