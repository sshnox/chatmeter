importScripts('state.js');
const core=globalThis.ChatMeterCore,KEY=core.KEY;
let queue=Promise.resolve();
function transact(fn){
  const result=queue.then(async()=>{
    const stored=await chrome.storage.local.get(KEY);
    const value=fn(core.advance(stored[KEY]||core.initialState(),new Date().toISOString()));
    await chrome.storage.local.set({[KEY]:value});
    return value;
  });
  queue=result.catch(error=>console.error('ChatMeter write failed',error));
  return result;
}
chrome.runtime.onInstalled.addListener(()=>{transact(s=>s).catch(console.error);});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  const supported=['CHATMETER_PROMPT','CHATMETER_GET','CHATMETER_UPDATE','CHATMETER_RESET'];
  if(!message||!supported.includes(message.type))return;
  const url=sender.url||sender.origin||'';
  const fromChatGPT=sender.id===chrome.runtime.id&&/^https:\/\/(chatgpt\.com|chat\.openai\.com)(\/|$)/.test(url);
  const fromPopup=sender.id===chrome.runtime.id&&url.startsWith('chrome-extension://');
  if(message.type==='CHATMETER_PROMPT'?!fromChatGPT&&!fromPopup:!fromPopup){respond({ok:false,error:'Unauthorized source'});return;}
  const operation=message.type==='CHATMETER_RESET'?()=>core.initialState():message.type==='CHATMETER_UPDATE'?s=>core.settings(s,message.patch||{}):message.type==='CHATMETER_PROMPT'?s=>core.count(s,new Date().toISOString(),crypto.randomUUID()):s=>s;
  transact(operation).then(state=>respond({ok:true,state}),error=>respond({ok:false,error:String(error)}));
  return true;
});
